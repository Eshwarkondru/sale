import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, KeyRound, ExternalLink, AlertCircle } from 'lucide-react';
import Card from '../components/Card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { type ChatMessage } from '../lib/types';
import {
  getGeminiApiKey,
  setGeminiApiKey,
  hasGeminiApiKey,
  buildStudentContext,
  callGemini,
  type GeminiMessage,
} from '../lib/gemini';

export default function ChatbotPage() {
  const { user } = useAuth();
  const { students } = useData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    if (!user) { setLoading(false); return; }
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
        message: "Hi! I'm your Gemini-powered AI academic assistant. Ask me about your performance, predictions, study tips, or anything academic!",
      }]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setHasKey(hasGeminiApiKey());
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const student = students[0];

  const handleSend = async () => {
    if (!input.trim() || !user || thinking) return;
    setError(null);
    const userMsg: ChatMessage = { role: 'user', message: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setThinking(true);

    await supabase.from('chatbot_logs').insert({ user_id: user.id, role: 'user', message: userMsg.message });

    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        setHasKey(false);
        throw new Error('No Gemini API key configured. Please add your key in Settings.');
      }

      const conversation: GeminiMessage[] = [...messages, userMsg].map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: m.message,
      }));

      const systemContext = buildStudentContext(student);
      const response = await callGemini(apiKey, conversation, systemContext);

      const botMsg: ChatMessage = { role: 'assistant', message: response };
      setMessages((m) => [...m, botMsg]);
      await supabase.from('chatbot_logs').insert({ user_id: user.id, role: 'assistant', message: response });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to get response from Gemini.';
      setError(errMsg);
      const botMsg: ChatMessage = {
        role: 'assistant',
        message: `Sorry, I encountered an error: ${errMsg}`,
      };
      setMessages((m) => [...m, botMsg]);
    } finally {
      setThinking(false);
    }
  };

  const handleKeySaved = () => {
    setHasKey(true);
    setError(null);
  };

  if (loading) return <div className="text-center py-20 text-slate-500">Loading chat...</div>;

  if (!hasKey) {
    return <GeminiSetupScreen onSaved={handleKeySaved} />;
  }

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">AI Academic Assistant</h1>
            <p className="text-slate-500 dark:text-slate-400">Powered by Google Gemini. Ask about your performance, predictions, and study tips.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            <Sparkles size={14} /> Gemini 1.5 Flash
          </span>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <a href="/settings" className="text-rose-600 dark:text-rose-400 font-medium hover:underline">Fix in Settings</a>
        </div>
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200/60 dark:border-white/10 bg-gradient-to-r from-brand-500/10 to-accent-500/10">
          <div className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white">
            <Bot size={18} />
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-800 dark:text-white">EduPulse AI Assistant</p>
            <p className="text-xs text-emerald-500 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online · Gemini</p>
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
              disabled={thinking}
            />
            <button onClick={handleSend} disabled={!input.trim() || thinking} className="btn-primary !px-4">
              <Send size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {['What are my predicted marks?', 'Am I at risk?', 'Which subject should I focus on?', 'Give me study recommendations'].map((sug) => (
              <button key={sug} onClick={() => setInput(sug)} disabled={thinking} className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-brand-100 dark:hover:bg-brand-500/15 hover:text-brand-700 dark:hover:text-brand-300 transition-colors disabled:opacity-50">
                {sug}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function GeminiSetupScreen({ onSaved }: { onSaved: () => void }) {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!key.trim()) return;
    setSaving(true);
    setGeminiApiKey(key);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="inline-grid place-items-center h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-glow mb-4">
          <Sparkles size={32} />
        </div>
        <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Connect Gemini AI</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          The AI Assistant uses Google's Gemini API. Paste your API key to enable real AI-powered responses.
        </p>
      </motion.div>

      <Card title="Gemini API Key Setup" subtitle="Your key is stored locally in your browser only">
        <div className="space-y-5">
          <div className="rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 p-4">
            <p className="text-sm text-brand-700 dark:text-brand-300 font-medium mb-2">How to get your free API key:</p>
            <ol className="text-sm text-brand-600 dark:text-brand-400 space-y-1 list-decimal list-inside">
              <li>Visit Google AI Studio (aistudio.google.com)</li>
              <li>Sign in with your Google account</li>
              <li>Click "Get API Key" and create a new key</li>
              <li>Copy the key and paste it below</li>
            </ol>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline mt-3"
            >
              <ExternalLink size={14} /> Open Google AI Studio
            </a>
          </div>

          <div>
            <label className="label">Gemini API Key</label>
            <div className="relative">
              <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showKey ? 'text' : 'password'}
                className="input pl-10 pr-20"
                placeholder="AIza..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Your key never leaves your browser. It's stored in localStorage for development.</p>
          </div>

          <button onClick={handleSave} disabled={!key.trim() || saving} className="btn-primary w-full">
            <KeyRound size={18} /> {saving ? 'Saving...' : 'Save & Connect'}
          </button>
        </div>
      </Card>
    </div>
  );
}
