import type { Student } from './types';
import { SUBJECTS, SUBJECT_LABELS } from './types';
import { predictStudent } from './ml';

export interface Recommendation {
  title: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
}

export function generateRecommendations(s: Student): Recommendation[] {
  const recs: Recommendation[] = [];
  const pred = predictStudent(s);

  if (s.attendance < 85) {
    recs.push({
      title: 'Improve Attendance',
      detail: `Your attendance is ${s.attendance}%. Aim to keep attendance above 85% to stay on track and access all lectures.`,
      priority: 'high',
    });
  }

  if (s.study_hours < 4) {
    const target = Math.ceil((s.study_hours + 1.5) * 10) / 10;
    recs.push({
      title: 'Increase Study Hours',
      detail: `You currently study ${s.study_hours} hrs/day. Increase study hours from ${s.study_hours} to ${target} hours/day for better retention.`,
      priority: 'high',
    });
  }

  const subjectMarks = SUBJECTS.map((sub) => ({ sub, mark: Number(s[sub] ?? 0) }));
  const weakest = [...subjectMarks].sort((a, b) => a.mark - b.mark)[0];
  if (weakest && weakest.mark < 60) {
    recs.push({
      title: `Focus on ${SUBJECT_LABELS[weakest.sub as typeof SUBJECTS[number]]}`,
      detail: `Your ${SUBJECT_LABELS[weakest.sub as typeof SUBJECTS[number]]} score is ${weakest.mark}. Practice ${SUBJECT_LABELS[weakest.sub as typeof SUBJECTS[number]]} for at least 45 minutes daily and solve previous papers.`,
      priority: 'high',
    });
  }

  if (s.assignments_completed < 8) {
    recs.push({
      title: 'Complete Pending Assignments',
      detail: `You completed ${s.assignments_completed}/10 assignments. Complete pending assignments before Friday to boost internal marks.`,
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

  if (pred.riskLevel === 'Medium Risk') {
    recs.push({
      title: 'Medium Risk Alert',
      detail: `Based on your recent performance, you have a medium risk of scoring below 70%. Increase study consistency and attend all upcoming lectures.`,
      priority: 'medium',
    });
  }

  if (pred.riskLevel === 'High Risk') {
    recs.push({
      title: 'High Risk Warning',
      detail: `You are at high risk of poor academic performance. Please consult your faculty advisor immediately and create a remediation plan.`,
      priority: 'high',
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
