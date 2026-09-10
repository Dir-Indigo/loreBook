import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bsqbmuelahfcbqmhtths.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcWJtdWVsYWhmY2JxbWh0dGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNDY0MzUsImV4cCI6MjEwNDYyMjQzNX0.epiqvi-7A5PWmHuJJSCKVUCAXpUbKyBKRTCHPY90IUs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
