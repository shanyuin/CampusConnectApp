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
        const payload = req.body;
        const loginResponse = yield (0, authService_1.loginWithErpCredentials)(payload);
        res.status(200).json(loginResponse);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Login failed.";
        const statusCode = message.includes("required") ? 400 : 401;
        res.status(statusCode).json({ error: message });
    }
}));
app.get("/api/auth/me", authMiddleware_1.authenticateRequest, (req, res) => {
    if (!req.authUser) {
        res.status(401).json({ error: "Unauthorized." });
        return;
    }
    res.status(200).json({
        user: {
            id: req.authUser.sub,
            erpId: req.authUser.erpId,
            name: req.authUser.name,
            role: req.authUser.role,
        },
    });
});
app.listen(5000, () => {
    console.log("Server running on port 5000");
});
