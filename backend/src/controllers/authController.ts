import { Request, Response } from "express";
import AuthService, { loginWithErpCredentials } from "../services/authService";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const loginResponse = await loginWithErpCredentials(req.body);
    res.json(loginResponse);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const storeFcmToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const erpId = req.authUser?.erpId;
    const { fcmToken } = req.body;

    if (!erpId) {
      res.status(400).json({ error: "ERP ID is required." });
      return;
    }

    if (!fcmToken) {
      res.status(400).json({ error: "FCM token is required." });
      return;
    }

    await AuthService.storeFcmToken(erpId, fcmToken);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const removeFcmToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const erpId = req.authUser?.erpId;

    if (!erpId) {
      res.status(400).json({ error: "ERP ID is required." });
      return;
    }

    const { error } = await (await import("../services/supabase")).supabase
      .from("fcm_tokens")
      .delete()
      .eq("erpid", erpId);

    if (error) {
      res.status(500).json({ error: "Failed to remove token." });
      return;
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
