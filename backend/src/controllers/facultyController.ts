import { Request, Response } from "express";
import { FacultyService } from "../services";
import { uploadImage } from "../utils/cloudinary";
// import supabase from "../config/supabase";
import { supabase } from "../config/supabase";

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

export const insertSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { images, ...payload } = req.body;
    const files = req.files as Express.Multer.File[];

    const facultyErpid = req.authUser!.erpId;

    // Create session and get the generated session ID
    const sessionID = await FacultyService.sessionStart(
      payload,
      facultyErpid
    );

    console.log("this is sessionID", sessionID);

    const folderName = `session_no_${sessionID}`;

    let uploadedImages: {
      url: string;
      publicId: string;
    }[] = [];

    if (files && files.length > 0) {
      uploadedImages = await Promise.all(
        files.map(async (file) => {
          const result: any = await uploadImage(
            file.buffer,
            folderName
          );

          return {
            url: result.secure_url,
            publicId: result.public_id,
          };
        })
      );
    }

    // console.log("Uploaded Images:", uploadedImages);
    console.log("before pednding");

    // Update the session with image URLs and mark it completed
    await FacultyService.completeSession(
      sessionID
    );

    console.log("after pedning");

    res.status(201).json({
      success: true,
      message: "Session created successfully",
      data: {
        sessionID,
        images: uploadedImages,
      },
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//added 

export const getTeacherAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { teacherId } = req.params;
    
    // Get all sessions of this teacher
    const { data: sessions, error: sessionError } = await supabase
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
    const { data: attendance, error: attendanceError } = await supabase
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
  const sessionAttendance = attendance.filter(
    (record) => record.session_id === session.id
  );

  const presentCount = sessionAttendance.filter(
    (record) => record.status === "Present"
  ).length;

  const absentCount = sessionAttendance.filter(
    (record) => record.status === "Absent"
  ).length;

  return {
    ...session,

    // Override incorrect values from database
    present_count: presentCount,
    absent_count: absentCount,

    attendance: sessionAttendance,
  };
});

    res.status(200).json({
      success: true,
      count: result.length,
      sessions: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Internal Server Error",
    });
  }
};

export const getSessionAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabase
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

  } catch (err) {
    res.status(500).json({
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Internal Server Error",
    });
  }
};


export const updateAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { attendanceId } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
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
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Server Error",
    });
  }
};