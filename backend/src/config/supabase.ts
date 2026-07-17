import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const configuredServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configuredPublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseKey =
  configuredServiceRoleKey ??
  configuredPublishableKey ??
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is required.");
}

if (!supabaseKey) {
  throw new Error(
    "A Supabase key is required. Set SUPABASE_SERVICE_ROLE_KEY or a fallback publishable/anon key.",
  );
}

if (!configuredServiceRoleKey) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY is not set. Some database operations may be blocked by RLS.");
} else if (configuredServiceRoleKey.startsWith("sb_publishable_")) {
  console.warn(
    "SUPABASE_SERVICE_ROLE_KEY looks like a publishable key. Use the service role secret from the Supabase project settings for database access.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

