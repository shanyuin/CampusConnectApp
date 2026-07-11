export interface SessionCreateRequest {
  faculty_erpid: string;
  division_id: string;
  subject_id: number;
  department_id: number;
  year: number;
  division: string;
  semester: number;
  session_date: string;      // YYYY-MM-DD
  cloudinary_prefix: string;
  start_time: string;        // ISO timestamp
  end_time: string;          // ISO timestamp
  location: string;
  batch: string;
}