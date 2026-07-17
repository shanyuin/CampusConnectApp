import {
  DEPARTMENT_OPTIONS,
  SECTION_OPTIONS,
  SEMESTER_OPTIONS,
  SUBJECT_OPTIONS,
  YEAR_OPTIONS,
} from "./facultySessionConfig";

export type SessionFormState = {
  selectedYear: string;
  selectedDepartment: string;
  selectedSemester: string;
  selectedSection: string;
  selectedSubject: string;
  batch: string;
  location: string;
  selectedDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
};

export const getDefaultSessionFormState = (): SessionFormState => ({
  selectedYear: "",
  selectedDepartment: "",
  selectedSemester: "",
  selectedSection: "",
  selectedSubject: "",
  batch: "",
  location: "",
  selectedDate: null,
  startTime: null,
  endTime: null,
});

export const validateSessionForm = (state: SessionFormState): string | null => {
  if (!state.selectedYear) return "Please select a year.";
  if (!state.selectedDepartment) return "Please select a department.";
  if (!state.selectedSemester) return "Please select a semester.";
  if (!state.selectedSection) return "Please select a section.";
  if (!state.selectedSubject) return "Please select a subject.";
  if (!state.location.trim()) return "Please enter a location.";
  if (!state.selectedDate) return "Please select a date.";
  if (!state.startTime || !state.endTime) return "Please select start and end time.";
  if (state.endTime <= state.startTime) return "End time must be after start time.";
  return null;
};

const requireOption = <T extends { label: string }>(options: readonly T[], label: string): T => {
  const option = options.find(item => item.label === label);
  if (!option) {
    throw new Error(`Unknown option selected: ${label}`);
  }
  return option;
};

export const buildSessionPayload = (state: SessionFormState) => {
  const year = requireOption(YEAR_OPTIONS, state.selectedYear);
  const department = requireOption(DEPARTMENT_OPTIONS, state.selectedDepartment);
  const subject = requireOption(SUBJECT_OPTIONS, state.selectedSubject);
  const section = requireOption(SECTION_OPTIONS, state.selectedSection);
  const semester = requireOption(
    SEMESTER_OPTIONS[state.selectedYear] ?? [],
    state.selectedSemester,
  );

  if (!state.selectedDate || !state.startTime || !state.endTime) {
    throw new Error("Date and time must be selected before building payload.");
  }

  return {
    department_id: department.value,
    subject_id: subject.value,
    division_id: section.divisionId,
    division: section.division,
    year: year.value,
    semester: semester.value,
    batch: state.batch.trim(),
    location: state.location.trim(),
    session_date: state.selectedDate.toISOString().split("T")[0],
    start_time: state.startTime.toISOString(),
    end_time: state.endTime.toISOString(),
  };
};

export const formatDateLabel = (date: Date | null) => {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatTimeLabel = (date: Date | null) => {
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
