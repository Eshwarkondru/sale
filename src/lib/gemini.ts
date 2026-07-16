import type { Student } from './types';
import { predictStudent } from './ml';
import { generateRecommendations } from './recommendations';
import { SUBJECTS, SUBJECT_LABELS } from './types';

const STORAGE_KEY = 'edupulse_gemini_api_key';

export function getGeminiApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setGeminiApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function clearGeminiApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasGeminiApiKey(): boolean {
  const key = getGeminiApiKey();
  return !!key && key.trim().length > 0;
}

export function buildStudentContext(student: Student | undefined): string {
  if (!student) return 'No student data is currently available.';

  const pred = predictStudent(student);
  const recs = generateRecommendations(student);
  const subjectLines = SUBJECTS.map(
    (s) => `  - ${SUBJECT_LABELS[s]}: ${student[s] ?? 0}/100`,
  ).join('\n');

  const recLines = recs.map((r, i) => `  ${i + 1}. ${r.title}: ${r.detail}`).join('\n');

  return `You are an AI academic assistant for the EduPulse AI student success platform. A student is asking you questions about their academic performance. Use the following student data to give personalized, accurate, and helpful responses. Be encouraging but honest.

STUDENT PROFILE:
- Name: ${student.name}
- Roll Number: ${student.student_id}
- Department: ${student.department}
- Semester: ${student.semester ?? 1}
- Age: ${student.age ?? 'N/A'}
- Gender: ${student.gender}
- Attendance: ${student.attendance}%
- Previous GPA: ${student.previous_gpa}
- Study Hours/Day: ${student.study_hours}
- Assignments Completed: ${student.assignments_completed}/10
- Internal Marks: ${student.internal_marks}/100
- Quiz Marks: ${student.quiz_marks ?? 0}/100
- Final Marks: ${student.final_marks}/100

SUBJECT MARKS:
${subjectLines}

ML PREDICTIONS:
- Predicted Final Marks: ${pred.predictedMarks}
- Predicted GPA: ${pred.predictedGPA}
- Grade: ${pred.grade}
- Pass Probability: ${Math.round(pred.passProbability * 100)}%
- Backlog Risk: ${pred.backlogRisk ? 'Yes' : 'No'}
- Performance Category: ${pred.category}
- Risk Level: ${pred.riskLevel}

PERSONALIZED RECOMMENDATIONS:
${recLines}

INSTRUCTIONS:
- Answer questions based on the data above.
- When asked about predictions, share the ML prediction values.
- When asked about risk, explain the risk level and what it means.
- When asked for recommendations, use the recommendations above but expand on them with practical advice.
- When asked about specific subjects, reference the subject marks.
- Keep responses concise but thorough. Use bullet points where helpful.
- If asked about something unrelated to academics, gently steer the conversation back to academic performance.`;
}

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: string;
}

export async function callGemini(
  apiKey: string,
  messages: GeminiMessage[],
  systemContext: string,
): Promise<string> {
  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.parts }],
  }));

  const body = {
    contents,
    systemInstruction: { parts: [{ text: systemContext }] },
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = `Gemini API error (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMsg = errorJson.error?.message ?? errorMsg;
    } catch {
      if (errorText) errorMsg += `: ${errorText.slice(0, 200)}`;
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error('No response from Gemini API.');
  if (candidate.finishReason === 'SAFETY') throw new Error('Response was blocked by safety filters.');
  const text = candidate.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini API.');
  return text;
}
