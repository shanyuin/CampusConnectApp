import { Request, Response } from "express";
import { GatePassService } from "../../services";

export const createGatePassForAuthenticatedFaculty = async (
  req: Request,
  res: Response,
  logPrefix: string,
): Promise<void> => {
  try {
    const teacherErpId = req.authUser?.erpId;
    const teacherName = req.authUser?.name;

    console.log(`${logPrefix} request received`, {
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

    const record = await GatePassService.createGatePass(teacherErpId, teacherName, req.body);

    console.log(`${logPrefix} success`, {
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
    console.error(`${logPrefix} failed`, {
      teacherErpId: req.authUser?.erpId,
      error: error.message,
    });
    res.status(500).json({ error: error.message });
  }
};
