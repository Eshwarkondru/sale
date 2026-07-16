import { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BarChart3, BrainCircuit, Trophy,
  Upload, Settings, User as UserIcon, LogOut, Moon, Sun, Menu, X, ShieldCheck,
  GraduationCap, Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/students', label: 'Students', icon: <Users size={18} /> },
  { to: '/eda', label: 'Data Analysis', icon: <BarChart3 size={18} /> },
  { to: '/ml', label: 'Machine Learning', icon: <BrainCircuit size={18} /> },
  { to: '/leaderboard', label: 'Leaderboard', icon: <Trophy size={18} /> },
  { to: '/upload', label: 'Upload Dataset', icon: <Upload size={18} />, adminOnly: true },
  { to: '/admin', label: 'Admin Panel', icon: <ShieldCheck size={18} />, adminOnly: true },
  { to: '/profile', label: 'Profile', icon: <UserIcon size={18} /> },
  { to: '/settings', label: 'Settings', icon: <Settings size={18} /> },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const { students } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const items = NAV.filter((n) => !n.adminOnly || profile?.role === 'admin');

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const weakCount = students.filter((s) => s.final_marks < 50).length;
  const notifications = [
    weakCount > 0 ? `${weakCount} student(s) need attention (final marks < 50).` : 'All students performing well.',
    `Dataset loaded with ${students.length} records.`,
    'ML model ready to train on the ML page.',
  ];

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-[#0b1020]">
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-72 shrink-0 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full m-3 rounded-2xl glass flex flex-col p-4">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-glow">
              <GraduationCap size={22} />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight text-slate-800 dark:text-white">EduInsight AI</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Student Performance Analysis</p>
            </div>
            <button className="ml-auto lg:hidden text-slate-500" onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
            {items.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-glow'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-white/10">
            <div className="flex items-center gap-3 px-2">
              <div className="grid place-items-center h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white text-sm font-semibold">
                {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{profile?.full_name ?? 'User'}</p>
                <p className="text-[11px] text-slate-500 capitalize">{profile?.role ?? 'student'}</p>
              </div>
              <button onClick={handleSignOut} className="ml-auto text-slate-400 hover:text-rose-500 transition-colors" title="Sign out">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 px-4 lg:px-8 py-3">
          <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
            <button className="lg:hidden text-slate-600 dark:text-slate-300" onClick={() => setOpen(true)}>
              <Menu size={22} />
            </button>
            <div className="hidden sm:block">
              <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back,</p>
              <p className="font-display font-semibold text-slate-800 dark:text-white -mt-0.5">{profile?.full_name ?? 'Student'}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="btn-ghost relative !px-2.5"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-72 glass-card p-3 z-50 animate-fade-in">
                    <p className="font-semibold text-sm mb-2 text-slate-700 dark:text-slate-200">Notifications</p>
                    <ul className="space-y-2">
                      {notifications.map((n, i) => (
                        <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button onClick={toggle} className="btn-ghost !px-2.5" aria-label="Toggle theme">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
