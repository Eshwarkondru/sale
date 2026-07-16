import type { Student } from './types';
import { SUBJECTS } from './types';

export interface Recommendation {
  title: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
}

export function generateRecommendations(s: Student): Recommendation[] {
  const recs: Recommendation[] = [];

  if (s.attendance < 85) {
    recs.push({
      title: 'Improve Attendance',
      detail: `Your attendance is ${s.attendance}%. Aim to keep attendance above 85% to stay on track and access all lectures.`,
      priority: 'high',
    });
  }

  if (s.study_hours < 4) {
    recs.push({
      title: 'Increase Study Hours',
      detail: `You currently study ${s.study_hours} hrs/day. Increase study hours by at least 1 hour/day for better retention.`,
      priority: 'high',
    });
  }

  // Weakest subject
  const subjectMarks = SUBJECTS.map((sub) => ({ sub, mark: Number(s[sub] ?? 0) }));
  const weakest = [...subjectMarks].sort((a, b) => a.mark - b.mark)[0];
  if (weakest && weakest.mark < 60) {
    recs.push({
      title: `Focus on ${weakest.sub.charAt(0).toUpperCase() + weakest.sub.slice(1)}`,
      detail: `Your ${weakest.sub} score is ${weakest.mark}. Dedicate extra practice time and solve previous papers in this subject.`,
      priority: 'high',
    });
  }

  if (s.assignments_completed < 8) {
    recs.push({
      title: 'Complete Assignments Regularly',
      detail: `You completed ${s.assignments_completed}/10 assignments. Timely submissions boost internal marks and understanding.`,
      priority: 'medium',
    });
  }

  if (s.internal_marks < 50) {
    recs.push({
      title: 'Strengthen Internal Assessment',
      detail: `Internal marks are ${s.internal_marks}. Participate in class tests and quizzes to improve this score.`,
      priority: 'medium',
    });
  }

  if (s.final_marks >= 75) {
    recs.push({
      title: 'Maintain Excellence',
      detail: 'Great performance! Continue consistent study habits and mentor peers to reinforce your knowledge.',
      priority: 'low',
    });
  }

  if (recs.length === 0) {
    recs.push({
      title: 'Keep Up the Good Work',
      detail: 'All metrics look healthy. Maintain your routine and set stretch goals for the next semester.',
      priority: 'low',
    });
  }

  return recs;
}
