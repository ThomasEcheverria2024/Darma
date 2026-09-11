import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const normalizedSupabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/i, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export const supabase =
  normalizedSupabaseUrl && supabaseAnonKey
    ? createClient(normalizedSupabaseUrl, supabaseAnonKey)
    : null;
