import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jpkpifxctubvauwjvimd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwa3BpZnhjdHVidmF1d2p2aW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5ODg2NDYsImV4cCI6MjA3MjU2NDY0Nn0.A7cXsrpIsN4TdEIV77wWRSBa-kf9YlHv-vZARlm2p20';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);