
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string | undefined => {
  // 1. Try import.meta.env (Vite standard)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const val = (import.meta as any).env[`VITE_${key}`] || (import.meta as any).env[key];
    if (val && val !== 'undefined' && val !== 'null') return val;
  }

  // 2. Try process.env (Node.js / Vite define)
  if (typeof process !== 'undefined' && process.env) {
    const val = process.env[`VITE_${key}`] || process.env[key];
    if (val && val !== 'undefined' && val !== 'null') return val;
  }

  return undefined;
};

// Attempt to get keys using standard names and fallbacks for common typos seen in the environment strings
const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || getEnv('SUPBASE_ANON_KEY');

// Check if the URL is a placeholder
const isPlaceholder = (url: string | undefined) => {
  if (!url) return true;
  const placeholders = ['YOUR_PROJECT', 'your-project', 'example.supabase.co', 'placeholder'];
  return placeholders.some(p => url.includes(p));
};

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http') && !isPlaceholder(supabaseUrl)) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  if (isPlaceholder(supabaseUrl)) {
    console.warn("Supabase is using a placeholder URL. Please set a real SUPABASE_URL in your environment variables.");
  } else {
    console.warn("Supabase Client could not be initialized. Check SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
}
