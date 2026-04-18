import * as admin from 'firebase-admin';
import { supabase } from './supabase';

const {
    FIREBASE_PROJECT_ID,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_CLIENT_EMAIL,
} = process.env;

if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
    throw new Error('Missing Firebase environment variables');
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            project_id: FIREBASE_PROJECT_ID,
            client_email: FIREBASE_CLIENT_EMAIL,
            private_key: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        } as admin.ServiceAccount),
    });
}

export const messaging = admin.messaging();

const MAX_TOKENS_PER_REQUEST = 500;
const PERMANENT_INVALID_CODES = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
]);

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

type AttendanceEventType = 'login' | 'logout';

function normalizeEventType(value: unknown): AttendanceEventType {
    return value === 'logout' ? 'logout' : 'login';
}

function buildNotificationContent(eventType: AttendanceEventType) {
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

export async function sendNotification(
    erpid: string | number,
    eventTypeInput: unknown = 'login'
) {
    const erpidStr = String(erpid).trim();
    const eventType = normalizeEventType(eventTypeInput);
    const notificationContent = buildNotificationContent(eventType);

    if (!erpidStr) {
        console.warn('sendNotification called without erpid');
        return { successCount: 0, failureCount: 0, deletedCount: 0 };
    }

    try {
        const { data, error } = await supabase
            .from('fcm_tokens')
            .select('token')
            .eq('erpid', erpidStr);

        if (error) {
            console.error('Error fetching tokens:', error);
            return { successCount: 0, failureCount: 0, deletedCount: 0 };
        }

        const tokens = [...new Set((data ?? []).map((r) => r.token).filter(Boolean))];

        if (tokens.length === 0) {
            console.log(`No tokens found for erpid: ${erpidStr}`);
            return { successCount: 0, failureCount: 0, deletedCount: 0 };
        }

        let successCount = 0;
        let failureCount = 0;
        const invalidTokensToDelete = new Set<string>();

        for (const tokenBatch of chunk(tokens, MAX_TOKENS_PER_REQUEST)) {
            const message: admin.messaging.MulticastMessage = {
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
                android: { priority: 'high' },
            };

            const resp = await messaging.sendEachForMulticast(message);
            successCount += resp.successCount;
            failureCount += resp.failureCount;

            resp.responses.forEach((r, idx) => {
                if (r.success) return;
                const code = r.error?.code;
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
            const { error: deleteError, count } = await supabase
                .from('fcm_tokens')
                .delete({ count: 'exact' })
                .in('token', dead);

            if (deleteError) {
                console.error('Failed to delete invalid tokens:', deleteError);
            } else {
                deletedCount = count ?? 0;
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
    } catch (err) {
        console.error('Error sending notification:', err);
        return { successCount: 0, failureCount: 0, deletedCount: 0 };
    }
}
