import { Request, Response } from "express";
import { FacultyService } from "../services";

export const createFacultyGatePass = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherErpId = req.authUser?.erpId;
    const teacherName = req.authUser?.name;

    console.log("[faculty/gate-pass/create] request received", {
      teacherErpId,
      teacherName,
      role: req.authUser?.role,
      parent_name: req.body?.parent_name,
      visit_date: req.body?.visit_date,
      visit_time: req.body?.visit_time,
    });

    if (!teacherErpId || !teacherName) {
      res.status(400).json({ error: "Authenticated faculty context is missing." });
      return;
    }

    const record = await FacultyService.createGatePass(teacherErpId, teacherName, req.body);

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
  } catch (error: any) {
    console.error("[faculty/gate-pass/create] failed", {
      teacherErpId: req.authUser?.erpId,
      error: error.message,
    });
    res.status(500).json({ error: error.message });
  }
};

export const saveFacultyToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { erpid, token } = req.body;

    if (!erpid || !token) {
      res.status(400).json({ error: "erpid and token are required" });
      return;
    }

    await FacultyService.saveToken(erpid, token);
    res.json({ success: true, message: "Token saved successfully" });
  } catch (error: any) {
    console.error("[faculty/notifications/save-token] failed", error);
    res.status(500).json({ error: error.message });
  }
};

export const triggerFacultyNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { erpid, type } = req.body;

    if (!erpid) {
      res.status(400).json({ error: "erpid is required" });
      return;
    }

    await FacultyService.triggerNotification(erpid, type);
    res.json({ success: true, message: "Notification sent" });
  } catch (error: any) {
    console.error("[faculty/notifications/trigger] failed", error);
    res.status(500).json({ error: error.message });
  }
};

//function to insert the session into the database

export const insertSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Route hit");

    const payload = req.body;
    const facultyErpid = req.authUser!.erpId;
    console.log("facultyErpid", facultyErpid);

    console.log("[faculty/session/insert] request payload", payload);

    const session = await FacultyService.sessionStart(payload, facultyErpid!);

    console.log(session);
    res.status(201).json({
      success: true,
      message: "Session created successfully",
      data: session,
    });
  } catch (error: any) {
    console.error("[faculty/session/insert] failed", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
