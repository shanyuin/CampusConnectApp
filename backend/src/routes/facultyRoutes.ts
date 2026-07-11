import { Router } from "express";
import { authenticateRequest, authorizeRoles } from "../middleware/authMiddleware";
import {
  createFacultyGatePass,
  saveFacultyToken,
  triggerFacultyNotification,
  insertSession
} from "../controllers/facultyController";

const router = Router();

console.log("facultyRoutes loaded");

router.post("/gate-pass", authenticateRequest, authorizeRoles("faculty"), createFacultyGatePass);
router.post("/save-token", authenticateRequest, authorizeRoles("faculty"), saveFacultyToken);
router.post("/trigger-notification", authenticateRequest, authorizeRoles("faculty"), triggerFacultyNotification);
router.post("/insert-session", authenticateRequest, authorizeRoles("faculty"), insertSession);

export default router;
