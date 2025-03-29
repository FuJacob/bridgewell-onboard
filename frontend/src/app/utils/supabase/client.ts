import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  console.log("Initializing Supabase client with URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("Supabase anon key available:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
