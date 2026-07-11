import { Request, Response } from "express";
import { StudentAttendanceService } from "../services";

export const getStudentAttendance = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const erpId = req.authUser?.erpId;

    if (!erpId) {
      res.status(401).json({
        error: "Unauthorized.",
      });
      return;
    }

    console.log(req.authUser);

    const attendance =
      await StudentAttendanceService.getAttendance(erpId);

    res.status(200).json(attendance);
  } catch (error) {
    console.error("[student attendance]", error);

    res.status(500).json({
      error: "Failed to fetch attendance.",
    });
  }
};