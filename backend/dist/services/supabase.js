"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = (_a = process.env.SUPABASE_URL) !== null && _a !== void 0 ? _a : "https://lhsmbkgtxkfohxdndhhf.supabase.co";
const supabaseKey = (_c = (_b = process.env.SUPABASE_SERVICE_ROLE_KEY) !== null && _b !== void 0 ? _b : process.env.SUPABASE_ANON_KEY) !== null && _c !== void 0 ? _c : "sb_publishable_Sian5C7vTwjiRNEr8JBl9w_9Gy_GiBf";
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY is not set. Queries may be blocked by RLS.");
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});
