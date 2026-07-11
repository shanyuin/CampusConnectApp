import { supabase } from "../config/supabase";
import { GatePassCreateRequest } from "../types/gatePass";

const TABLE_NAME = "gate_pass_requests";

const formatDbTimestamp = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date()).replace(" ", "T");

const parseGatePassId = (qrValue: string): string => {
  const trimmed = qrValue.trim();
  if (!trimmed) {
    throw new Error("QR data is empty.");
  }

  try {
    const parsed = JSON.parse(trimmed) as { gate_pass_id?: string };
    if (parsed.gate_pass_id?.trim()) {
      return parsed.gate_pass_id.trim();
    }
  } catch {
    // fall through
  }

  return trimmed;
};

class GatePassService {
  static async createGatePass(
    teacherErpId: string,
    teacherName: string,
    payload: GatePassCreateRequest,
  ) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        teacher_erpid: teacherErpId,
        teacher_name: teacherName,
        parent_name: payload.parent_name.trim(),
        num_persons: payload.num_persons,
        visit_date: payload.visit_date.trim(),
        visit_time: payload.visit_time.trim(),
        phone: payload.phone.trim(),
        email: payload.email.trim(),
        reason: payload.reason.trim(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async listGatePasses() {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .order("generated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  static async listGuardHistory(guardErpId: string) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("guard_erpid", guardErpId)
      .order("generated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  static async scanGatePass(qrValue: string, guardErpId: string, guardName: string) {
    const gatePassId = parseGatePassId(qrValue);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        qr_scanned: 1,
        guard_erpid: guardErpId,
        guard_name: guardName,
      })
      .eq("id", gatePassId)
      .eq("qr_scanned", 0)
      .select()
      .single();

    if (!error && data) {
      return data;
    }

    if (error?.code === "PGRST116") {
      const { data: existing, error: existingError } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("id", gatePassId)
        .maybeSingle();

      if (existingError) {
        throw new Error(existingError.message);
      }

      if (!existing) {
        throw new Error("Gate pass not found.");
      }

      if (existing.qr_scanned === 1) {
        throw new Error("QR code has already been scanned.");
      }
    }

    if (error) {
      throw new Error(error.message);
    }

    throw new Error("Unable to scan gate pass.");
  }

  static async markIn(gatePassId: string) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ in_time: formatDbTimestamp() })
      .eq("id", gatePassId)
      .eq("qr_scanned", 1)
      .is("in_time", null)
      .select()
      .single();

    if (!error && data) {
      return data;
    }

    if (error?.code === "PGRST116") {
      throw new Error("Gate pass must be scanned before marking IN, or it is already marked.");
    }

    throw new Error(error?.message ?? "Unable to mark IN.");
  }

  static async markOut(gatePassId: string) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ out_time: formatDbTimestamp() })
      .eq("id", gatePassId)
      .not("in_time", "is", null)
      .is("out_time", null)
      .select()
      .single();

    if (!error && data) {
      return data;
    }

    if (error?.code === "PGRST116") {
      throw new Error("Gate pass must be marked IN before marking OUT, or it is already marked.");
    }

    throw new Error(error?.message ?? "Unable to mark OUT.");
  }
}

export default GatePassService;
