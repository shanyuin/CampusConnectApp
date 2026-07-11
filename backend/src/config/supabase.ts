import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL ?? "https://lhsmbkgtxkfohxdndhhf.supabase.co";
const configuredServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configuredPublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseKey =
  configuredServiceRoleKey ??
  configuredPublishableKey ??
  process.env.SUPABASE_ANON_KEY ??
  "sb_publishable_Sian5C7vTwjiRNEr8JBl9w_9Gy_GiBf";

if (!configuredServiceRoleKey) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY is not set. Queries may be blocked by RLS.");
} else if (configuredServiceRoleKey.startsWith("sb_publishable_")) {
  console.warn(
    "SUPABASE_SERVICE_ROLE_KEY looks like a publishable key. Use the service role secret from the Supabase project settings for database access.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
