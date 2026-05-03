import jwt from "jsonwebtoken";
import { AuthUser, JwtPayload, LoginRequest, LoginResponse, UserRole } from "../../types/auth";
import { authenticateFaculty } from "./facultyAuth";
import { authenticateGuard } from "./guardAuth";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const JWT_EXPIRATION = "7d";

const ROLE_HANDLERS: Record<UserRole, (erpId: string, password: string) => Promise<AuthUser>> = {
  faculty: authenticateFaculty,
  guard: authenticateGuard,
};

const normalizeErpId = (erpId: string): string => erpId.trim().toUpperCase();

export const authenticateByRole = async (payload: LoginRequest): Promise<LoginResponse> => {
  const erpId = normalizeErpId(payload.erpId);
  const password = payload.password.trim();
  const role = payload.role;

  if (!erpId || !password || !role) {
    throw new Error("ERP ID, password, and role are required.");
  }

  const authHandler = ROLE_HANDLERS[role];

  if (!authHandler) {
    throw new Error("Unsupported role.");
  }

  const user = await authHandler(erpId, password);

  const token = jwt.sign(
    {
      sub: user.id,
      erpId: user.erpId,
      name: user.name,
      role: user.role,
    } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION },
  );

  return {
    success: true,
    token,
    role: user.role,
    user,
  };
};
