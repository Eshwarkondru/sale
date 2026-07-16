import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { supabase } from '../lib/supabase';
import Spinner from '../components/Spinner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a recovery link."
      footer={<Link to="/login" className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 hover:underline"><ArrowLeft size={14} /> Back to login</Link>}
    >
      {sent ? (
        <div className="text-center py-6">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">Check your inbox</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">We've sent a password reset link to <span className="font-medium">{email}</span>.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
            </div>
          </div>
          {error && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Spinner size={18} /> : <Mail size={18} />}
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
