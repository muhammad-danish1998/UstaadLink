import { createBrowserClient } from '@supabase/ssr';

const FALLBACK_SUPABASE_URL = 'https://prtuehndaifjcdzomrrd.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydHVlaG5kYWlmamNkem9tcnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDU2ODcsImV4cCI6MjEwNDc4MTY4N30.4jT8BypwoHwjFGA4DFEJUl-i-SB-Yry9_V53gqsZpsM';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

  return createBrowserClient(url, key);
}
