export const YEAR_OPTIONS = [
  { label: "First Year", value: 1 },
  { label: "Second Year", value: 2 },
  { label: "Third Year", value: 3 },
  { label: "Fourth Year", value: 4 },
] as const;

export const DEPARTMENT_OPTIONS = [
  { label: "Computer Science", value: 1 },
  { label: "Electrical", value: 2 },
  { label: "Mechanical", value: 3 },
  { label: "Civil", value: 4 },
  { label: "Chemical", value: 5 },
] as const;

export const SUBJECT_OPTIONS = [
  { label: "Mathematics", value: 101 },
  { label: "Physics", value: 102 },
  { label: "Chemistry", value: 103 },
  { label: "Computer Science", value: 104 },
  { label: "Electronics", value: 105 },
  { label: "Mechanics", value: 106 },
] as const;

export const SECTION_OPTIONS = [
  { label: "Section A", division: "A", divisionId: "A" },
  { label: "Section B", division: "B", divisionId: "B" },
  { label: "Section C", division: "C", divisionId: "C" },
  { label: "Section D", division: "D", divisionId: "D" },
] as const;

export const SEMESTER_OPTIONS: Record<string, { label: string; value: number }[]> = {
  "First Year": [
    { label: "Semester 1", value: 1 },
    { label: "Semester 2", value: 2 },
  ],
  "Second Year": [
    { label: "Semester 3", value: 3 },
    { label: "Semester 4", value: 4 },
  ],
  "Third Year": [
    { label: "Semester 5", value: 5 },
    { label: "Semester 6", value: 6 },
  ],
  "Fourth Year": [
    { label: "Semester 7", value: 7 },
    { label: "Semester 8", value: 8 },
  ],
};
