import { useState } from 'react';
import { Moon, Sun, Bell, Globe, Shield, LogOut } from 'lucide-react';
import Card from '../components/Card';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
