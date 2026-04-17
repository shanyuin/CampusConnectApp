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
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerNotification = exports.saveToken = void 0;
const supabase_1 = require("../services/supabase");
const firebaseAdmin_1 = require("../services/firebaseAdmin");
const saveToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { erpid, token } = req.body;
        if (!erpid || !token) {
            return res.status(400).json({ error: 'erpid and token are required' });
        }
        // Upsert the token
        const { error } = yield supabase_1.supabase
            .from('fcm_tokens')
            .upsert({ erpid, token }, { onConflict: 'erpid' } // Assuming token is unique
        );
        if (error) {
            console.error('Error saving token:', error);
            return res.status(500).json({ error: 'Failed to save token' });
        }
        res.json({ success: true, message: 'Token saved successfully' });
    }
    catch (error) {
        console.error('Error in saveToken:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.saveToken = saveToken;
const triggerNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { erpid } = req.body;
        if (!erpid) {
            return res.status(400).json({ error: 'erpid is required' });
        }
        yield (0, firebaseAdmin_1.sendNotification)(erpid);
        res.json({ success: true, message: 'Notification sent' });
    }
    catch (error) {
        console.error('Error in triggerNotification:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});
exports.triggerNotification = triggerNotification;
