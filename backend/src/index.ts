import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { supabase } from "./services/supabase";
import { authenticateRequest } from "./middleware/authMiddleware";
import { loginWithErpCredentials } from "./services/authService";
import AuthService from "./services/authService";
import { sendNotification } from "./services/firebaseAdmin";
import notificationRoutes from "./routes/notificationRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Server is running");
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const loginResponse = await loginWithErpCredentials(req.body);
    console.log("this is login response",loginResponse);
    res.json(loginResponse);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

app.post("/api/auth/store-fcm-token", authenticateRequest, async (req: any, res) => {
  try {
    const erpId = req.authUser?.erpId;
    const { fcmToken } = req.body;
    
    console.log("this route got hit", erpId);

    if (!fcmToken) {
      return res.status(400).json({ error: "FCM token is required" });
    }

    const { error } = await supabase
      .from('fcm_tokens')
      .upsert(
        { erpid: erpId, token: fcmToken },
        { onConflict: 'token' }
      );

    if (error) {
      console.error('Error saving token:', error);
      return res.status(500).json({ error: 'Failed to save token' });
    }

    console.log("saved the token")
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/send-notification", async (req, res) => {
  console.log("🔥 RAW BODY:", JSON.stringify(req.body));

  let erpid = null;

  // Try all possible formats
  if (req.body.erpid) {
    erpid = req.body.erpid;
  } else if (req.body.body?.erpid) {
    erpid = req.body.body.erpid;
  } else {
    const values = Object.values(req.body);
    if (values.length > 0) {
      erpid = values[0];
    }
  }

  console.log("✅ FINAL ERPID:", erpid);

  if (!erpid) {
    return res.status(400).json({ error: "erpid not found" });
  }

  await sendNotification(erpid);

  res.json({ success: true });
});

app.post("/api/send-notification", async (req, res) => {
  try {
    console.log("🔥 RAW BODY:", req.body);

    const { erpid } = req.body;

    if (!erpid) {
      console.log("❌ ERPID missing");
      return res.status(400).json({ error: "erpid is required" });
    }

    console.log("✅ ERPID:", erpid);

    await sendNotification(erpid);

    res.json({ success: true });
  } catch (error: any) {
    console.error("❌ ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/attendance", authenticateRequest, async (req: any, res) => {
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
    await sendNotification(erpId);

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
