import { supabase } from "../config/supabase";
import { sendNotification } from "../config/firebaseAdmin";
import { GatePassCreateRequest } from "../types/gatePass";
import {SessionCreateRequest} from "../types/facultyTypes";

class FacultyService {
  static async createGatePass(
    teacherErpId: string,
    teacherName: string,
    payload: GatePassCreateRequest,
  ) {
    const { data, error } = await supabase
      .from("gate_pass_requests")
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

  static async saveToken(erpid: string, token: string): Promise<void> {
    const { error } = await supabase
      .from("fcm_tokens")
      .upsert({ erpid, token }, { onConflict: "erpid" });

    if (error) {
      throw new Error(error.message);
    }
  }

  static async triggerNotification(erpid: string, type?: string): Promise<void> {
    await sendNotification(erpid, type);
  }

  static async sessionStart(payload: SessionCreateRequest, facultyErpId: string) {
    // console.log("this is payload",payload);
    console.log("this is insertion rotue");
    console.log("this is facultyErpId",facultyErpId);
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        ...payload,
        faculty_erpid: facultyErpId,
      })
      .select()
      .single();

    if (error) {
      console.log(error);
      throw new Error(error.message);
    }

    return data;
  }
}

export default FacultyService;
