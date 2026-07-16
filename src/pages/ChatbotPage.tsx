import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';

import Card from '../components/Card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { predictStudent, gradeFromMarks } from '../lib/ml';
import { generateRecommendations } from '../lib/recommendations';
import { SUBJECTS, SUBJECT_LABELS, type ChatMessage } from '../lib/types';

export default function ChatbotPage() {
  const { user } = useAuth();
  const { students } = useData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chatbot_logs')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);
    if (data && data.length > 0) {
      setMessages(data as ChatMessage[]);
    } else {
      setMessages([{
        role: 'assistant',
        message: "Hi! I'm your AI academic assistant. Ask me about your performance, predictions, study tips, or at-risk analysis.",
      }]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const student = students[0];

  const generateResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (!student) return 'No student data available. Please upload a dataset first.';

    const pred = predictStudent(student);
    const recs = generateRecommendations(student);

    if (q.includes('predict') || q.includes('forecast') || q.includes('will i')) {
      return `Based on your current data, here are your predictions:\n• Predicted Final Marks: ${pred.predictedMarks}\n• Predicted GPA: ${pred.predictedGPA}\n• Grade: ${pred.grade}\n• Pass Probability: ${Math.round(pred.passProbability * 100)}%\n• Backlog Risk: ${pred.backlogRisk ? 'Yes' : 'No'}\n• Performance Category: ${pred.category}\n• Risk Level: ${pred.riskLevel}`;
    }

    if (q.includes('risk') || q.includes('at-risk') || q.includes('backlog')) {
      return `Your current risk level is "${pred.riskLevel}". ${pred.backlogRisk ? 'You are at risk of a backlog. ' : ''}${pred.riskLevel === 'High Risk' ? 'Immediate action needed: focus on increasing study hours and attendance.' : pred.riskLevel === 'Medium Risk' ? 'Stay consistent and improve weak subjects.' : 'You are on track. Keep maintaining your study routine.'}`;
    }

    if (q.includes('attendance')) {
      return `Your attendance is ${student.attendance}%. ${student.attendance < 85 ? 'This is below the recommended 85%. Try to attend more classes to stay on track.' : 'Great attendance! Keep it up.'}`;
    }

    if (q.includes('study') || q.includes('study hour')) {
      return `You currently study ${student.study_hours} hours/day. ${student.study_hours < 4 ? 'Consider increasing to at least 4-5 hours/day for better academic performance.' : 'Good study hours. Maintain this consistency.'}`;
    }

    if (q.includes('subject') || q.includes('weak') || q.includes('strong')) {
      const marks = SUBJECTS.map((s) => ({ sub: SUBJECT_LABELS[s], mark: Number(student[s] ?? 0) }));
      const weakest = [...marks].sort((a, b) => a.mark - b.mark)[0];
      const strongest = [...marks].sort((a, b) => b.mark - a.mark)[0];
      return `Subject Analysis:\n• Weakest: ${weakest.sub} (${weakest.mark})\n• Strongest: ${strongest.sub} (${strongest.mark})\n\nFocus more on ${weakest.sub} — practice daily and solve previous papers.`;
    }

    if (q.includes('recommend') || q.includes('advice') || q.includes('tip') || q.includes('improve')) {
      return recs.map((r, i) => `${i + 1}. ${r.title}: ${r.detail}`).join('\n\n');
    }

    if (q.includes('grade') || q.includes('gpa')) {
      return `Your current grade is ${gradeFromMarks(student.final_marks)} with a GPA of ${student.previous_gpa}. Predicted final grade: ${pred.grade} (GPA: ${pred.predictedGPA}).`;
    }

    if (q.includes('assignment')) {
      return `You completed ${student.assignments_completed}/10 assignments. ${student.assignments_completed < 8 ? 'Complete pending assignments before deadlines to improve internal marks.' : 'Great assignment completion rate!'}`;
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return `Hello! I'm your AI academic assistant. I can help with:\n• Performance predictions\n• Risk analysis\n• Subject-wise insights\n• Study recommendations\n• Attendance & assignment tracking\n\nWhat would you like to know?`;
    }

    return `I can help with predictions, risk analysis, subject performance, study recommendations, and more. Try asking:\n• "What are my predicted marks?"\n• "Am I at risk?"\n• "Which subject should I focus on?"\n• "Give me study recommendations"`;
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    const userMsg: ChatMessage = { role: 'user', message: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setThinking(true);

    await supabase.from('chatbot_logs').insert({ user_id: user.id, role: 'user', message: userMsg.message });

    await new Promise((r) => setTimeout(r, 600));
    const response = generateResponse(userMsg.message);
    const botMsg: ChatMessage = { role: 'assistant', message: response };
    setMessages((m) => [...m, botMsg]);
    setThinking(false);

    await supabase.from('chatbot_logs').insert({ user_id: user.id, role: 'assistant', message: response });
  };

  if (loading) return <div className="text-center py-20 text-slate-500">Loading chat...</div>;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">AI Academic Assistant</h1>
        <p className="text-slate-500 dark:text-slate-400">Ask about your performance, predictions, risk levels, and personalized recommendations.</p>
      </motion.div>

      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200/60 dark:border-white/10 bg-gradient-to-r from-brand-500/10 to-accent-500/10">
          <div className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white">
            <Bot size={18} />
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-800 dark:text-white">EduPulse AI Assistant</p>
            <p className="text-xs text-emerald-500 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online</p>
          </div>
          <Sparkles size={16} className="ml-auto text-brand-500" />
        </div>

        <div ref={scrollRef} className="h-[480px] overflow-y-auto px-5 py-4 space-y-3">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`grid place-items-center h-8 w-8 rounded-lg shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300' : 'bg-gradient-to-br from-brand-600 to-accent-500 text-white'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 rounded-tl-sm'}`}>
                  {msg.message}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {thinking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
              <div className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-white">
                <Bot size={16} />
              </div>
              <div className="bg-slate-100 dark:bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <motion.div key={d} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: d * 0.15 }} className="h-2 w-2 rounded-full bg-slate-400" />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="border-t border-slate-200/60 dark:border-white/10 p-4">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Ask about your performance, predictions, study tips..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={!input.trim()} className="btn-primary !px-4">
              <Send size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {['What are my predicted marks?', 'Am I at risk?', 'Which subject should I focus on?', 'Give me study recommendations'].map((sug) => (
              <button key={sug} onClick={() => setInput(sug)} className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-brand-100 dark:hover:bg-brand-500/15 hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
                {sug}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
