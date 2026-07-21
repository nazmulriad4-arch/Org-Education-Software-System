import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as XLSX from "xlsx";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running with Cloud SQL integration" });
  });

  app.post("/api/sync-sheets", async (req, res) => {
    const { spreadsheetId, gid, accessToken } = req.body;
    if (!spreadsheetId || !accessToken) {
      return res.status(400).json({ error: "Missing spreadsheetId or accessToken" });
    }

    console.log(`Sync sheets requested for spreadsheetId: ${spreadsheetId}, gid: ${gid}`);

    // CSV Parser helper
    function parseCSV(text: string): string[][] {
      const result: string[][] = [];
      let row: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (inQuotes) {
          if (char === '"') {
            if (nextChar === '"') {
              current += '"';
              i++; // Skip next quote
            } else {
              inQuotes = false;
            }
          } else {
            current += char;
          }
        } else {
          if (char === '"') {
            inQuotes = true;
          } else if (char === ',') {
            row.push(current);
            current = '';
          } else if (char === '\r' || char === '\n') {
            row.push(current);
            current = '';
            if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
              result.push(row);
            }
            row = [];
            if (char === '\r' && nextChar === '\n') {
              i++; // Skip the '\n' in '\r\n'
            }
          } else {
            current += char;
          }
        }
      }
      if (current !== '' || row.length > 0) {
        row.push(current);
        result.push(row);
      }
      return result;
    }

    try {
      // Attempt 1: Fetch via Direct CSV Export Endpoint (CORS-free on server)
      const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`;
      console.log(`Attempting fetch from export URL: ${exportUrl}`);
      
      const exportRes = await fetch(exportUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (exportRes.ok) {
        const text = await exportRes.text();
        // If the response is HTML, it means Google redirected us to a login page or error page
        if (text.trim().startsWith("<!DOCTYPE") || text.includes("<html") || text.includes("Google Accounts")) {
          console.warn("Direct export returned HTML page instead of CSV. Falling back to Sheets API v4...");
        } else {
          const rows = parseCSV(text);
          console.log(`Direct CSV export successful. Found ${rows.length} rows.`);
          return res.json({ success: true, source: 'csv-export', rows });
        }
      } else {
        console.warn(`Direct CSV export failed with status: ${exportRes.status} ${exportRes.statusText}`);
      }

      try {
        // Attempt 2: Fallback to Google Sheets API v4 (metadata + values)
        console.log("Attempting fallback fetch via Google Sheets API v4...");
        const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(sheetId,title))`;
        const metaRes = await fetch(metaUrl, {
          headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (!metaRes.ok) {
          const errorText = await metaRes.text();
          throw new Error(`Sheets API metadata fetch failed with status ${metaRes.status}: ${errorText}`);
        }

        const metaData = await metaRes.json();
        const sheets = metaData.sheets || [];
        const targetSheet = sheets.find((s: any) => String(s.properties?.sheetId) === String(gid || '0'));
        
        const sheetTitle = targetSheet ? targetSheet.properties.title : (sheets[0]?.properties?.title || 'Sheet1');
        console.log(`Sheets API v4: Resolved sheet title is "${sheetTitle}" for gid "${gid}"`);

        const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A:K`;
        const valuesRes = await fetch(valuesUrl, {
          headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (!valuesRes.ok) {
          const errorText = await valuesRes.text();
          throw new Error(`Sheets API values fetch failed with status ${valuesRes.status}: ${errorText}`);
        }

        const valuesData = await valuesRes.json();
        const rows = valuesData.values || [];
        console.log(`Sheets API v4 fetch successful. Found ${rows.length} rows.`);
        return res.json({ success: true, source: 'sheets-api', rows });
      } catch (err2: any) {
        console.warn(`Attempt 2 (Sheets API) failed: ${err2.message || err2}. Proceeding to Attempt 3 (Drive API + XLSX)...`);
        
        // Attempt 3: Drive API binary download + XLSX parse (for Office files / xlsx)
        console.log("Attempting binary download via Google Drive API (fallback for Office/xlsx files)...");
        const driveUrl = `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?alt=media`;
        const driveRes = await fetch(driveUrl, {
          headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (!driveRes.ok) {
          const errorText = await driveRes.text();
          throw new Error(`Drive API file download failed with status ${driveRes.status}: ${errorText}`);
        }

        const arrayBuffer = await driveRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Match Sheet by gid or default to first sheet
        let targetSheetName = workbook.SheetNames[0];
        const sheetsMeta = workbook.Workbook?.Sheets || [];
        const foundSheetMeta = sheetsMeta.find((s: any) => {
          return String(s.sheetId) === String(gid) || String(s.id) === String(gid);
        });
        if (foundSheetMeta && foundSheetMeta.name) {
          targetSheetName = foundSheetMeta.name;
        }
        console.log(`XLSX Parser: Matching sheet "${targetSheetName}" for gid "${gid}"`);

        const worksheet = workbook.Sheets[targetSheetName];
        if (!worksheet) {
          throw new Error(`Sheet "${targetSheetName}" not found in downloaded Excel file.`);
        }

        // Convert worksheet to raw 2D array matching Google Sheets format exactly
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });
        console.log(`Drive API download + XLSX parse successful. Found ${rows.length} rows.`);
        return res.json({ success: true, source: 'drive-xlsx', rows });
      }

    } catch (error: any) {
      console.error("All sync attempts failed:", error);
      return res.status(500).json({ 
        error: error.message || "Unknown error during sync",
        details: error.stack 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
