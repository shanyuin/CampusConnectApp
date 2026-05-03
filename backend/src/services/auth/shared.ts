import bcrypt from "bcryptjs";
import { supabase } from "../supabase";
import { AuthUser, UserRole } from "../../types/auth";

type AuthTableConfig = {
  tableName: string;
  role: UserRole;
  idColumns: string[];
  nameColumns: string[];
  passwordColumns: string[];
};

type UserRow = Record<string, unknown> & {
  id?: string | number | null;
};

const normalizeIdentifier = (value: string): string => value.trim().toUpperCase();

const resolveFirstString = (row: UserRow, keys: string[]): string => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const resolvePasswordHash = (row: UserRow, passwordColumns: string[]): string =>
  resolveFirstString(row, passwordColumns);

const resolveRowId = (row: UserRow, fallback: string): string => {
  if (typeof row.id === "string" && row.id.trim()) {
    return row.id.trim();
  }

  if (typeof row.id === "number") {
    return String(row.id);
  }

  return fallback;
};

const comparePassword = async (password: string, storedValue: string): Promise<boolean> => {
  if (!storedValue) {
    return false;
  }

  if (storedValue.startsWith("$2")) {
    return bcrypt.compare(password, storedValue);
  }

  return password === storedValue;
};

export const authenticateFromTable = async (
  config: AuthTableConfig,
  erpId: string,
  password: string,
): Promise<AuthUser> => {
  const normalizedErpId = normalizeIdentifier(erpId);

  const { data, error } = await supabase.from(config.tableName).select("*").limit(200);

  if (error) {
    throw new Error(error.message);
  }

  const matchingRow = (data ?? []).find((row) => {
    const rowErpId = resolveFirstString(row as UserRow, config.idColumns);
    return normalizeIdentifier(rowErpId) === normalizedErpId;
  }) as UserRow | undefined;

  if (!matchingRow) {
    throw new Error(`${config.role} account not found.`);
  }

  const storedPassword = resolvePasswordHash(matchingRow, config.passwordColumns);
  const isMatch = await comparePassword(password, storedPassword);

  if (!isMatch) {
    throw new Error("Invalid password.");
  }

  const resolvedErpId = resolveFirstString(matchingRow, config.idColumns);
  const resolvedName =
    resolveFirstString(matchingRow, config.nameColumns) || `${config.role} user`;

  return {
    id: resolveRowId(matchingRow, resolvedErpId),
    erpId: resolvedErpId,
    name: resolvedName,
    role: config.role,
  };
};
