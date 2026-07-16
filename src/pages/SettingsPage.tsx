import { useState } from 'react';
import { Moon, Sun, Bell, Globe, Shield, LogOut, KeyRound, Sparkles, ExternalLink, Check, AlertCircle } from 'lucide-react';
import Card from '../components/Card';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { setGeminiApiKey, clearGeminiApiKey, hasGeminiApiKey } from '../lib/gemini';

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Customize your experience.</p>
      </div>

      <GeminiKeySection />

      <Card title="Appearance" subtitle="Theme and display preferences">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={18} className="text-brand-500" /> : <Sun size={18} className="text-amber-500" />}
            <div>
              <p className="font-medium text-slate-800 dark:text-white">Dark Mode</p>
              <p className="text-sm text-slate-500">Toggle between light and dark themes.</p>
            </div>
          </div>
          <button
            onClick={toggle}
            className={`relative h-7 w-12 rounded-full transition-colors ${theme === 'dark' ? 'bg-brand-600' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </Card>

      <Card title="Notifications" subtitle="Manage alert preferences">
        <Toggle icon={<Bell size={18} />} label="Push Notifications" desc="Get notified about weak students." defaultOn />
        <Toggle icon={<Globe size={18} />} label="Email Updates" desc="Weekly performance summaries." />
      </Card>

      <Card title="Account" subtitle="Security and session">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-emerald-500" />
            <div>
              <p className="font-medium text-slate-800 dark:text-white">Sign Out</p>
              <p className="text-sm text-slate-500">End your current session.</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="btn-outline text-rose-500 border-rose-300 dark:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-500/10">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </Card>
    </div>
  );
}

function Toggle({ icon, label, desc, defaultOn }: { icon: React.ReactNode; label: string; desc: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="font-medium text-slate-800 dark:text-white">{label}</p>
          <p className="text-sm text-slate-500">{desc}</p>
        </div>
      </div>
      <button onClick={() => setOn((v) => !v)} className={`relative h-7 w-12 rounded-full transition-colors ${on ? 'bg-brand-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function GeminiKeySection() {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState(hasGeminiApiKey());

  const handleSave = () => {
    if (!keyInput.trim()) return;
    setGeminiApiKey(keyInput);
    setKeyInput('');
    setHasKey(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClear = () => {
    clearGeminiApiKey();
    setHasKey(false);
    setKeyInput('');
  };

  return (
    <Card
      title="Gemini AI Configuration"
      subtitle="Connect Google Gemini to power the AI Assistant"
      action={<Sparkles size={18} className="text-brand-500" />}
    >
      <div className="space-y-4">
        {hasKey ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-4 py-3">
            <Check size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300 flex-1">
              Gemini API key is configured. The AI Assistant is ready to use.
            </p>
            <button onClick={handleClear} className="text-sm font-medium text-rose-600 dark:text-rose-400 hover:underline">
              Remove Key
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-4 py-3">
            <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300 flex-1">
              No API key configured. The AI Assistant will show a setup screen until you add a key.
            </p>
          </div>
        )}

        <div>
          <label className="label">Update Gemini API Key</label>
          <div className="relative">
            <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showKey ? 'text' : 'password'}
              className="input pl-10 pr-20"
              placeholder={hasKey ? 'Enter new key to replace...' : 'Paste your Gemini API key...'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Stored locally in your browser (localStorage). Get a free key from{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-brand-600 dark:text-brand-400 hover:underline">
              Google AI Studio <ExternalLink size={11} />
            </a>
          </p>
        </div>

        <button onClick={handleSave} disabled={!keyInput.trim()} className="btn-primary">
          <KeyRound size={18} /> {saved ? 'Saved!' : 'Save API Key'}
        </button>
      </div>
    </Card>
  );
}
