import { Router } from "express";
import { login, removeFcmToken, storeFcmToken } from "../controllers/authController";
import { authenticateRequest } from "../middleware/authMiddleware";

const router = Router();

router.post("/login", login);
router.post("/store-fcm-token", authenticateRequest, storeFcmToken);
router.post("/remove-fcm-token", authenticateRequest, removeFcmToken);

export default router;
