import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Check if Supabase env credentials are fully configured.
 */
export function isSupabaseConfigured() {
  return (
    process.env.REACT_APP_SUPABASE_URL &&
    process.env.REACT_APP_SUPABASE_ANON_KEY &&
    process.env.REACT_APP_SUPABASE_URL !== "https://placeholder-project.supabase.co"
  );
}
