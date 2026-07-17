import { supabase } from "../config/supabase";
import { sendNotification } from "../config/firebaseAdmin";
import {SessionCreateRequest} from "../types/facultyTypes";

class FacultyService {
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

    return data.id;
  }

  static async completeSession(sessionID: number) {
    const { data, error } = await supabase
      .from("sessions")
      .update({
        status: "pending",
      })
      .eq("id", sessionID)
      .select();

      console.log("data:", data);
      console.log("error:", error);

      if (error) {
        console.log("got the error");
        throw new Error(error.message);
      }

    console.log("changed to pending");
    return data;
  }
}



export default FacultyService;
