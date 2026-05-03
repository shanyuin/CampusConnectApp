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
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateFromTable = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const supabase_1 = require("../supabase");
const normalizeIdentifier = (value) => value.trim().toUpperCase();
const resolveFirstString = (row, keys) => {
    for (const key of keys) {
        const value = row[key];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return "";
};
const resolvePasswordHash = (row, passwordColumns) => resolveFirstString(row, passwordColumns);
const resolveRowId = (row, fallback) => {
    if (typeof row.id === "string" && row.id.trim()) {
        return row.id.trim();
    }
    if (typeof row.id === "number") {
        return String(row.id);
    }
    return fallback;
};
const comparePassword = (password, storedValue) => __awaiter(void 0, void 0, void 0, function* () {
    if (!storedValue) {
        return false;
    }
    if (storedValue.startsWith("$2")) {
        return bcryptjs_1.default.compare(password, storedValue);
    }
    return password === storedValue;
});
const authenticateFromTable = (config, erpId, password) => __awaiter(void 0, void 0, void 0, function* () {
    const normalizedErpId = normalizeIdentifier(erpId);
    const { data, error } = yield supabase_1.supabase.from(config.tableName).select("*").limit(200);
    if (error) {
        throw new Error(error.message);
    }
    const matchingRow = (data !== null && data !== void 0 ? data : []).find((row) => {
        const rowErpId = resolveFirstString(row, config.idColumns);
        return normalizeIdentifier(rowErpId) === normalizedErpId;
    });
    if (!matchingRow) {
        throw new Error(`${config.role} account not found.`);
    }
    const storedPassword = resolvePasswordHash(matchingRow, config.passwordColumns);
    const isMatch = yield comparePassword(password, storedPassword);
    if (!isMatch) {
        throw new Error("Invalid password.");
    }
    const resolvedErpId = resolveFirstString(matchingRow, config.idColumns);
    const resolvedName = resolveFirstString(matchingRow, config.nameColumns) || `${config.role} user`;
    return {
        id: resolveRowId(matchingRow, resolvedErpId),
        erpId: resolvedErpId,
        name: resolvedName,
        role: config.role,
    };
});
exports.authenticateFromTable = authenticateFromTable;
