import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Annotation {
  type: 'underline' | 'tick' | 'cross' | 'text' | 'circle' | 'score';
  top: number; // percentage
  left: number; // percentage
  width?: number; // percentage (for underline)
  text?: string;
  color?: string;
}

export interface EvaluationResult {
  studentId: string;
  studentName: string;
  totalScore: string;
  maxScore: string;
  comments: string;
  extractionSummary: string;
  markingRubric: string[];
  annotations: Annotation[];
}

const fileToPart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const evaluateScript = async (
  subject: string,
  instructions: string,
  solutionFiles: File[],
  studentFiles: File[]
): Promise<EvaluationResult> => {
  const solutionParts = await Promise.all(solutionFiles.map(fileToPart));
  const studentParts = await Promise.all(studentFiles.map(fileToPart));

  const prompt = `
    You are an expert examiner. Your task is to evaluate a student's answer script based on a provided solution key and strict marking instructions.

    Subject: ${subject}
    
    ENGINE INSTRUCTIONS:
    ${instructions}

    INSTRUCTIONS:
    1. EXTRACT ALL TEXT from the solution key images. This text represents the 'Ideal Answer' and 'Marking Scheme'.
    2. EXTRACT ALL TEXT from the student's answer script images.
    3. COMPARE the student's text to the solution key text conceptualy, logically, and literally.
    4. EVALUATE LIKE A HUMAN EXAMINER: 
       - Look for core concepts mentioned in the solution.
       - Identify spelling mistakes (use the 'underline' and 'text' annotations to mark them, e.g., "বানান ভুল: [word]").
       - Identify where the student followed the instructions or missed points.
       - Award partial marks if the logic is correct but the answer is incomplete.
    5. Generate annotations for the student's script to visually show:
       - Red underlines for spelling/factual errors.
       - Green ticks for correct points.
       - Score badges for internal marks.
    6. Calculate the final total score based on the rubric.
    7. Provide an 'extractionSummary' (the exact text or key points extracted from the solution key).
    8. Provide a 'markingRubric' (the derived marking rules that you used to grade this script).

    ANNOTATION RULES:
    - type 'tick': Green tick (✓) for correct points. Place it to the right of the correct statement.
    - type 'cross': Red cross (✕) for incorrect points. Place it to the right of the incorrect statement.
    - type 'text': Red feedback text (e.g. "এটি মূলের বৈশিষ্ট্য"). Place it next to a 'cross' or where the mistake is.
    - type 'underline': Red underline for specific word errors.
    - type 'score': Large red marks (e.g. "02") at the bottom left of the script.
    
    Return the result in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      { parts: [{ text: prompt }] },
      { parts: solutionParts },
      { parts: studentParts }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          studentId: { type: Type.STRING },
          studentName: { type: Type.STRING },
          totalScore: { type: Type.STRING },
          maxScore: { type: Type.STRING },
          comments: { type: Type.STRING },
          extractionSummary: { type: Type.STRING },
          markingRubric: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          annotations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['underline', 'tick', 'cross', 'text', 'circle', 'score'] },
                top: { type: Type.NUMBER },
                left: { type: Type.NUMBER },
                width: { type: Type.NUMBER },
                text: { type: Type.STRING },
                color: { type: Type.STRING }
              },
              required: ['type', 'top', 'left']
            }
          }
        },
        required: ['totalScore', 'maxScore', 'annotations']
      }
    }
  });

  return JSON.parse(response.text);
};
