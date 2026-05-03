"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFcmToken = exports.storeFcmToken = exports.login = void 0;
const authService_1 = __importStar(require("../services/authService"));
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const loginResponse = yield (0, authService_1.loginWithErpCredentials)(req.body);
        res.json(loginResponse);
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
});
exports.login = login;
const storeFcmToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const erpId = (_a = req.authUser) === null || _a === void 0 ? void 0 : _a.erpId;
        const { fcmToken } = req.body;
        if (!erpId) {
            res.status(400).json({ error: "ERP ID is required." });
            return;
        }
        if (!fcmToken) {
            res.status(400).json({ error: "FCM token is required." });
            return;
        }
        yield authService_1.default.storeFcmToken(erpId, fcmToken);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.storeFcmToken = storeFcmToken;
const removeFcmToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const erpId = (_a = req.authUser) === null || _a === void 0 ? void 0 : _a.erpId;
        if (!erpId) {
            res.status(400).json({ error: "ERP ID is required." });
            return;
        }
        const { error } = yield (yield Promise.resolve().then(() => __importStar(require("../services/supabase")))).supabase
            .from("fcm_tokens")
            .delete()
            .eq("erpid", erpId);
        if (error) {
            res.status(500).json({ error: "Failed to remove token." });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.removeFcmToken = removeFcmToken;
