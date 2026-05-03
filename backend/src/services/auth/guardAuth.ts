import { AuthUser } from "../../types/auth";
import { authenticateFromTable } from "./shared";

export const authenticateGuard = async (
  erpId: string,
  password: string,
): Promise<AuthUser> =>
  authenticateFromTable(
    {
      tableName: "guards",
      role: "guard",
      idColumns: ["erpid", "erp_id", "guard_id"],
      nameColumns: ["name", "full_name"],
      passwordColumns: ["password_hash", "password"],
    },
    erpId,
    password,
  );
