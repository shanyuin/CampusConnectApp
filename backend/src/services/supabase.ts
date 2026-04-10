// supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lhsmbkgtxkfohxdndhhf.supabase.co";
const supabaseKey = "sb_publishable_Sian5C7vTwjiRNEr8JBl9w_9Gy_GiBf";

export const supabase = createClient(supabaseUrl, supabaseKey);