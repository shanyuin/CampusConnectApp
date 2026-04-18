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
const firebaseAdmin_1 = require("./services/firebaseAdmin");
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
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
        console.log("this is login response", loginResponse);
        res.json(loginResponse);
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
}));
app.post("/api/auth/store-fcm-token", authMiddleware_1.authenticateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const erpId = (_a = req.authUser) === null || _a === void 0 ? void 0 : _a.erpId;
        const { fcmToken } = req.body;
        console.log("this route got hit", erpId);
        if (!fcmToken) {
            return res.status(400).json({ error: "FCM token is required" });
        }
        const { error } = yield supabase_1.supabase
            .from('fcm_tokens')
            .upsert({ erpid: erpId, token: fcmToken }, { onConflict: 'token' });
        if (error) {
            console.error('Error saving token:', error);
            return res.status(500).json({ error: 'Failed to save token' });
        }
        console.log("saved the token");
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
app.post("/api/send-notification", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("🔥 RAW BODY:", req.body);
        const { erpid } = req.body;
        if (!erpid) {
            console.log("❌ ERPID missing");
            return res.status(400).json({ error: "erpid is required" });
        }
        console.log("✅ ERPID:", erpid);
        yield (0, firebaseAdmin_1.sendNotification)(erpid);
        res.json({ success: true });
    }
    catch (error) {
        console.error("❌ ERROR:", error);
        res.status(500).json({ error: error.message });
    }
}));
app.get("/api/attendance", authMiddleware_1.authenticateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        res.json({ attendance: data });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
}));
app.post("/api/attendance", authMiddleware_1.authenticateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield (0, firebaseAdmin_1.sendNotification)(erpId);
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
