import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload, UserRole } from "../types/auth";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

declare global {
  namespace Express {
    interface Request {
      authUser?: JwtPayload;
    }
  }
}

export const authenticateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Missing authorization token." });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.authUser = decoded;
    next();
  } catch (_error) {
    res.status(401).json({ error: "Invalid or expired authorization token." });
  }
};

export const authorizeRoles =
  (...allowedRoles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const role = req.authUser?.role;

    if (!role || !allowedRoles.includes(role)) {
      res.status(403).json({ error: "You are not allowed to access this resource." });
      return;
    }

    next();
  };
