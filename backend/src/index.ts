import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { supabase } from "./services/supabase";
import { authenticateRequest } from "./middleware/authMiddleware";
import { loginWithErpCredentials } from "./services/authService";

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
    res.json(loginResponse);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

app.get("/api/attendance", authenticateRequest, async (req: any, res) => {
  try {
    const erpIdRaw = String(req.authUser?.erpId ?? "").trim();
    console.log("Attendance lookup ERP ID:", erpIdRaw, "token type:", typeof req.authUser?.erpId);

    let { data, error } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("erpid", erpIdRaw)
      .order("date", { ascending: false });

      console.log(data);

    // if (!error && (!data || data.length === 0) && /^\d+$/.test(erpIdRaw)) {
    //   const erpIdAsNumber = Number(erpIdRaw);
    //   const fallback = await supabase
    //     .from("attendance_logs")
    //     .select("*")
    //     .eq("erpid", erpIdAsNumber)
    //     .order("date", { ascending: false });

    //   data = fallback.data;
    //   error = fallback.error;
    // }

    // console.log("Attendance rows:", data?.length ?? 0);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ attendance: data });
  } catch (err) {
    console.log("ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});
