import { Session } from "../types/session";

const API_URL = "https://campusconnectapp-lu1d.onrender.com";

// const API_URL = "http://10.109.186.90:5000/api";

export async function getTeacherAttendance(
  teacherId: string
): Promise<Session[]> {
  // const API_URL = "https://campusconnectapp-lu1d.onrender.com"; // Replace with your actual API base URL
  try {
    const response = await fetch(
      `${API_URL}/faculty/teacher/${teacherId}`
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


export async function getSessionAttendance(

  sessionId: string
  
) {
  const response = await fetch(
    `${API_URL}/faculty/teacher/session/${sessionId}`
  //  console.log("Status:", response.status);

  
  );

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message);
  }

  return result.attendance;
}


export async function updateAttendance(
  attendanceId: number,
  status: "Present" | "Absent"
) {
  const response = await fetch(
    `${API_URL}/faculty/attendance/${attendanceId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  );

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message);
  }

  return result.attendance;
}

