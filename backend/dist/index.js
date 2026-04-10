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
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const supabase_1 = require("./services/supabase");
const authMiddleware_1 = require("./middleware/authMiddleware");
const authService_1 = require("./services/authService");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.send("Server is running");
});
app.post("/api/auth/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const loginResponse = yield (0, authService_1.loginWithErpCredentials)(req.body);
        res.json(loginResponse);
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
}));
app.get("/api/attendance", authMiddleware_1.authenticateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const erpIdRaw = String((_b = (_a = req.authUser) === null || _a === void 0 ? void 0 : _a.erpId) !== null && _b !== void 0 ? _b : "").trim();
        console.log("Attendance lookup ERP ID:", erpIdRaw, "token type:", typeof ((_c = req.authUser) === null || _c === void 0 ? void 0 : _c.erpId));
        let { data, error } = yield supabase_1.supabase
            .from("attendance_logs")
            .select("*")
            .eq("erpid", erpIdRaw)
            .order("date", { ascending: false });
        if (!error && (!data || data.length === 0) && /^\d+$/.test(erpIdRaw)) {
            const erpIdAsNumber = Number(erpIdRaw);
            const fallback = yield supabase_1.supabase
                .from("attendance_logs")
                .select("*")
                .eq("erpid", erpIdAsNumber)
                .order("date", { ascending: false });
            data = fallback.data;
            error = fallback.error;
        }
        console.log("Attendance rows:", (_d = data === null || data === void 0 ? void 0 : data.length) !== null && _d !== void 0 ? _d : 0);
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        return res.json({ attendance: data });
    }
    catch (err) {
        console.log("ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
}));
app.listen(5000, "0.0.0.0", () => {
    console.log("Server running on port 5000");
});
