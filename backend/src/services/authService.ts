import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "./supabase";
import { AuthUser, JwtPayload, LoginRequest, LoginResponse } from "../types/auth";

export interface User {
  erpid: string;
  name: string;
  dept: string;
}

type UserRow = {
  id: string;
  erpid?: string | null;
  erp_id?: string | null;
  name: string;
  dept?: string | null;
  role?: string | null;
  password?: string | null;
  password_hash?: string | null;
};

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const JWT_EXPIRATION = "8h";

const normalizeErpId = (erpId: string): string => erpId.trim().toUpperCase();

const resolveErpId = (row: UserRow): string => row.erpid ?? row.erp_id ?? "";
const resolvePasswordHash = (row: UserRow): string => row.password_hash ?? row.password ?? "";

const mapAuthUser = (row: UserRow): AuthUser => ({
  id: row.id,
  erpId: resolveErpId(row),
  name: row.name,
  role: row.role ?? null,
});

class AuthService {
  // LOGIN WITH ERPID + PASSWORD
  static async login(erpid: string, password: string): Promise<User> {
    const normalizedErpId = normalizeErpId(erpid);

    const { data: rowsByErpid, error: erpidError } = await supabase
      .from("users")
      .select("*")
      .ilike("erpid", normalizedErpId)
      .limit(25);

    const { data: rowsByLegacy, error: legacyError } = await supabase
      .from("users")
      .select("*")
      .ilike("erp_id", normalizedErpId)
      .limit(25);

    if (erpidError && legacyError) {
      throw new Error("User not found");
    }

    const rows = [...(rowsByErpid ?? []), ...(rowsByLegacy ?? [])];

    if (rows.length === 0) {
      throw new Error("User not found");
    }

    const data =
      rows.find((row) => normalizeErpId(resolveErpId(row)) === normalizedErpId) ??
      rows[0];

    const passwordHash = resolvePasswordHash(data);
    if (!passwordHash) {
      throw new Error("Password not configured for this user");
    }

    let isMatch = false;

    if (passwordHash.startsWith("$2")) {
      isMatch = await bcrypt.compare(password, passwordHash);
    } else {
      isMatch = password === passwordHash;
    }

    if (!isMatch) {
      throw new Error("Invalid password");
    }

    return {
      erpid: resolveErpId(data),
      name: data.name,
      dept: data.dept ?? "",
    };
  }

  // OPTIONAL: REGISTER USER
  static async register(erpid: string, password: string, name: string, dept: string): Promise<void> {
    const normalizedErpId = normalizeErpId(erpid);
    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase.from("users").insert([
      {
        erpid: normalizedErpId,
        password: hashedPassword,
        name,
        dept,
      },
    ]);

    if (error) {
      throw new Error(error.message);
    }
  }

  // STORE FCM TOKEN
  static async storeFcmToken(erpid: string, fcmToken: string): Promise<void> {
    const normalizedErpId = normalizeErpId(erpid);

    const { error } = await supabase
      .from("fcm_tokens")
      .upsert({ erpid: normalizedErpId, token: fcmToken }, { onConflict: 'erpid' });

    if (error) {
      throw new Error(error.message);
    }
  }
}

export const loginWithErpCredentials = async (payload: LoginRequest): Promise<LoginResponse> => {
  const erpId = normalizeErpId(payload.erpId);
  const password = payload.password.trim();

  if (!erpId || !password) {
    throw new Error("ERP ID and password are required.");
  }

  const user = await AuthService.login(erpId, password);

  const token = jwt.sign(
    {
      sub: user.erpid,
      erpId: user.erpid,
      name: user.name,
      role: null,
    } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION },
  );

  return {
    token,
    user: mapAuthUser({
      id: user.erpid,
      erpid: user.erpid,
      name: user.name,
      role: null,
      dept: user.dept,
    }),
  };
};

export default AuthService;
