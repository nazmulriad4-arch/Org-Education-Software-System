import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

interface Member {
  pin: string;
  name: string;
  designation: string;
  department: string;
  fullName: string;
  contactNumber: string;
  organization: string;
  branch: string;
  campus: string;
  bloodGroup: string;
  officeEmail: string;
}

const FALLBACK_MEMBERS: Member[] = [];

export default function MemberDirectory() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | null }>({ text: '', type: null });

  // Form Fields State
  const [org, setOrg] = useState('');
  const [branch, setBranch] = useState('');
  const [campus, setCampus] = useState('');
  const [dept, setDept] = useState('');
  const [blood, setBlood] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [pinSearch, setPinSearch] = useState('');
  const [limit, setLimit] = useState('100');

  // Trigger filters on click of "Search" button
  const [appliedFilters, setAppliedFilters] = useState({
    org: '',
    branch: '',
    campus: '',
    dept: '',
    blood: '',
    nameSearch: '',
    pinSearch: '',
    limit: 100
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Load members from Firestore on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "member_directory_chunks"));
        const chunks: any[] = [];
        querySnapshot.forEach((docSnap) => {
          chunks.push(docSnap.data());
        });
        
        chunks.sort((a, b) => (a.index || 0) - (b.index || 0));
        
        const allMembers: Member[] = [];
        chunks.forEach(c => {
          if (Array.isArray(c.members)) {
            allMembers.push(...c.members);
          }
        });

        if (allMembers.length > 0) {
          setMembers(allMembers);
        } else {
          // Default fallback data
          setMembers(FALLBACK_MEMBERS);
        }
      } catch (err) {
        console.error("Error loading member directory:", err);
        setMembers(FALLBACK_MEMBERS);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync / Import Google Sheet
  const handleImportGoogleSheet = async () => {
    setSyncing(true);
    setSyncMessage({ text: 'Connecting to Google Sheets...', type: 'info' });
    try {
      const authInstance = getAuth();
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
      
      const result = await signInWithPopup(authInstance, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error('Google authentication succeeded but did not return an access token.');
      }

      setSyncMessage({ text: 'Syncing with Google Sheets via secure proxy...', type: 'info' });
      
      const spreadsheetId = '1d-UBrxLxgVb38MlmqN2GZBHnmWQBW0nM';
      const gid = '1367660387';
      
      const syncRes = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          spreadsheetId,
          gid,
          accessToken
        })
      });

      if (!syncRes.ok) {
        const errJson = await syncRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to sync via proxy: ${syncRes.statusText}`);
      }

      const syncData = await syncRes.json();
      const rows = syncData.rows || [];
      
      if (rows.length === 0) {
        throw new Error('No data found in spreadsheet.');
      }

      // Check if row 0 is header
      const firstRow = rows[0].map((val: any) => String(val).trim().toLowerCase());
      const hasHeader = firstRow.includes('pin') || firstRow.includes('name');
      const startIndex = hasHeader ? 1 : 0;
      
      const parsed: Member[] = [];
      for (let i = startIndex; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0) continue;
        parsed.push({
          pin: r[0] !== undefined ? String(r[0]).trim() : '',
          name: r[1] !== undefined ? String(r[1]).trim() : '',
          designation: r[2] !== undefined ? String(r[2]).trim() : '',
          department: r[3] !== undefined ? String(r[3]).trim() : '',
          fullName: r[4] !== undefined ? String(r[4]).trim() : '',
          contactNumber: r[5] !== undefined ? String(r[5]).trim() : '',
          organization: r[6] !== undefined ? String(r[6]).trim() : '',
          branch: r[7] !== undefined ? String(r[7]).trim() : '',
          campus: r[8] !== undefined ? String(r[8]).trim() : '',
          bloodGroup: r[9] !== undefined ? String(r[9]).trim() : '',
          officeEmail: r[10] !== undefined ? String(r[10]).trim() : ''
        });
      }

      if (parsed.length === 0) {
        throw new Error('Could not parse any member records from sheet.');
      }

      setSyncMessage({ text: `Saving ${parsed.length} members to Firestore database...`, type: 'info' });
      
      // Save chunks to Firestore
      const chunkSize = 300;
      const batch = writeBatch(db);
      
      // Clear current chunks
      const chunksSnap = await getDocs(collection(db, "member_directory_chunks"));
      chunksSnap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      
      // Save new chunks
      for (let i = 0; i < parsed.length; i += chunkSize) {
        const chunk = parsed.slice(i, i + chunkSize);
        const chunkId = `chunk_${Math.floor(i / chunkSize)}`;
        const chunkRef = doc(db, "member_directory_chunks", chunkId);
        batch.set(chunkRef, {
          members: chunk,
          index: Math.floor(i / chunkSize),
          total: parsed.length,
          updatedAt: new Date().toISOString()
        });
      }
      
      await batch.commit();
      
      setMembers(parsed);
      setSyncMessage({ text: `সফলভাবে ${parsed.length} জন মেম্বার তথ্য Google Sheet থেকে সিঙ্ক করা হয়েছে!`, type: 'success' });
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Google Sheets sync failed:", err);
      setSyncMessage({ text: `গুগল শিট সিঙ্ক ব্যর্থ হয়েছে: ${err.message || err}`, type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  // Clear all member data
  const handleClearAllData = async () => {
    if (!window.confirm("আপনি কি নিশ্চিত যে আপনি সকল মেম্বার ডাটা মুছে ফেলতে চান? এটি ডাটাবেস থেকেও মুছে যাবে।")) {
      return;
    }
    setSyncing(true);
    setSyncMessage({ text: 'সকল মেম্বার ডাটা মুছে ফেলা হচ্ছে...', type: 'info' });
    try {
      const batch = writeBatch(db);
      const chunksSnap = await getDocs(collection(db, "member_directory_chunks"));
      chunksSnap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      setMembers([]);
      setSyncMessage({ text: 'সফলভাবে সকল মেম্বার ডাটা মুছে ফেলা হয়েছে।', type: 'success' });
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Failed to clear data:", err);
      setSyncMessage({ text: `ডাটা মুছতে ব্যর্থ হয়েছে: ${err.message || err}`, type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  // Get unique options from members list to populate dropdowns
  const filterOptions = useMemo(() => {
    const orgs = new Set<string>();
    const branches = new Set<string>();
    const campuses = new Set<string>();
    const depts = new Set<string>();
    const bloods = new Set<string>();

    members.forEach(m => {
      if (m.organization) orgs.add(m.organization);
      if (m.branch) branches.add(m.branch);
      if (m.campus) campuses.add(m.campus);
      if (m.department) depts.add(m.department);
      if (m.bloodGroup) bloods.add(m.bloodGroup);
    });

    return {
      organizations: Array.from(orgs).sort(),
      branches: Array.from(branches).sort(),
      campuses: Array.from(campuses).sort(),
      departments: Array.from(depts).sort(),
      bloodGroups: Array.from(bloods).sort()
    };
  }, [members]);

  // When "Search" button is clicked
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      org,
      branch,
      campus,
      dept,
      blood,
      nameSearch,
      pinSearch,
      limit: parseInt(limit, 10) || 100
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setOrg('');
    setBranch('');
    setCampus('');
    setDept('');
    setBlood('');
    setNameSearch('');
    setPinSearch('');
    setLimit('100');
    setAppliedFilters({
      org: '',
      branch: '',
      campus: '',
      dept: '',
      blood: '',
      nameSearch: '',
      pinSearch: '',
      limit: 100
    });
    setCurrentPage(1);
  };

  // Process and Filter Data
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (appliedFilters.org && m.organization !== appliedFilters.org) return false;
      if (appliedFilters.branch && m.branch !== appliedFilters.branch) return false;
      if (appliedFilters.campus && m.campus !== appliedFilters.campus) return false;
      if (appliedFilters.dept && m.department !== appliedFilters.dept) return false;
      if (appliedFilters.blood && m.bloodGroup !== appliedFilters.blood) return false;
      
      if (appliedFilters.nameSearch) {
        const query = appliedFilters.nameSearch.toLowerCase();
        const matchesName = (m.name || '').toLowerCase().includes(query);
        const matchesFullName = (m.fullName || '').toLowerCase().includes(query);
        if (!matchesName && !matchesFullName) return false;
      }
      
      if (appliedFilters.pinSearch) {
        const query = appliedFilters.pinSearch.trim();
        if ((m.pin || '') !== query) return false;
      }
      
      return true;
    });
  }, [members, appliedFilters]);

  // Pagination Logic
  const itemsPerPage = appliedFilters.limit;
  const totalEntries = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = useMemo(() => {
    return filteredMembers.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredMembers, indexOfFirstItem, indexOfLastItem]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredMembers.length === 0) {
      alert("এক্সপোর্ট করার জন্য কোনো তথ্য নেই।");
      return;
    }
    
    const headers = [
      "Pin",
      "Name",
      "Designation",
      "Department",
      "Full Name",
      "Contact Number",
      "Organization",
      "Branch",
      "Campus",
      "Blood Group",
      "Office Email"
    ];
    
    // Construct CSV with BOM for correct Bengali character display in Excel
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...filteredMembers.map(m => [
        `"${(m.pin || '').replace(/"/g, '""')}"`,
        `"${(m.name || '').replace(/"/g, '""')}"`,
        `"${(m.designation || '').replace(/"/g, '""')}"`,
        `"${(m.department || '').replace(/"/g, '""')}"`,
        `"${(m.fullName || '').replace(/"/g, '""')}"`,
        `"${(m.contactNumber || '').replace(/"/g, '""')}"`,
        `"${(m.organization || '').replace(/"/g, '""')}"`,
        `"${(m.branch || '').replace(/"/g, '""')}"`,
        `"${(m.campus || '').replace(/"/g, '""')}"`,
        `"${(m.bloodGroup || '').replace(/"/g, '""')}"`,
        `"${(m.officeEmail || '').replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `member_directory_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate pagination page numbers matching screenshot exactly with ellipsis
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show page 1, 2, 3, 4, 5 ... totalPages
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="flex-1 flex flex-col w-full p-4 md:p-6 bg-[#f8fafc] overflow-y-auto font-sans" id="member-directory-container">
      {/* Header bar styled precisely like the blue banner */}
      <div className="w-full bg-[#002d5b] text-white rounded-t px-4 py-3 shadow-md flex justify-between items-center flex-shrink-0">
        <h2 className="text-base font-bold tracking-wide font-sans">Member Directory</h2>
        
        <div className="flex items-center gap-2">
          {/* Delete All Data Button */}
          <button
            onClick={handleClearAllData}
            disabled={syncing}
            className="bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 text-white font-semibold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete All Data
          </button>
          
          {/* Google Sheets Sync Integration Button */}
          <button
            onClick={handleImportGoogleSheet}
            disabled={syncing}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Importing...' : 'Sync with Google Sheets'}
          </button>
        </div>
      </div>

      <div className="w-full bg-white border-x border-b border-gray-200 p-4 md:p-5 shadow-sm rounded-b flex flex-col gap-5">
        
        {/* Sync message banner */}
        {syncMessage.text && (
          <div className={`p-3 rounded text-xs flex items-center gap-2 border ${
            syncMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            syncMessage.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {syncMessage.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
            {syncMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
            {syncMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />}
            <span className="font-medium">{syncMessage.text}</span>
            {syncMessage.type !== 'info' && (
              <button 
                onClick={() => setSyncMessage({ text: '', type: null })}
                className="ml-auto hover:underline font-bold text-gray-500 pl-2"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Filters Panel exactly like the screenshot design */}
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-3 items-end">
          
          <div className="xl:col-span-2 flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-700">Organization</label>
            <div className="relative">
              <select
                value={org}
                onChange={e => setOrg(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-white font-medium"
              >
                <option value="">Select Organization</option>
                {filterOptions.organizations.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="xl:col-span-2 flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-700">Branch</label>
            <div className="relative">
              <select
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-white font-medium"
              >
                <option value="">Select Branch</option>
                {filterOptions.branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="xl:col-span-2 flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-700">Campus</label>
            <div className="relative">
              <select
                value={campus}
                onChange={e => setCampus(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-white font-medium"
              >
                <option value="">Select Campus</option>
                {filterOptions.campuses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="xl:col-span-2 flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-700">Department</label>
            <div className="relative">
              <select
                value={dept}
                onChange={e => setDept(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-white font-medium"
              >
                <option value="">Select Department</option>
                {filterOptions.departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="xl:col-span-1 flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-700">Blood</label>
            <div className="relative">
              <select
                value={blood}
                onChange={e => setBlood(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-white font-medium"
              >
                <option value="">Select Blood Group</option>
                {filterOptions.bloodGroups.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="xl:col-span-1 flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-700">Name</label>
            <input
              type="text"
              placeholder="Name"
              value={nameSearch}
              onChange={e => setNameSearch(e.target.value)}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="xl:col-span-1 flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-700">Pin</label>
            <input
              type="text"
              placeholder="Pin"
              value={pinSearch}
              onChange={e => setPinSearch(e.target.value)}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="xl:col-span-1 flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-700">Limit</label>
            <input
              type="number"
              placeholder="100"
              value={limit}
              onChange={e => setLimit(e.target.value)}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-center"
            />
          </div>

          {/* Action buttons styled exactly like screenshot */}
          <div className="xl:col-span-1 flex gap-1.5 justify-end">
            <button
              type="submit"
              className="bg-[#002d5b] hover:bg-[#001e3d] text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1 shadow-sm active:scale-[0.98] transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </button>
            
            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-[#107c41] hover:bg-[#0b592e] text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1 shadow-sm active:scale-[0.98] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            
            <button
              type="button"
              onClick={handleReset}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200 text-xs font-semibold px-2 py-1.5 rounded active:scale-[0.98] transition-colors cursor-pointer"
              title="Reset Filters"
            >
              Clear
            </button>
          </div>
        </form>

        {/* Member list table container */}
        <div className="border border-gray-200 rounded overflow-hidden shadow-2xs flex-1 min-h-[400px]">
          {loading ? (
            <div className="w-full h-96 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-[#002d5b] animate-spin" />
              <p className="text-xs text-gray-500 font-medium">মেম্বার ডিরেক্টরি লোড করা হচ্ছে...</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full max-h-[600px] overflow-y-auto">
              <table className="w-full border-collapse text-left text-xs font-sans">
                <thead className="bg-[#f8fafc] border-b border-gray-200 sticky top-0 z-10 text-gray-700 font-semibold">
                  <tr>
                    <th className="border-r border-gray-200 px-3 py-3 text-center font-bold">Pin</th>
                    <th className="border-r border-gray-200 px-3 py-3 font-bold">Name</th>
                    <th className="border-r border-gray-200 px-3 py-3 font-bold">Designation</th>
                    <th className="border-r border-gray-200 px-3 py-3 font-bold">Department</th>
                    <th className="border-r border-gray-200 px-3 py-3 font-bold">Full Name</th>
                    <th className="border-r border-gray-200 px-3 py-3 font-bold">Contact Number</th>
                    <th className="border-r border-gray-200 px-3 py-3 font-bold">Organization</th>
                    <th className="border-r border-gray-200 px-3 py-3 font-bold">Branch</th>
                    <th className="border-r border-gray-200 px-3 py-3 font-bold">Campus</th>
                    <th className="border-r border-gray-200 px-3 py-3 text-center font-bold">Blood Group</th>
                    <th className="px-3 py-3 font-bold">Office Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-600 font-medium">
                  {currentMembers.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-20 text-gray-400 font-medium">
                        কোনো মেম্বার রেকর্ড পাওয়া যায়নি। সিঙ্ক বা সার্চ ফিল্টার পরিবর্তন করুন।
                      </td>
                    </tr>
                  ) : (
                    currentMembers.map((m, index) => (
                      <tr 
                        key={`${m.pin}-${index}`} 
                        className="hover:bg-blue-50/20 odd:bg-white even:bg-[#fafbfc] transition-colors"
                      >
                        <td className="border-r border-gray-200 px-3 py-3 text-center text-gray-900 font-mono font-bold">{m.pin}</td>
                        <td className="border-r border-gray-200 px-3 py-3 text-gray-900 font-semibold">{m.name}</td>
                        <td className="border-r border-gray-200 px-3 py-3">{m.designation}</td>
                        <td className="border-r border-gray-200 px-3 py-3">{m.department}</td>
                        <td className="border-r border-gray-200 px-3 py-3 text-gray-700">{m.fullName}</td>
                        <td className="border-r border-gray-200 px-3 py-3 font-mono">{m.contactNumber}</td>
                        <td className="border-r border-gray-200 px-3 py-3 text-xs font-bold text-gray-700">{m.organization}</td>
                        <td className="border-r border-gray-200 px-3 py-3">{m.branch}</td>
                        <td className="border-r border-gray-200 px-3 py-3">{m.campus}</td>
                        <td className="border-r border-gray-200 px-3 py-3 text-center">
                          <span className="inline-block px-2 py-0.5 font-bold rounded bg-rose-50 border border-rose-100 text-rose-700 text-[10px]">
                            {m.bloodGroup}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-blue-600 font-medium break-all">{m.officeEmail || '--'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info & Pagination matching image structure exactly */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-sans text-gray-500 pt-1">
          <div>
            Showing <span className="font-bold text-gray-800">{totalEntries === 0 ? 0 : indexOfFirstItem + 1}</span> to{' '}
            <span className="font-bold text-gray-800">{Math.min(indexOfLastItem, totalEntries)}</span> of{' '}
            <span className="font-bold text-gray-800">{totalEntries.toLocaleString()}</span> entries
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-1 border border-gray-300 rounded overflow-hidden shadow-3xs">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-300 font-medium border-r border-gray-200 flex items-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                Previous
              </button>
              
              {pageNumbers.map((p, idx) => {
                if (p === "...") {
                  return (
                    <span key={`ell-${idx}`} className="px-3 py-1.5 bg-gray-50 text-gray-400 font-semibold border-r border-gray-200">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={`p-${p}`}
                    onClick={() => setCurrentPage(Number(p))}
                    className={`px-3 py-1.5 border-r border-gray-200 font-bold transition-all cursor-pointer ${
                      currentPage === p
                        ? 'bg-[#002d5b] text-white'
                        : 'bg-white hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-300 font-medium flex items-center transition-colors cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
