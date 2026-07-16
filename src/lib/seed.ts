import type { StudentInput } from './types';
import { DEPARTMENTS } from './types';

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna',
  'Ishaan', 'Rohan', 'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Pari', 'Riya',
  'Myra', 'Sara', 'Anika', 'Neha', 'Kabir', 'Aryan', 'Dhruv', 'Kiaan',
  'Rahul', 'Priya', 'Tara', 'Zara', 'Neil', 'Ira',
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Nair',
  'Iyer', 'Menon', 'Joshi', 'Rao', 'Mehta', 'Chopra', 'Malhotra', 'Kapoor',
  'Bose', 'Das', 'Banerjee', 'Pillai',
];

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}
function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

// Deterministic-ish PRNG so re-seeding gives stable-ish data; here we just use Math.random.
export function generateSampleStudents(count = 1000): StudentInput[] {
  const students: StudentInput[] = [];
  for (let i = 0; i < count; i++) {
    const gender = Math.random() > 0.45 ? 'Male' : 'Female';
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const department = pick(DEPARTMENTS);
    const attendance = Math.round(rand(55, 99));
    const studyHours = Math.round(rand(1, 10) * 10) / 10;

    // Correlate marks with attendance + study hours so ML finds signal.
    const base = (attendance * 0.4 + studyHours * 4) / 2;
    const math = Math.min(100, Math.max(20, Math.round(base + rand(-15, 15))));
    const physics = Math.min(100, Math.max(20, Math.round(base + rand(-18, 12))));
    const chemistry = Math.min(100, Math.max(20, Math.round(base + rand(-16, 14))));
    const english = Math.min(100, Math.max(25, Math.round(base + rand(-10, 18))));
    const computer = Math.min(100, Math.max(25, Math.round(base + rand(-8, 20))));

    const assignmentsCompleted = randInt(4, 10);
    const internalMarks = Math.min(100, Math.max(30, Math.round(base + rand(-10, 15))));
    const previousGpa = Math.min(10, Math.max(3, Math.round((base / 10) * 10) / 10));

    const subjectAvg = (math + physics + chemistry + english + computer) / 5;
    const finalMarks = Math.min(
      100,
      Math.max(
        20,
        Math.round(
          subjectAvg * 0.45 +
            attendance * 0.15 +
            internalMarks * 0.2 +
            assignmentsCompleted * 2 +
            studyHours * 1.5 +
            rand(-6, 6),
        ),
      ),
    );

    students.push({
      student_id: `STU${String(i + 1).padStart(4, '0')}`,
      name,
      age: randInt(17, 22),
      gender,
      department,
      attendance,
      math,
      physics,
      chemistry,
      english,
      computer,
      previous_gpa: previousGpa,
      study_hours: studyHours,
      assignments_completed: assignmentsCompleted,
      internal_marks: internalMarks,
      final_marks: finalMarks,
    });
  }
  return students;
}
