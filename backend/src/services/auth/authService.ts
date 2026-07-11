import { supabase } from "../../config/supabase";
import { LoginRequest, LoginResponse } from "../../types/auth";
import { normalizeErpId } from "../../utils/authUtils";
import { authenticateByRole } from "./index";

class AuthService {
  static async login(payload: LoginRequest): Promise<LoginResponse> {
    return authenticateByRole(payload);
  }

  static async storeFcmToken(erpId: string, fcmToken: string): Promise<void> {
    const normalizedErpId = normalizeErpId(erpId);

    const { error } = await supabase
      .from("fcm_tokens")
      .upsert({ erpid: normalizedErpId, token: fcmToken }, { onConflict: "token" });

    if (error) {
      throw new Error(error.message);
    }
  }
}

export const loginWithErpCredentials = async (
  payload: LoginRequest,
): Promise<LoginResponse> => AuthService.login(payload);

export default AuthService;
