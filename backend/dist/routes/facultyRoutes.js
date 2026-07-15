"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const facultyController_1 = require("../controllers/facultyController");
const multerConfig_1 = __importDefault(require("../config/multerConfig"));
const router = (0, express_1.Router)();
console.log("facultyRoutes loaded");
router.post("/gate-pass", authMiddleware_1.authenticateRequest, (0, authMiddleware_1.authorizeRoles)("faculty"), facultyController_1.createFacultyGatePass);
router.post("/save-token", authMiddleware_1.authenticateRequest, (0, authMiddleware_1.authorizeRoles)("faculty"), facultyController_1.saveFacultyToken);
router.post("/trigger-notification", authMiddleware_1.authenticateRequest, (0, authMiddleware_1.authorizeRoles)("faculty"), facultyController_1.triggerFacultyNotification);
router.post("/insert-session", authMiddleware_1.authenticateRequest, multerConfig_1.default.array("images"), (0, authMiddleware_1.authorizeRoles)("faculty"), facultyController_1.insertSession);
router.get("/teacher/:teacherId", facultyController_1.getTeacherAttendance);
router.get("/teacher/session/:sessionId", facultyController_1.getSessionAttendance);
router.patch("/attendance/:attendanceId", facultyController_1.updateAttendance);
exports.default = router;
