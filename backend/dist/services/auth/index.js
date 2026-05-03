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
exports.authenticateByRole = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const facultyAuth_1 = require("./facultyAuth");
const guardAuth_1 = require("./guardAuth");
const JWT_SECRET = (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "dev-secret-change-me";
const JWT_EXPIRATION = "7d";
const ROLE_HANDLERS = {
    faculty: facultyAuth_1.authenticateFaculty,
    guard: guardAuth_1.authenticateGuard,
};
const normalizeErpId = (erpId) => erpId.trim().toUpperCase();
const authenticateByRole = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const erpId = normalizeErpId(payload.erpId);
    const password = payload.password.trim();
    const role = payload.role;
    if (!erpId || !password || !role) {
        throw new Error("ERP ID, password, and role are required.");
    }
    const authHandler = ROLE_HANDLERS[role];
    if (!authHandler) {
        throw new Error("Unsupported role.");
    }
    const user = yield authHandler(erpId, password);
    const token = jsonwebtoken_1.default.sign({
        sub: user.id,
        erpId: user.erpId,
        name: user.name,
        role: user.role,
    }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
    return {
        success: true,
        token,
        role: user.role,
        user,
    };
});
exports.authenticateByRole = authenticateByRole;
