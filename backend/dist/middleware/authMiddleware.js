"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticateRequest = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "dev-secret-change-me";
const authenticateRequest = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer ")) ? authHeader.slice(7) : null;
    if (!token) {
        res.status(401).json({ error: "Missing authorization token." });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.authUser = decoded;
        next();
    }
    catch (_error) {
        res.status(401).json({ error: "Invalid or expired authorization token." });
    }
};
exports.authenticateRequest = authenticateRequest;
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
    var _a;
    const role = (_a = req.authUser) === null || _a === void 0 ? void 0 : _a.role;
    if (!role || !allowedRoles.includes(role)) {
        res.status(403).json({ error: "You are not allowed to access this resource." });
        return;
    }
    next();
};
exports.authorizeRoles = authorizeRoles;
