import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

function resolvePostLoginPath(role: 'admin' | 'student' | undefined, from?: string): string {
  if (from && from.startsWith('/') && from !== '/signin' && from !== '/signup') {
    if (from === '/admin' && role !== 'admin') {
      return '/dashboard';
    }
    return from;
  }
  return role === 'admin' ? '/admin' : '/';
}

export function SignInPage() {
  const { user, loading, signin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={resolvePostLoginPath(user.role, fromPath)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await signin(email);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? 'Sign in failed.');
      return;
    }
    navigate(resolvePostLoginPath(res.user?.role, fromPath), { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl surface-card p-6 sm:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-[#E6E3DC] bg-[#FAF9F6] px-2.5 py-1 text-xs font-medium text-stone-600">
          <ShieldCheck className="h-3.5 w-3.5 text-sky-700" />
          <span>Sign in required to enter LearnTech Academy</span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900">Sign in</h1>
        <p className="mt-1.5 text-sm text-stone-500">
          Enter your email address to access courses, coding labs, AI mentorship, and your XP streak.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="signin-email" className="block text-xs font-medium text-stone-700">
              Email Address
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="signin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#E6E3DC] bg-[#FAF9F6] py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-800" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Signing In...' : 'Sign In with Email'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-stone-500">
          New to LearnTech Academy?{' '}
          <Link to="/signup" state={location.state} className="font-semibold text-sky-700 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export function SignUpPage() {
  const { user, loading, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string } | null)?.from;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={resolvePostLoginPath(user.role, fromPath)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await signup(name, email);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? 'Could not create account.');
      return;
    }
    navigate(resolvePostLoginPath(res.user?.role, fromPath), { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl surface-card p-6 sm:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-[#E6E3DC] bg-[#FAF9F6] px-2.5 py-1 text-xs font-medium text-stone-600">
          <ShieldCheck className="h-3.5 w-3.5 text-sky-700" />
          <span>Create your account to enter LearnTech Academy</span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900">Create account</h1>
        <p className="mt-1.5 text-sm text-stone-500">
          Your name, email, and join date are saved in SQLite. Sign in anytime using your email only.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="signup-name" className="block text-xs font-medium text-stone-700">
              Full Name
            </label>
            <div className="relative mt-1.5">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="signup-name"
                type="text"
                required
                minLength={2}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full rounded-xl border border-[#E6E3DC] bg-[#FAF9F6] py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-xs font-medium text-stone-700">
              Email Address
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#E6E3DC] bg-[#FAF9F6] py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-800" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-stone-500">
          Already have an account?{' '}
          <Link to="/signin" state={location.state} className="font-semibold text-sky-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
