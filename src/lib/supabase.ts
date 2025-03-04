
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vyidxrwfhwfcvmyelrpz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5aWR4cndmaHdmY3ZteWVscnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMTg4MDAsImV4cCI6MjA1NjY5NDgwMH0.dTUDKsWXiLbxvSws6wKCpc2ZPFC0_dwshoSBKmSWArc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
