import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Types for Supabase persistence
export interface SupabaseEvaluationRecord {
  id?: string;
  student_id: string;
  student_name: string;
  subject: string;
  set_number?: string;
  question_serial?: string;
  obtained_marks: number;
  total_marks: number;
  evaluator_name?: string;
  comments?: any[];
  drawings?: string[];
  status?: string;
  created_at?: string;
}

// Database Helper Functions
export async function saveScriptToSupabase(record: SupabaseEvaluationRecord) {
  if (!supabase) {
    console.warn("Supabase is not configured yet. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    return { data: null, error: new Error("Supabase credentials missing in .env") };
  }
  try {
    const { data, error } = await supabase
      .from('evaluations')
      .upsert([record], { onConflict: 'id' })
      .select();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function fetchScriptsFromSupabase() {
  if (!supabase) {
    return { data: null, error: new Error("Supabase credentials missing in .env") };
  }
  try {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

// Supabase Auth Helpers
export async function signUpWithSupabase(email: string, pass: string) {
  if (!supabase) return { error: new Error("Supabase is not configured.") };
  return await supabase.auth.signUp({ email, password: pass });
}

export async function signInWithSupabase(email: string, pass: string) {
  if (!supabase) return { error: new Error("Supabase is not configured.") };
  return await supabase.auth.signInWithPassword({ email, password: pass });
}

export async function signOutFromSupabase() {
  if (!supabase) return { error: new Error("Supabase is not configured.") };
  return await supabase.auth.signOut();
}
