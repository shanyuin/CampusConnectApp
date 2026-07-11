import { Request, Response } from "express";
import { GatePassService } from "../services";

export const createGatePass = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherErpId = req.authUser?.erpId;
    const teacherName = req.authUser?.name;
    console.log("[gate-pass/create] request received", {
      teacherErpId,
      teacherName,
      role: req.authUser?.role,
      parent_name: req.body?.parent_name,
      visit_date: req.body?.visit_date,
      visit_time: req.body?.visit_time,
    });

    if (!teacherErpId || !teacherName) {
      console.log("[gate-pass/create] missing authenticated faculty context");
      res.status(400).json({ error: "Authenticated faculty context is missing." });
      return;
    }

    const record = await GatePassService.createGatePass(teacherErpId, teacherName, req.body);
    console.log("[gate-pass/create] success", {
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
    console.error("[gate-pass/create] failed", {
      teacherErpId: req.authUser?.erpId,
      error: error.message,
    });
    res.status(500).json({ error: error.message });
  }
};

export const listGatePasses = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("[gate-pass/list] request received", {
      erpId: req.authUser?.erpId,
      role: req.authUser?.role,
    });
    const records = await GatePassService.listGatePasses();
    console.log("[gate-pass/list] success", {
      erpId: req.authUser?.erpId,
      count: records.length,
    });
    res.json({ gatePasses: records });
  } catch (error: any) {
    console.error("[gate-pass/list] failed", {
      erpId: req.authUser?.erpId,
      error: error.message,
    });
    res.status(500).json({ error: error.message });
  }
};

export const listGuardHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const guardErpId = req.authUser?.erpId;
    console.log("[gate-pass/history] request received", {
      erpId: guardErpId,
      role: req.authUser?.role,
    });

    if (!guardErpId) {
      res.status(400).json({ error: "Authenticated guard context is missing." });
      return;
    }

    const records = await GatePassService.listGuardHistory(guardErpId);
    console.log("[gate-pass/history] success", {
      erpId: guardErpId,
      count: records.length,
    });
    res.json({ gatePasses: records });
  } catch (error: any) {
    console.error("[gate-pass/history] failed", {
      erpId: req.authUser?.erpId,
      error: error.message,
    });
    res.status(500).json({ error: error.message });
  }
};

export const scanGatePass = async (req: Request, res: Response): Promise<void> => {
  try {
    const qrValue = req.body?.qrValue;
    const guardErpId = req.authUser?.erpId;
    const guardName = req.authUser?.name;
    console.log("[gate-pass/scan] request received", {
      erpId: guardErpId,
      role: req.authUser?.role,
      qrValue,
    });
    if (!qrValue || typeof qrValue !== "string") {
      console.log("[gate-pass/scan] qrValue missing");
      res.status(400).json({ error: "qrValue is required." });
      return;
    }

    if (!guardErpId || !guardName) {
      res.status(400).json({ error: "Authenticated guard context is missing." });
      return;
    }

    const record = await GatePassService.scanGatePass(qrValue, guardErpId, guardName);
    console.log("[gate-pass/scan] success", {
      id: record.id,
      parent_name: record.parent_name,
    });
    res.json({ success: true, gatePass: record });
  } catch (error: any) {
    console.error("[gate-pass/scan] failed", {
      erpId: req.authUser?.erpId,
      error: error.message,
    });
    res.status(400).json({ error: error.message });
  }
};

export const markGatePassIn = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("[gate-pass/mark-in] request received", {
      erpId: req.authUser?.erpId,
      role: req.authUser?.role,
      gatePassId: req.params.id,
    });
    const record = await GatePassService.markIn(req.params.id);
    console.log("[gate-pass/mark-in] success", {
      id: record.id,
      in_time: record.in_time,
    });
    res.json({ success: true, gatePass: record });
  } catch (error: any) {
    console.error("[gate-pass/mark-in] failed", {
      erpId: req.authUser?.erpId,
      gatePassId: req.params.id,
      error: error.message,
    });
    res.status(400).json({ error: error.message });
  }
};

export const markGatePassOut = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("[gate-pass/mark-out] request received", {
      erpId: req.authUser?.erpId,
      role: req.authUser?.role,
      gatePassId: req.params.id,
    });
    const record = await GatePassService.markOut(req.params.id);
    console.log("[gate-pass/mark-out] success", {
      id: record.id,
      out_time: record.out_time,
    });
    res.json({ success: true, gatePass: record });
  } catch (error: any) {
    console.error("[gate-pass/mark-out] failed", {
      erpId: req.authUser?.erpId,
      gatePassId: req.params.id,
      error: error.message,
    });
    res.status(400).json({ error: error.message });
  }
};
