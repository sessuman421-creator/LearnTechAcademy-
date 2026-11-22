import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CurrencyCode, PaymentRequestRecord, SubscriptionPlan, UserProfile } from '../types/academy.ts';

export interface EditorContextSnapshot {
  code?: string;
  language?: string;
  courseSlug?: string;
  courseTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  pathname?: string;
}

export interface SubmitPaymentPayload {
  planRequested: SubscriptionPlan;
  currency: CurrencyCode;
  paymentReference: string;
  confirmationChannel: 'email' | 'whatsapp';
  requestedCourses: string[];
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  editorContext: EditorContextSnapshot;
  setEditorContext: (snap: EditorContextSnapshot) => void;
  refreshUser: () => Promise<void>;
  signin: (email: string) => Promise<{ ok: boolean; error?: string; user?: UserProfile }>;
  signup: (name: string, email: string) => Promise<{ ok: boolean; error?: string; user?: UserProfile }>;
  signout: () => Promise<void>;
  enrollCourse: (slug: string) => Promise<void>;
  completeLesson: (slug: string, lessonId: string, quizScore: number) => Promise<{ ok: boolean; error?: string }>;
  completePractice: (problemId: string) => Promise<{ ok: boolean; error?: string }>;
  submitPayment: (
    payload: SubmitPaymentPayload
  ) => Promise<{ ok: boolean; error?: string; paymentRequest?: PaymentRequestRecord }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_STORAGE_KEY = 'learntech_session_token';

function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY) || window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null) {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('X-Requested-With', 'LearnTech');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorContext, setEditorContextState] = useState<EditorContextSnapshot>({});

  const setEditorContext = useCallback((snap: EditorContextSnapshot) => {
    setEditorContextState((prev) =>
      prev.code === snap.code &&
      prev.language === snap.language &&
      prev.courseSlug === snap.courseSlug &&
      prev.courseTitle === snap.courseTitle &&
      prev.lessonId === snap.lessonId &&
      prev.lessonTitle === snap.lessonTitle &&
      prev.pathname === snap.pathname
        ? prev
        : snap
    );
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const data = (await res.json()) as { user: UserProfile | null };
        if (!data.user) {
          setStoredToken(null);
        }
        setUser(data.user);
      } else {
        setStoredToken(null);
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const signin = useCallback(async (email: string) => {
    try {
      const res = await apiFetch('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { user?: UserProfile; token?: string; error?: string };
      if (!res.ok || !data.user) {
        return { ok: false, error: data.error || 'Sign in failed.' };
      }
      if (data.token) {
        setStoredToken(data.token);
      }
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch {
      return { ok: false, error: 'Network error while signing in.' };
    }
  }, []);

  const signup = useCallback(async (name: string, email: string) => {
    try {
      const res = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email }),
      });
      const data = (await res.json()) as { user?: UserProfile; token?: string; error?: string };
      if (!res.ok || !data.user) {
        return { ok: false, error: data.error || 'Registration failed.' };
      }
      if (data.token) {
        setStoredToken(data.token);
      }
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch {
      return { ok: false, error: 'Network error while creating account.' };
    }
  }, []);

  const signout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/signout', { method: 'POST' });
    } finally {
      setStoredToken(null);
      setUser(null);
    }
  }, []);

  const enrollCourse = useCallback(async (slug: string) => {
    const res = await apiFetch(`/api/courses/${encodeURIComponent(slug)}/enroll`, { method: 'POST' });
    if (res.ok) {
      const data = (await res.json()) as { user: UserProfile };
      setUser(data.user);
    }
  }, []);

  const completeLesson = useCallback(async (slug: string, lessonId: string, quizScore: number) => {
    const res = await apiFetch(
      `/api/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonId)}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ quizScore }),
      }
    );
    const data = (await res.json()) as { user?: UserProfile; error?: string };
    if (res.ok && data.user) {
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error || 'Unable to complete lesson.' };
  }, []);

  const completePractice = useCallback(async (problemId: string) => {
    const res = await apiFetch(`/api/practice/${encodeURIComponent(problemId)}/complete`, {
      method: 'POST',
    });
    const data = (await res.json()) as { user?: UserProfile; error?: string };
    if (res.ok && data.user) {
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error || 'Unable to record practice completion.' };
  }, []);

  const submitPayment = useCallback(async (payload: SubmitPaymentPayload) => {
    try {
      const res = await apiFetch('/api/payments/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        user?: UserProfile;
        paymentRequest?: PaymentRequestRecord;
        error?: string;
      };
      if (!res.ok || !data.user) {
        return { ok: false, error: data.error || 'Failed to submit payment confirmation.' };
      }
      setUser(data.user);
      return { ok: true, paymentRequest: data.paymentRequest };
    } catch {
      return { ok: false, error: 'Network error while submitting payment.' };
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      editorContext,
      setEditorContext,
      refreshUser,
      signin,
      signup,
      signout,
      enrollCourse,
      completeLesson,
      completePractice,
      submitPayment,
    }),
    [
      user,
      loading,
      editorContext,
      setEditorContext,
      refreshUser,
      signin,
      signup,
      signout,
      enrollCourse,
      completeLesson,
      completePractice,
      submitPayment,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
