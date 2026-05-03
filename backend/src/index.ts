import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { supabase } from "./services/supabase";
import { authenticateRequest, authorizeRoles } from "./middleware/authMiddleware";
import { sendNotification } from "./services/firebaseAdmin";
import notificationRoutes from "./routes/notificationRoutes";
import authRoutes from "./routes/authRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Server is running");
});

app.use("/api/auth", authRoutes);

app.post("/api/send-notification", async (req, res) => {
  try {
    console.log("🔥 RAW BODY:", req.body);

    const { erpid, type } = req.body;

    if (!erpid) {
      console.log("❌ ERPID missing");
      return res.status(400).json({ error: "erpid is required" });
    }

    console.log("✅ ERPID:", erpid);

    await sendNotification(erpid, type);

    res.json({ success: true });
  } catch (error: any) {
    console.error("❌ ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get(
  "/api/attendance",
  authenticateRequest,
  authorizeRoles("faculty"),
  async (req: any, res) => {
  try {
    const erpId = req.authUser?.erpId;
    const todayIst = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(new Date());

    const { data, error } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("erpid", erpId)
      .eq("date", todayIst)
      .or("login_time.not.is.null,logout_time.not.is.null")
      .limit(1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const normalizedAttendance = (data ?? []).map((item: any) => ({
      ...item,
      effective_logout_time: item.final_logout_time ?? item.logout_time ?? null,
    }));

    res.json({ attendance: normalizedAttendance });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get(
  "/api/attendance/history",
  authenticateRequest,
  authorizeRoles("faculty"),
  async (req: any, res) => {
  try {
    const erpId = req.authUser?.erpId;

    const { data, error } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("erpid", erpId)
      .order("date", { ascending: false })
      .order("login_time", { ascending: false, nullsFirst: false })
      .limit(100);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const normalizedAttendance = (data ?? []).map((item: any) => ({
      ...item,
      effective_logout_time: item.final_logout_time ?? item.logout_time ?? null,
    }));

    res.json({ attendance: normalizedAttendance });
  } catch (_err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post(
  "/api/attendance",
  authenticateRequest,
  authorizeRoles("faculty"),
  async (req: any, res) => {
  try {
    const erpId = req.authUser?.erpId;
    const attendanceData = req.body; // Assume { date, shift, etc. }

    // Insert into attendance_logs
    const { data, error } = await supabase
      .from("attendance_logs")
      .insert({ ...attendanceData, erpid: erpId })
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Trigger notification
    await sendNotification(erpId, "login");

    res.json({ success: true, data });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/test", (req, res) => {
  console.log("🔥 TEST HIT");
  res.send("ok");
});

app.use("/api", notificationRoutes);

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
