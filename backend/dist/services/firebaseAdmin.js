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
exports.messaging = void 0;
exports.sendNotification = sendNotification;
const admin = __importStar(require("firebase-admin"));
const supabase_1 = require("./supabase");
const { FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, } = process.env;
if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
    throw new Error('Missing Firebase environment variables');
}
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            project_id: FIREBASE_PROJECT_ID,
            client_email: FIREBASE_CLIENT_EMAIL,
            private_key: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
    });
}
exports.messaging = admin.messaging();
const MAX_TOKENS_PER_REQUEST = 500;
const PERMANENT_INVALID_CODES = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
]);
function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size)
        out.push(arr.slice(i, i + size));
    return out;
}
function normalizeEventType(value) {
    return value === 'logout' ? 'logout' : 'login';
}
function buildNotificationContent(eventType) {
    if (eventType === 'logout') {
        return {
            title: 'Attendance Updated',
            body: 'Your logout has been recorded',
        };
    }
    return {
        title: 'Attendance Marked',
        body: 'Your login has been recorded',
    };
}
function sendNotification(erpid_1) {
    return __awaiter(this, arguments, void 0, function* (erpid, eventTypeInput = 'login') {
        const erpidStr = String(erpid).trim();
        const eventType = normalizeEventType(eventTypeInput);
        const notificationContent = buildNotificationContent(eventType);
        if (!erpidStr) {
            console.warn('sendNotification called without erpid');
            return { successCount: 0, failureCount: 0, deletedCount: 0 };
        }
        try {
            const { data, error } = yield supabase_1.supabase
                .from('fcm_tokens')
                .select('token')
                .eq('erpid', erpidStr);
            if (error) {
                console.error('Error fetching tokens:', error);
                return { successCount: 0, failureCount: 0, deletedCount: 0 };
            }
            const tokens = [...new Set((data !== null && data !== void 0 ? data : []).map((r) => r.token).filter(Boolean))];
            if (tokens.length === 0) {
                console.log(`No tokens found for erpid: ${erpidStr}`);
                return { successCount: 0, failureCount: 0, deletedCount: 0 };
            }
            let successCount = 0;
            let failureCount = 0;
            const invalidTokensToDelete = new Set();
            for (const tokenBatch of chunk(tokens, MAX_TOKENS_PER_REQUEST)) {
                const message = {
                    tokens: tokenBatch,
                    notification: {
                        title: notificationContent.title,
                        body: notificationContent.body,
                    },
                    data: {
                        type: 'attendance',
                        attendanceType: eventType,
                        erpid: erpidStr, // must be string
                    },
                    android: {
                        priority: 'high',
                        notification: {
                            channelId: 'attendance_alerts',
                            sound: 'attendance_tone',
                        },
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: 'default',
                            },
                        },
                    },
                };
                const resp = yield exports.messaging.sendEachForMulticast(message);
                successCount += resp.successCount;
                failureCount += resp.failureCount;
                resp.responses.forEach((r, idx) => {
                    var _a;
                    if (r.success)
                        return;
                    const code = (_a = r.error) === null || _a === void 0 ? void 0 : _a.code;
                    const token = tokenBatch[idx];
                    console.log('FCM send error:', code, 'token:', token);
                    if (code && PERMANENT_INVALID_CODES.has(code)) {
                        invalidTokensToDelete.add(token);
                    }
                });
            }
            let deletedCount = 0;
            if (invalidTokensToDelete.size > 0) {
                const dead = [...invalidTokensToDelete];
                const { error: deleteError, count } = yield supabase_1.supabase
                    .from('fcm_tokens')
                    .delete({ count: 'exact' })
                    .in('token', dead);
                if (deleteError) {
                    console.error('Failed to delete invalid tokens:', deleteError);
                }
                else {
                    deletedCount = count !== null && count !== void 0 ? count : 0;
                }
            }
            console.log('Notification summary:', {
                erpid: erpidStr,
                eventType,
                totalTokens: tokens.length,
                successCount,
                failureCount,
                deletedCount,
            });
            return { successCount, failureCount, deletedCount };
        }
        catch (err) {
            console.error('Error sending notification:', err);
            return { successCount: 0, failureCount: 0, deletedCount: 0 };
        }
    });
}
