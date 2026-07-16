import { useState, type FormEvent } from 'react';
import { User, Mail, ShieldCheck, Save, GraduationCap } from 'lucide-react';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Spinner from '../components/Spinner';

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user!.id);
    setBusy(false);
    if (error) setMsg(error.message);
    else { setMsg('Profile updated.'); await refreshProfile(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Profile</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your account information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="text-center">
            <div className="grid place-items-center h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-white text-3xl font-bold mx-auto shadow-glow">
              {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <p className="mt-3 font-semibold text-slate-800 dark:text-white">{profile?.full_name ?? 'User'}</p>
            <p className="text-sm text-slate-500">{profile?.email}</p>
            <span className={`badge mt-2 ${profile?.role === 'admin' ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
              {profile?.role === 'admin' ? <ShieldCheck size={12} className="mr-1" /> : <GraduationCap size={12} className="mr-1" />}
              {profile?.role}
            </span>
          </div>
        </Card>

        <Card title="Edit Profile" className="lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-4 max-w-md">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Email (read-only)</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9 opacity-60" value={profile?.email ?? ''} disabled />
              </div>
            </div>
            {msg && <p className="text-sm text-emerald-600">{msg}</p>}
            <button className="btn-primary" disabled={busy}>{busy ? <Spinner size={16} /> : <Save size={16} />} Save Changes</button>
          </form>
        </Card>
      </div>
    </div>
  );
}
