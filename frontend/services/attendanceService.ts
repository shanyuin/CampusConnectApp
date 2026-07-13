import { Session } from "../types/session";

export async function getTeacherAttendance(
  teacherId: string
): Promise<Session[]> {
  const API_URL = "https://campusconnectapp-lu1d.onrender.com"; // Replace with your actual API base URL
  try {
    const response = await fetch(
      `${API_URL}/api/faculty/teacher/${teacherId}`
    );

    console.log("Status:", response.status);

    const text = await response.text();
    console.log("Response:", text);

    // If request failed, log the response and throw an error
    if (!response.ok) {
      throw new Error(
        `Request failed (${response.status}): ${text}`
      );
    }

    // Parse JSON only after confirming it's a successful response
    const result = JSON.parse(text);

    console.log("Parsed Result:", result);

    if (!result.success) {
      throw new Error(result.message || "Failed to fetch attendance");
    }

    return result.sessions;
  } catch (error) {
    console.error("getTeacherAttendance Error:", error);
    throw error;
  }
}