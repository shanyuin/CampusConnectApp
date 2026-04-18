"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginWithErpCredentials = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = require("./supabase");
const JWT_SECRET = (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "dev-secret-change-me";
const JWT_EXPIRATION = "8h";
const normalizeErpId = (erpId) => erpId.trim().toUpperCase();
const resolveErpId = (row) => { var _a, _b; return (_b = (_a = row.erpid) !== null && _a !== void 0 ? _a : row.erp_id) !== null && _b !== void 0 ? _b : ""; };
const resolvePasswordHash = (row) => { var _a, _b; return (_b = (_a = row.password_hash) !== null && _a !== void 0 ? _a : row.password) !== null && _b !== void 0 ? _b : ""; };
const mapAuthUser = (row) => {
    var _a;
    return ({
        id: row.id,
        erpId: resolveErpId(row),
        name: row.name,
        role: (_a = row.role) !== null && _a !== void 0 ? _a : null,
    });
};
class AuthService {
    // LOGIN WITH ERPID + PASSWORD
    static login(erpid, password) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const normalizedErpId = normalizeErpId(erpid);
            const { data: rowsByErpid, error: erpidError } = yield supabase_1.supabase
                .from("users")
                .select("*")
                .ilike("erpid", normalizedErpId)
                .limit(25);
            const { data: rowsByLegacy, error: legacyError } = yield supabase_1.supabase
                .from("users")
                .select("*")
                .ilike("erp_id", normalizedErpId)
                .limit(25);
            if (erpidError && legacyError) {
                throw new Error("User not found");
            }
            const rows = [...(rowsByErpid !== null && rowsByErpid !== void 0 ? rowsByErpid : []), ...(rowsByLegacy !== null && rowsByLegacy !== void 0 ? rowsByLegacy : [])];
            if (rows.length === 0) {
                throw new Error("User not found");
            }
            const data = (_a = rows.find((row) => normalizeErpId(resolveErpId(row)) === normalizedErpId)) !== null && _a !== void 0 ? _a : rows[0];
            const passwordHash = resolvePasswordHash(data);
            if (!passwordHash) {
                throw new Error("Password not configured for this user");
            }
            let isMatch = false;
            if (passwordHash.startsWith("$2")) {
                isMatch = yield bcryptjs_1.default.compare(password, passwordHash);
            }
            else {
                isMatch = password === passwordHash;
            }
            if (!isMatch) {
                throw new Error("Invalid password");
            }
            return {
                erpid: resolveErpId(data),
                name: data.name,
                dept: (_b = data.dept) !== null && _b !== void 0 ? _b : "",
            };
        });
    }
    // OPTIONAL: REGISTER USER
    static register(erpid, password, name, dept) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalizedErpId = normalizeErpId(erpid);
            const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
            const { error } = yield supabase_1.supabase.from("users").insert([
                {
                    erpid: normalizedErpId,
                    password: hashedPassword,
                    name,
                    dept,
                },
            ]);
            if (error) {
                throw new Error(error.message);
            }
        });
    }
    // STORE FCM TOKEN
    static storeFcmToken(erpid, fcmToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalizedErpId = normalizeErpId(erpid);
            const { error } = yield supabase_1.supabase
                .from("fcm_tokens")
                .upsert({ erpid: normalizedErpId, token: fcmToken }, { onConflict: 'erpid' });
            if (error) {
                throw new Error(error.message);
            }
        });
    }
}
const loginWithErpCredentials = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const erpId = normalizeErpId(payload.erpId);
    const password = payload.password.trim();
    if (!erpId || !password) {
        throw new Error("ERP ID and password are required.");
    }
    const user = yield AuthService.login(erpId, password);
    const token = jsonwebtoken_1.default.sign({
        sub: user.erpid,
        erpId: user.erpid,
        name: user.name,
        role: null,
    }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
    return {
        token,
        user: mapAuthUser({
            id: user.erpid,
            erpid: user.erpid,
            name: user.name,
            role: null,
            dept: user.dept,
        }),
    };
});
exports.loginWithErpCredentials = loginWithErpCredentials;
exports.default = AuthService;
