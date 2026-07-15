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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAttendance = exports.getSessionAttendance = exports.getTeacherAttendance = exports.insertSession = exports.triggerFacultyNotification = exports.saveFacultyToken = exports.createFacultyGatePass = void 0;
const services_1 = require("../services");
const cloudinary_1 = require("../utils/cloudinary");
// import supabase from "../config/supabase";
const supabase_1 = require("../config/supabase");
const createFacultyGatePass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const teacherErpId = (_a = req.authUser) === null || _a === void 0 ? void 0 : _a.erpId;
        const teacherName = (_b = req.authUser) === null || _b === void 0 ? void 0 : _b.name;
        console.log("[faculty/gate-pass/create] request received", {
            teacherErpId,
            teacherName,
            role: (_c = req.authUser) === null || _c === void 0 ? void 0 : _c.role,
            parent_name: (_d = req.body) === null || _d === void 0 ? void 0 : _d.parent_name,
            visit_date: (_e = req.body) === null || _e === void 0 ? void 0 : _e.visit_date,
            visit_time: (_f = req.body) === null || _f === void 0 ? void 0 : _f.visit_time,
        });
        if (!teacherErpId || !teacherName) {
            res.status(400).json({ error: "Authenticated faculty context is missing." });
            return;
        }
        const record = yield services_1.FacultyService.createGatePass(teacherErpId, teacherName, req.body);
        console.log("[faculty/gate-pass/create] success", {
            id: record.id,
            teacherErpId,
            parent_name: record.parent_name,
        });
        res.status(201).json({
            success: true,
            gatePass: record,
            qrPayload: JSON.stringify({ gate_pass_id: record.id }),
        });
    }
    catch (error) {
        console.error("[faculty/gate-pass/create] failed", {
            teacherErpId: (_g = req.authUser) === null || _g === void 0 ? void 0 : _g.erpId,
            error: error.message,
        });
        res.status(500).json({ error: error.message });
    }
});
exports.createFacultyGatePass = createFacultyGatePass;
const saveFacultyToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { erpid, token } = req.body;
        if (!erpid || !token) {
            res.status(400).json({ error: "erpid and token are required" });
            return;
        }
        yield services_1.FacultyService.saveToken(erpid, token);
        res.json({ success: true, message: "Token saved successfully" });
    }
    catch (error) {
        console.error("[faculty/notifications/save-token] failed", error);
        res.status(500).json({ error: error.message });
    }
});
exports.saveFacultyToken = saveFacultyToken;
const triggerFacultyNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { erpid, type } = req.body;
        if (!erpid) {
            res.status(400).json({ error: "erpid is required" });
            return;
        }
        yield services_1.FacultyService.triggerNotification(erpid, type);
        res.json({ success: true, message: "Notification sent" });
    }
    catch (error) {
        console.error("[faculty/notifications/trigger] failed", error);
        res.status(500).json({ error: error.message });
    }
});
exports.triggerFacultyNotification = triggerFacultyNotification;
const insertSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _a = req.body, { images } = _a, payload = __rest(_a, ["images"]);
        const files = req.files;
        const facultyErpid = req.authUser.erpId;
        // Create session and get the generated session ID
        const sessionID = yield services_1.FacultyService.sessionStart(payload, facultyErpid);
        console.log("this is sessionID", sessionID);
        const folderName = `session_no_${sessionID}`;
        let uploadedImages = [];
        if (files && files.length > 0) {
            uploadedImages = yield Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
                const result = yield (0, cloudinary_1.uploadImage)(file.buffer, folderName);
                return {
                    url: result.secure_url,
                    publicId: result.public_id,
                };
            })));
        }
        // console.log("Uploaded Images:", uploadedImages);
        console.log("before pednding");
        // Update the session with image URLs and mark it completed
        yield services_1.FacultyService.completeSession(sessionID);
        console.log("after pedning");
        res.status(201).json({
            success: true,
            message: "Session created successfully",
            data: {
                sessionID,
                images: uploadedImages,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.insertSession = insertSession;
//added 
const getTeacherAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { teacherId } = req.params;
        // Get all sessions of this teacher
        const { data: sessions, error: sessionError } = yield supabase_1.supabase
            .from("sessions")
            .select(`
        id,
        faculty_erpid,
        subject_id,
        division,
        division_id,
        department_id,
        session_date,
        start_time,
        end_time,
        present_count,
        absent_count,
        status,
        location,
        semester,
        year
      `)
            .eq("faculty_erpid", teacherId)
            .order("session_date", { ascending: false });
        if (sessionError) {
            res.status(400).json({
                success: false,
                message: sessionError.message,
            });
            return;
        }
        if (!sessions || sessions.length === 0) {
            res.status(200).json({
                success: true,
                count: 0,
                sessions: [],
            });
            return;
        }
        // Get all session ids
        const sessionIds = sessions.map((session) => session.id);
        // Get attendance for those sessions
        const { data: attendance, error: attendanceError } = yield supabase_1.supabase
            .from("attendance_details")
            .select("*")
            .in("session_id", sessionIds)
            .order("student_erpid", { ascending: true });
        if (attendanceError) {
            res.status(400).json({
                success: false,
                message: attendanceError.message,
            });
            return;
        }
        // Attach attendance to each session
        // const result = sessions.map((session) => ({
        //   ...session,
        //   attendance: attendance.filter(
        //     (record) => record.session_id === session.id
        //   ),
        // }));
        const result = sessions.map((session) => {
            const sessionAttendance = attendance.filter((record) => record.session_id === session.id);
            const presentCount = sessionAttendance.filter((record) => record.status === "Present").length;
            const absentCount = sessionAttendance.filter((record) => record.status === "Absent").length;
            return Object.assign(Object.assign({}, session), { 
                // Override incorrect values from database
                present_count: presentCount, absent_count: absentCount, attendance: sessionAttendance });
        });
        res.status(200).json({
            success: true,
            count: result.length,
            sessions: result,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Internal Server Error",
        });
    }
});
exports.getTeacherAttendance = getTeacherAttendance;
const getSessionAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId } = req.params;
        const { data, error } = yield supabase_1.supabase
            .from("attendance_details")
            .select(`
        id,
        student_erpid,
        session_id,
        status,
        confidence,
        source,
        students!attendance_details_student_erpid_fkey (
          id,
          name,
          erpid,
          department_id
        )
      `)
            .eq("session_id", Number(sessionId))
            .order("student_erpid", { ascending: true });
        if (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(200).json({
            success: true,
            attendance: data,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err instanceof Error
                ? err.message
                : "Internal Server Error",
        });
    }
});
exports.getSessionAttendance = getSessionAttendance;
const updateAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { attendanceId } = req.params;
        const { status } = req.body;
        const { data, error } = yield supabase_1.supabase
            .from("attendance_details")
            .update({
            status,
            updated_at: new Date().toISOString(),
        })
            .eq("id", Number(attendanceId))
            .select()
            .single();
        if (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(200).json({
            success: true,
            attendance: data,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : "Server Error",
        });
    }
});
exports.updateAttendance = updateAttendance;
