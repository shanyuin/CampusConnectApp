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
const firebaseAdmin_1 = require("./services/firebaseAdmin");
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.send("Server is running");
});
app.use("/api/auth", authRoutes_1.default);
app.post("/api/send-notification", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("🔥 RAW BODY:", req.body);
        const { erpid, type } = req.body;
        if (!erpid) {
            console.log("❌ ERPID missing");
            return res.status(400).json({ error: "erpid is required" });
        }
        console.log("✅ ERPID:", erpid);
        yield (0, firebaseAdmin_1.sendNotification)(erpid, type);
        res.json({ success: true });
    }
    catch (error) {
        console.error("❌ ERROR:", error);
        res.status(500).json({ error: error.message });
    }
}));
app.get("/api/attendance", authMiddleware_1.authenticateRequest, (0, authMiddleware_1.authorizeRoles)("faculty"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const erpId = (_a = req.authUser) === null || _a === void 0 ? void 0 : _a.erpId;
        const todayIst = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
        }).format(new Date());
        const { data, error } = yield supabase_1.supabase
            .from("attendance_logs")
            .select("*")
            .eq("erpid", erpId)
            .eq("date", todayIst)
            .or("login_time.not.is.null,logout_time.not.is.null")
            .limit(1);
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        const normalizedAttendance = (data !== null && data !== void 0 ? data : []).map((item) => {
            var _a, _b;
            return (Object.assign(Object.assign({}, item), { effective_logout_time: (_b = (_a = item.final_logout_time) !== null && _a !== void 0 ? _a : item.logout_time) !== null && _b !== void 0 ? _b : null }));
        });
        res.json({ attendance: normalizedAttendance });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
}));
app.get("/api/attendance/history", authMiddleware_1.authenticateRequest, (0, authMiddleware_1.authorizeRoles)("faculty"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const erpId = (_a = req.authUser) === null || _a === void 0 ? void 0 : _a.erpId;
        const { data, error } = yield supabase_1.supabase
            .from("attendance_logs")
            .select("*")
            .eq("erpid", erpId)
            .order("date", { ascending: false })
            .order("login_time", { ascending: false, nullsFirst: false })
            .limit(100);
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        const normalizedAttendance = (data !== null && data !== void 0 ? data : []).map((item) => {
            var _a, _b;
            return (Object.assign(Object.assign({}, item), { effective_logout_time: (_b = (_a = item.final_logout_time) !== null && _a !== void 0 ? _a : item.logout_time) !== null && _b !== void 0 ? _b : null }));
        });
        res.json({ attendance: normalizedAttendance });
    }
    catch (_err) {
        res.status(500).json({ error: "Server error" });
    }
}));
app.post("/api/attendance", authMiddleware_1.authenticateRequest, (0, authMiddleware_1.authorizeRoles)("faculty"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const erpId = (_a = req.authUser) === null || _a === void 0 ? void 0 : _a.erpId;
        const attendanceData = req.body; // Assume { date, shift, etc. }
        // Insert into attendance_logs
        const { data, error } = yield supabase_1.supabase
            .from("attendance_logs")
            .insert(Object.assign(Object.assign({}, attendanceData), { erpid: erpId }))
            .select();
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        // Trigger notification
        yield (0, firebaseAdmin_1.sendNotification)(erpId, "login");
        res.json({ success: true, data });
    }
    catch (err) {
        console.error("ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
}));
app.get("/test", (req, res) => {
    console.log("🔥 TEST HIT");
    res.send("ok");
});
app.use("/api", notificationRoutes_1.default);
const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
