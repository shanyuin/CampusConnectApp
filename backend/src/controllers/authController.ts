import { Request, Response } from "express";
import AuthService, { loginWithErpCredentials } from "../services/auth/authService";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(req.body);
    console.log("[auth/login] request received", {
      erpId: req.body?.erpId,
      role: req.body?.role,
    });
    const loginResponse = await loginWithErpCredentials(req.body);
    console.log("[auth/login] success", {
      erpId: loginResponse.user.erpId,
      role: loginResponse.role,
    });
    res.json(loginResponse);
  } catch (error: any) {
    console.error("[auth/login] failed", {
      erpId: req.body?.erpId,
      role: req.body?.role,
      error: error.message,
    });
    res.status(401).json({ error: error.message });
  }
};

export const storeFcmToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const erpId = req.authUser?.erpId;
    const { fcmToken } = req.body;
    console.log("[auth/store-fcm-token] request received", {
      erpId,
      hasToken: Boolean(fcmToken),
    });

    if (!erpId) {
      res.status(400).json({ error: "ERP ID is required." });
      return;
    }

    if (!fcmToken) {
      res.status(400).json({ error: "FCM token is required." });
      return;
    }

    await AuthService.storeFcmToken(erpId, fcmToken);
    console.log("[auth/store-fcm-token] success", { erpId });
    res.json({ success: true });
  } catch (error: any) {
    console.error("[auth/store-fcm-token] failed", {
      erpId: req.authUser?.erpId,
      error: error.message,
    });
    res.status(500).json({ error: error.message });
  }
};

export const removeFcmToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const erpId = req.authUser?.erpId;
    console.log("[auth/remove-fcm-token] request received", { erpId });

    if (!erpId) {
      res.status(400).json({ error: "ERP ID is required." });
      return;
    }

    const { error } = await (await import("../config/supabase")).supabase
      .from("fcm_tokens")
      .delete()
      .eq("erpid", erpId);

    if (error) {
      console.error("[auth/remove-fcm-token] delete failed", { erpId });
      res.status(500).json({ error: "Failed to remove token." });
      return;
    }

    console.log("[auth/remove-fcm-token] success", { erpId });
    res.json({ success: true });
  } catch (error: any) {
    console.error("[auth/remove-fcm-token] failed", {
      erpId: req.authUser?.erpId,
      error: error.message,
    });
    res.status(500).json({ error: error.message });
  }
};
