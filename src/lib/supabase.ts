
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vyidxrwfhwfcvmyelrpz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn('Missing Supabase anon key - authentication will not work properly');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
