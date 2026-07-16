import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Student } from './types';
import { SUBJECTS, SUBJECT_LABELS } from './types';
import { gradeFromMarks, categoryFromMarks } from './ml';
import { generateRecommendations } from './recommendations';

export function generateStudentReport(s: Student): void {
  const doc = new jsPDF();
  const grade = gradeFromMarks(s.final_marks);
  const category = categoryFromMarks(s.final_marks);
  const passFail = s.final_marks >= 40 ? 'Pass' : 'Fail';

  // Header band
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('EduInsight AI - Student Performance Report', 14, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 22);

  // Student details
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Details', 14, 38);
  autoTable(doc, {
    startY: 42,
    head: [['Field', 'Value']],
    body: [
      ['Roll Number', s.student_id],
      ['Name', s.name],
      ['Age', String(s.age ?? '-')],
      ['Gender', s.gender],
      ['Department', s.department],
      ['Attendance', `${s.attendance}%`],
      ['Previous GPA', String(s.previous_gpa)],
      ['Study Hours/day', String(s.study_hours)],
      ['Assignments Completed', `${s.assignments_completed}/10`],
      ['Internal Marks', String(s.internal_marks)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
  });

  // Subject marks
  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject Performance', 14, y);
  autoTable(doc, {
    startY: y + 4,
    head: [['Subject', 'Marks', 'Grade']],
    body: SUBJECTS.map((sub) => [SUBJECT_LABELS[sub], String(s[sub]), gradeFromMarks(Number(s[sub]))]),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
  });

  // Prediction
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Prediction Summary', 14, y);
  autoTable(doc, {
    startY: y + 4,
    head: [['Metric', 'Result']],
    body: [
      ['Predicted Final Marks', String(Math.round(s.final_marks))],
      ['Grade', grade],
      ['Pass / Fail', passFail],
      ['Performance Category', category],
    ],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
  });

  // Recommendations
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Recommendations', 14, y);
  const recs = generateRecommendations(s);
  autoTable(doc, {
    startY: y + 4,
    head: [['Priority', 'Recommendation', 'Detail']],
    body: recs.map((r) => [r.priority.toUpperCase(), r.title, r.detail]),
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
    columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 50 } },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('EduInsight AI - Confidential Student Report', 14, 290);
    doc.text(`Page ${i} of ${pageCount}`, 180, 290);
  }

  doc.save(`${s.student_id}_${s.name.replace(/\s+/g, '_')}_report.pdf`);
}
