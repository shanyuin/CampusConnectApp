import { AuthUser } from "../../types/auth";
import { authenticateFromTable } from "./shared";

export const authenticateFaculty = async (
  erpId: string,
  password: string,
): Promise<AuthUser> =>
  authenticateFromTable(
    {
      tableName: "users",
      role: "faculty",
      idColumns: ["erpid", "erp_id"],
      nameColumns: ["name", "full_name"],
      passwordColumns: ["password_hash", "password"],
    },
    erpId,
    password,
  );
