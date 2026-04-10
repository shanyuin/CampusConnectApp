"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
// supabase.ts
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = "https://lhsmbkgtxkfohxdndhhf.supabase.co";
const supabaseKey = "sb_publishable_Sian5C7vTwjiRNEr8JBl9w_9Gy_GiBf";
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
