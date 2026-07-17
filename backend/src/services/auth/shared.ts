import bcrypt from "bcryptjs";
import { supabase } from "../../config/supabase";
import { AuthUser, UserRole } from "../../types/auth";

type AuthTableConfig = {
  tableName: string;
  role: UserRole;
  idColumns: string[];
  nameColumns: string[];
  passwordColumns: string[];
  allowedRoleValues?: string[];
};

type UserRow = Record<string, unknown> & {
  id?: string | number | null;
};

const ROLE_COLUMN = "role";

const coerceStringValue = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return String(value);
  }

  return null;
};

const normalizeIdentifier = (value: unknown): string => {
  const normalized = coerceStringValue(value);
  return normalized ? normalized.trim().toUpperCase() : "";
};

const resolveFirstString = (row: UserRow, keys: string[]): string => {
  for (const key of keys) {
    const value = coerceStringValue(row[key]);
    if (value) {
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

const buildIdentifierCandidates = (erpId: string): string[] => {
  const trimmed = erpId.trim();
  const upper = trimmed.toUpperCase();
  return [...new Set([trimmed, upper])].filter(Boolean);
};

const buildOrFilter = (idColumns: string[], candidateValues: string[]): string =>
  idColumns
    .flatMap((column) => candidateValues.map((value) => `${column}.eq.${value}`))
    .join(",");

export const authenticateFromTable = async (
  config: AuthTableConfig,
  erpId: string,
  password: string,
): Promise<AuthUser> => {
  const normalizedErpId = normalizeIdentifier(erpId);
  const identifierCandidates = buildIdentifierCandidates(erpId);
  let query = supabase
    .from(config.tableName)
    .select("*")
    .or(buildOrFilter(config.idColumns, identifierCandidates))
    .limit(10);

  if (config.allowedRoleValues?.length) {
    query = query.in(ROLE_COLUMN, config.allowedRoleValues);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const matchingRow = (data ?? []).find((row) => {
    const rowErpId = resolveFirstString(row as UserRow, config.idColumns);
    if (normalizeIdentifier(rowErpId) !== normalizedErpId) {
      return false;
    }
    return true;
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
