import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { authenticateRequest } from "./middleware/authMiddleware";
import { loginWithErpCredentials } from "./services/authService";
import { LoginRequest } from "./types/auth";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("Server is running");
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const payload = req.body as LoginRequest;
    const loginResponse = await loginWithErpCredentials(payload);
    res.status(200).json(loginResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    const statusCode = message.includes("required") ? 400 : 401;
    res.status(statusCode).json({ error: message });
  }
});

app.get("/api/auth/me", authenticateRequest, (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  res.status(200).json({
    user: {
      id: req.authUser.sub,
      erpId: req.authUser.erpId,
      name: req.authUser.name,
      role: req.authUser.role,
    },
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
