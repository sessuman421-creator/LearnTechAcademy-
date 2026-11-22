import 'dotenv/config';
import dns from 'node:dns';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Archiver, ArchiverOptions } from 'archiver';
import ExcelJS from 'exceljs';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dns.setDefaultResultOrder('ipv4first');

const require = createRequire(import.meta.url);
const createArchiver = require('archiver') as (format: 'zip' | 'tar', options?: ArchiverOptions) => Archiver;
import {
  db,
  getAdminAnalytics,
  getUserProfileById,
  recordUserSignIn,
  touchUserStreak,
  createPaymentRequest,
  adminUpdateUserAccess,
  adminReviewPaymentRequest,
  type DbUserRow,
} from './server/db.ts';
import {
  ADMIN_EMAIL,
  clearSessionCookie,
  extractAuthenticatedUser,
  requireAdmin,
  requireAuth,
  setSessionCookie,
  signSessionToken,
  verifyCsrfProtection,
  type AuthenticatedRequest,
} from './server/auth.ts';
import { COURSES, getCourseBySlug, getLessonById, getNextRecommendedLesson } from './src/data/courses.ts';
import { PRACTICE_PROBLEMS } from './src/data/problems.ts';
import { PLAN_PRICES, canAccessCourseLesson, canAccessPracticeProblem, hasFullProAccess } from './src/utils/access.ts';
import type { CurrencyCode, ProResourceItem, SubscriptionPlan } from './src/types/academy.ts';

const PORT = Number(process.env.PORT) || 3000;

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildFallbackAssistantReply(
  message: string,
  context: { pathname?: string; courseSlug?: string; lessonId?: string; editorCode?: string; editorLanguage?: string },
  userProfile: ReturnType<typeof getUserProfileById>
): string {
  const q = message.toLowerCase();
  const completedSet = new Set(userProfile?.completedLessons.map((l) => l.lessonId) ?? []);
  const enrolled = userProfile?.enrolledCourses ?? [];
  const nextRec = getNextRecommendedLesson(enrolled, completedSet);

  if (q.includes('next') || q.includes('suggest') || q.includes('recommend')) {
    if (nextRec) {
      return `Based on your progress (${completedSet.size} lessons completed, ${userProfile?.xp ?? 0} XP), your recommended next step is **Lesson ${nextRec.lesson.number}: ${nextRec.lesson.title}** inside **${nextRec.course.title}** (${nextRec.course.category}).\n\nSummary: ${nextRec.lesson.summary}`;
    }
    return `You have completed every available lesson! Head over to the Practice Lab to sharpen your skills across Python, JavaScript, and HTML/CSS challenges.`;
  }

  if (q.includes('debug') || q.includes('error') || q.includes('fix')) {
    const lang = context.editorLanguage || 'code';
    const snippet = (context.editorCode || '').slice(0, 220);
    return `Offline Mentor Check (${lang}):\n1. Verify edge cases like empty arrays \`[]\`, empty strings \`""\`, or negative numbers.\n2. Confirm your function returns the exact expected type rather than only printing to console.\n3. Check variable scoping and loop bounds.${snippet ? `\n\nInspecting your active snippet (\`${snippet.split('\n')[0]}...\`), trace one sample input line-by-line and check return values.` : ''}`;
  }

  if (context.courseSlug && context.lessonId) {
    const found = getLessonById(context.courseSlug, context.lessonId);
    if (found) {
      return `In **${found.lesson.title}** (${found.course.title}):\n${found.lesson.summary}\n\nKey takeaway: ${found.lesson.notes[0]?.keyPoints?.[0] ?? found.lesson.notes[0]?.body ?? ''}`;
    }
  }

  return `I'm running in offline curriculum mode right now. ${
    nextRec
      ? `Your next suggested lesson is **${nextRec.lesson.title}** in **${nextRec.course.title}** (${nextRec.course.category}).`
      : 'Explore our 8 engineering tracks or 30 coding practice labs anytime.'
  } Ask me to suggest your next lesson, review a concept, or check common debugging pitfalls.`;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', verifyCsrfProtection);

  // Health endpoints
  app.get('/api/health', (_req, res) => {
    try {
      db.prepare('SELECT 1').get();
      res.json({ ok: true, database: 'connected' });
    } catch {
      res.status(500).json({ ok: false });
    }
  });

  // ==================== AUTH ROUTES ====================
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';

      if (name.length < 2 || name.length > 80) {
        return res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }
      if (rawPassword.length > 128) {
        return res.status(400).json({ error: 'Invalid credentials payload.' });
      }

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const secretSeed = rawPassword.length > 0 ? rawPassword : crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(secretSeed, 10);
      const role: 'admin' | 'student' = email === ADMIN_EMAIL ? 'admin' : 'student';
      const nowIso = new Date().toISOString();
      const today = nowIso.slice(0, 10);

      const info = db
        .prepare(
          `INSERT INTO users (name, email, password_hash, role, xp, streak, last_active_date, last_signed_in, date_joined)
           VALUES (?, ?, ?, ?, 0, 1, ?, ?, ?)`
        )
        .run(name, email, passwordHash, role, today, nowIso, nowIso);

      const userId = Number(info.lastInsertRowid);
      const token = signSessionToken({ sub: userId, email, role });
      setSessionCookie(req, res, token);

      const profile = getUserProfileById(userId);
      return res.status(201).json({ user: profile, token });
    } catch (err) {
      console.error('Signup error:', err);
      return res.status(500).json({ error: 'Unable to create account right now.' });
    }
  });

  app.post('/api/auth/signin', async (req, res) => {
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUserRow | undefined;
      if (!user || user.password_hash.startsWith('seeded:')) {
        return res.status(401).json({ error: 'No account found with this email. Please create an account first.' });
      }

      recordUserSignIn(user.id);
      const effectiveRole: 'admin' | 'student' = user.email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'student';
      if (effectiveRole !== user.role) {
        db.prepare('UPDATE users SET role = ? WHERE id = ?').run(effectiveRole, user.id);
      }

      const token = signSessionToken({ sub: user.id, email: user.email, role: effectiveRole });
      setSessionCookie(req, res, token);

      const profile = getUserProfileById(user.id);
      return res.json({ user: profile, token });
    } catch (err) {
      console.error('Signin error:', err);
      return res.status(500).json({ error: 'Unable to sign in right now.' });
    }
  });

  app.post('/api/auth/signout', (req, res) => {
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req, res) => {
    const user = extractAuthenticatedUser(req);
    if (!user) {
      return res.json({ user: null });
    }
    touchUserStreak(user.id);
    return res.json({ user: getUserProfileById(user.id) });
  });

  // ==================== COURSE & PRACTICE PROGRESS ====================
  app.post('/api/courses/:slug/enroll', requireAuth, (req: AuthenticatedRequest, res) => {
    const slug = String(req.params.slug || '');
    const course = getCourseBySlug(slug);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    const userId = req.authUser!.id;
    db.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_slug, enrolled_at) VALUES (?, ?, ?)').run(
      userId,
      slug,
      new Date().toISOString()
    );
    touchUserStreak(userId);
    return res.json({ user: getUserProfileById(userId) });
  });

  app.post('/api/courses/:slug/lessons/:lessonId/complete', requireAuth, (req: AuthenticatedRequest, res) => {
    const slug = String(req.params.slug || '');
    const lessonId = String(req.params.lessonId || '');
    const found = getLessonById(slug, lessonId);
    if (!found) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }
    const userId = req.authUser!.id;
    const profile = getUserProfileById(userId);
    if (!canAccessCourseLesson(profile, slug, found.lesson.number)) {
      return res.status(403).json({
        error: 'This lesson requires admin-approved Pro access or specific access to this course.',
      });
    }

    const quizScore = Math.max(0, Math.min(3, Number(req.body?.quizScore) || 0));
    const nowIso = new Date().toISOString();

    const tx = db.transaction(() => {
      db.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_slug, enrolled_at) VALUES (?, ?, ?)').run(
        userId,
        slug,
        nowIso
      );
      const result = db
        .prepare(
          'INSERT OR IGNORE INTO lesson_progress (user_id, course_slug, lesson_id, completed_at, quiz_score) VALUES (?, ?, ?, ?, ?)'
        )
        .run(userId, slug, lessonId, nowIso, quizScore);

      if (result.changes > 0) {
        db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(found.lesson.xpReward, userId);
      } else {
        db.prepare(
          'UPDATE lesson_progress SET quiz_score = MAX(quiz_score, ?) WHERE user_id = ? AND course_slug = ? AND lesson_id = ?'
        ).run(quizScore, userId, slug, lessonId);
      }
    });

    tx();
    touchUserStreak(userId);
    return res.json({ user: getUserProfileById(userId) });
  });

  app.post('/api/practice/:problemId/complete', requireAuth, (req: AuthenticatedRequest, res) => {
    const problemId = String(req.params.problemId || '');
    const problem = PRACTICE_PROBLEMS.find((p) => p.id === problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Practice problem not found.' });
    }
    const userId = req.authUser!.id;
    const profile = getUserProfileById(userId);
    if (!canAccessPracticeProblem(profile, problem.id)) {
      return res.status(403).json({
        error: 'Advanced coding practice challenges (6–10) require admin-approved Pro access.',
      });
    }

    const nowIso = new Date().toISOString();

    const tx = db.transaction(() => {
      const result = db
        .prepare(
          'INSERT OR IGNORE INTO practice_submissions (user_id, problem_id, language, xp_awarded, completed_at) VALUES (?, ?, ?, ?, ?)'
        )
        .run(userId, problem.id, problem.language, problem.xp, nowIso);
      if (result.changes > 0) {
        db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(problem.xp, userId);
      }
    });

    tx();
    touchUserStreak(userId);
    return res.json({ user: getUserProfileById(userId) });
  });

  // ==================== SUBSCRIPTION PAYMENTS & PRO RESOURCES ====================
  app.post('/api/payments/submit', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const planRequested = req.body?.planRequested === 'team' ? 'team' : req.body?.planRequested === 'pro' ? 'pro' : null;
      if (!planRequested) {
        return res.status(400).json({ error: 'Please select Pro Engineer or Team Cohort plan.' });
      }
      const currency: CurrencyCode = req.body?.currency === 'NGN' ? 'NGN' : 'GHS';
      const paymentReference = typeof req.body?.paymentReference === 'string' ? req.body.paymentReference.trim() : '';
      if (paymentReference.length < 3 || paymentReference.length > 120) {
        return res.status(400).json({
          error: 'Please enter your Telecel transaction ID or sender reference (3–120 characters).',
        });
      }
      const confirmationChannel = req.body?.confirmationChannel === 'whatsapp' ? 'whatsapp' : 'email';
      const validSlugs = new Set(COURSES.map((c) => c.slug));
      const requestedCourses = Array.isArray(req.body?.requestedCourses)
        ? req.body.requestedCourses.filter((s: unknown): s is string => typeof s === 'string' && validSlugs.has(s))
        : [];

      const amount = PLAN_PRICES[planRequested];
      const userId = req.authUser!.id;
      const paymentRequest = createPaymentRequest({
        userId,
        planRequested,
        currency,
        amount,
        paymentReference,
        confirmationChannel,
        requestedCourses,
      });

      return res.status(201).json({
        paymentRequest,
        user: getUserProfileById(userId),
      });
    } catch (err) {
      console.error('Submit payment error:', err);
      return res.status(500).json({ error: 'Failed to record payment confirmation.' });
    }
  });

  app.get('/api/pro/resources', requireAuth, (req: AuthenticatedRequest, res) => {
    const profile = getUserProfileById(req.authUser!.id);
    if (!profile) {
      return res.status(401).json({ error: 'Account not found.' });
    }
    const unlocked = hasFullProAccess(profile) || profile.approvedCourses.length > 0;
    if (!unlocked) {
      return res.status(403).json({
        error: 'Pro Engineering Resource Vault unlocks once the admin approves your payment.',
      });
    }

    const resources: ProResourceItem[] = [
      {
        id: 'res-system-design',
        title: 'Production System Design & API Latency Playbook',
        category: 'Architecture Guide',
        format: 'Markdown Playbook',
        summary: 'Step-by-step patterns for P95 latency reduction, PostgreSQL/SQLite indexing, idempotent webhooks, and rate limiting.',
        content: [
          '# Production System Design & API Latency Playbook',
          '',
          '## 1. Database Query Hygiene',
          '- Create composite indexes matching `(user_id, created_at DESC)` on high-read tables.',
          '- Replace N+1 query loops with batched `IN (...)` or `JOIN` statements.',
          '- Enable WAL mode for concurrent SQLite reads and single-writer durability.',
          '',
          '## 2. Idempotent Write Endpoints',
          '- Accept an `Idempotency-Key` header on payment and mutation routes.',
          '- Wrap balance updates and ledger inserts inside a single atomic transaction.',
          '',
          '## 3. Caching & Edge Discipline',
          '- Cache immutable curriculum payloads with `Cache-Control: public, max-age=3600`.',
          '- Never cache authenticated `/api/auth/me`, `/api/pro/*`, or `/api/admin/*` responses.',
        ].join('\n'),
      },
      {
        id: 'res-security-checklist',
        title: 'OWASP Application Security & Auth Audit Checklist',
        category: 'Cyber Security',
        format: 'Audit Checklist',
        summary: 'Pre-launch verification list covering HttpOnly cookies, CSRF headers, bcrypt rounds, parameterized SQL, and RBAC.',
        content: [
          '# OWASP Application Security & Auth Audit Checklist',
          '',
          '- [x] Store sessions in `HttpOnly`, `SameSite=Lax`, `Secure` (HTTPS) cookies.',
          '- [x] Verify custom CSRF header (`X-Requested-With`) on state-changing `/api` calls.',
          '- [x] Enforce server-side RBAC checks before every admin mutation.',
          '- [x] Parameterize 100% of SQLite statements — zero string interpolation.',
          '- [x] Derive payment prices strictly on the server from trusted plan constants.',
        ].join('\n'),
      },
      {
        id: 'res-ai-evals',
        title: 'AI Engineering Evaluation & RAG Benchmarking Kit',
        category: 'AI Engineering',
        format: 'Engineering Spec',
        summary: 'Evaluation rubric for grounded RAG pipelines, hybrid BM25 + vector reranking, and hallucination guardrails.',
        content: [
          '# AI Engineering Evaluation & RAG Benchmarking Kit',
          '',
          '## Core Metrics',
          '1. **Context Recall@5**: Fraction of expected evidence chunks retrieved in the top 5.',
          '2. **Groundedness**: Every factual claim in output traces back to retrieved snippets.',
          '3. **Time to First Token (TTFT)**: Target `< 1.2s` over SSE streaming.',
          '',
          '## Hybrid Reranking Formula (RRF)',
          '`score(d) = sum(1 / (60 + rank_i(d)))` across lexical and vector lists.',
        ].join('\n'),
      },
      {
        id: 'res-interview-prep',
        title: 'Senior Full-Stack Technical Interview Rubric & Prep Sheet',
        category: 'Career & Interviews',
        format: 'Study Sheet',
        summary: 'Structured walkthrough for coding rounds, API architecture whiteboarding, and debugging trade-offs.',
        content: [
          '# Senior Full-Stack Technical Interview Rubric',
          '',
          '## 45-Minute Coding Round Cadence',
          '- **0–5m**: Clarify input types, constraints, and edge cases (`[]`, `null`, duplicates).',
          '- **5–15m**: Outline brute-force vs optimal time/space complexity (`O(n)` hash map or two pointers).',
          '- **15–35m**: Implement clean, modular solution and trace 2 dry runs.',
          '- **35–45m**: Discuss testing, failure modes, and concurrency.',
        ].join('\n'),
      },
    ];

    return res.json({
      fullPro: hasFullProAccess(profile),
      approvedCourses: profile.approvedCourses,
      resources,
    });
  });

  // ==================== AI ASSISTANT ROUTE ====================
  app.post('/api/ai/chat', requireAuth, async (req: AuthenticatedRequest, res) => {
    const startedAt = Date.now();
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > 4000) {
      return res.status(400).json({ error: 'Please provide a message under 4000 characters.' });
    }

    const wantStream =
      req.query?.stream === '1' ||
      String(req.headers.accept || '').includes('text/event-stream');

    const context = (req.body?.context && typeof req.body.context === 'object' ? req.body.context : {}) as {
      pathname?: string;
      courseSlug?: string;
      courseTitle?: string;
      lessonId?: string;
      lessonTitle?: string;
      editorCode?: string;
      editorLanguage?: string;
      mode?: 'general' | 'debug' | 'lesson' | 'architecture' | 'interview';
    };

    const history = Array.isArray(req.body?.history)
      ? (req.body.history as { role: string; text: string }[]).slice(-6)
      : [];

    const userProfile = getUserProfileById(req.authUser!.id);
    const requestedMode = context.mode || 'general';
    if ((requestedMode === 'architecture' || requestedMode === 'interview') && !hasFullProAccess(userProfile)) {
      return res.status(403).json({
        error: 'Architecture Review and Mock Interview modes unlock after your Pro subscription is approved by the admin.',
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const fallback = buildFallbackAssistantReply(message, context, userProfile);
      return res.json({ reply: fallback, mode: 'fallback' });
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(new Error('Upstream AI request timed out')), 35000);
    res.on('close', () => {
      if (!res.writableEnded) {
        controller.abort(new Error('Client closed connection'));
      }
    });

    try {
      const completedSet = new Set(userProfile?.completedLessons.map((l) => l.lessonId) ?? []);
      const nextRec = getNextRecommendedLesson(userProfile?.enrolledCourses ?? [], completedSet);
      const currentLesson =
        context.courseSlug && context.lessonId ? getLessonById(context.courseSlug, context.lessonId) : undefined;
      const catalogSummary = COURSES.map((c) => `${c.title} (${c.category}, ${c.lessons.length} lessons)`).join('; ');

      const modeFocus =
        requestedMode === 'debug'
          ? 'Active Mentor Mode: Debug Code. Identify root causes, edge cases, and provide exact corrected code.'
          : requestedMode === 'lesson'
          ? 'Active Mentor Mode: Lesson Coach. Break down concepts step-by-step and quiz understanding.'
          : requestedMode === 'architecture'
          ? 'Active Mentor Mode (Pro): Architecture Review. Critique scalability, security boundaries, data modeling, and latency trade-offs.'
          : requestedMode === 'interview'
          ? 'Active Mentor Mode (Pro): Mock Technical Interview. Conduct structured engineering interview Q&A, ask follow-up probes, and score clarity/complexity.'
          : 'Active Mentor Mode: General Engineering Mentor.';

      const systemInstruction = [
        'You are the LearnTech Academy AI Engineering Mentor — crisp, clear, encouraging, and deeply technical like ChatGPT.',
        modeFocus,
        'Format every reply using clean Markdown so it is effortless to scan:',
        '1. Start immediately with a direct 1–2 sentence answer (no generic filler greetings).',
        '2. Use concise ### section headings, bullet points with **bold lead-ins**, and numbered steps for debugging or walkthroughs.',
        '3. Always tag fenced code blocks with their language (e.g. ```python, ```ts, ```html) and keep examples minimal and runnable. Use backticks like `O(1)` for Big-O/math instead of LaTeX `$...$` delimiters.',
        '4. When recommending a lesson or track, format it as a clickable Markdown link like [Lesson Title](/courses/course-slug/lessons/lesson-id) or [Track Title](/courses/course-slug).',
        '5. End complex explanations with one brief optional follow-up suggestion (e.g., offering a practice tip or edge-case check).',
        `Available Academy Courses: ${catalogSummary}.`,
        userProfile
          ? `Signed-in Student: ${userProfile.name}, Plan: ${userProfile.plan}${userProfile.proApproved ? ' (Pro Approved)' : ''}, XP: ${userProfile.xp}, Streak: ${userProfile.streak} days, Enrolled Courses: ${userProfile.enrolledCourses.join(', ') || 'None yet'}, Completed Lessons: ${userProfile.completedLessons.length}, Solved Practice Problems: ${userProfile.completedProblems.length}.`
          : 'Visitor is currently browsing as a guest.',
        nextRec
          ? `Recommended next uncompleted lesson for this user: [${nextRec.lesson.title}](/courses/${nextRec.course.slug}/lessons/${nextRec.lesson.id}) in "${nextRec.course.title}".`
          : '',
        currentLesson
          ? `User is currently viewing lesson: "${currentLesson.lesson.title}" in "${currentLesson.course.title}". Summary: ${currentLesson.lesson.summary}`
          : context.lessonTitle || context.courseTitle
          ? `Recent learning context: ${context.courseTitle || ''} ${context.lessonTitle ? `— ${context.lessonTitle}` : ''}`
          : `Current page: ${context.pathname || '/'}`,
        context.editorCode
          ? `Active code editor (${context.editorLanguage || 'code'}):\n\`\`\`${context.editorLanguage || ''}\n${String(context.editorCode).slice(0, 2000)}\n\`\`\``
          : '',
        'Aim for clear, complete, well-paced answers (typically 120–280 words; longer only when walking through code).',
      ]
        .filter(Boolean)
        .join('\n\n');

      const transcript = history
        .map((m) => `${m.role === 'user' ? 'Student' : 'Mentor'}: ${String(m.text).slice(0, 800)}`)
        .join('\n');

      const contents = transcript ? `${transcript}\nStudent: ${message}` : message;

      const runAttempt = async (modelName: string, level: ThinkingLevel, timeoutMs: number) => {
        const attemptController = new AbortController();
        const timer = setTimeout(
          () => attemptController.abort(new Error(`${modelName} timed out after ${timeoutMs}ms`)),
          timeoutMs
        );
        const onParentAbort = () => attemptController.abort(controller.signal.reason);
        controller.signal.addEventListener('abort', onParentAbort, { once: true });

        try {
          if (wantStream) {
            const stream = await ai.models.generateContentStream({
              model: modelName,
              contents,
              config: {
                systemInstruction,
                thinkingConfig: { thinkingLevel: level },
                abortSignal: attemptController.signal,
              },
            });

            let fullText = '';
            for await (const chunk of stream) {
              const delta = chunk.text ?? '';
              if (delta) {
                fullText += delta;
                res.write(`data: ${JSON.stringify({ delta })}\n\n`);
              }
            }
            return fullText;
          }

          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              thinkingConfig: { thinkingLevel: level },
              abortSignal: attemptController.signal,
            },
          });
          return response.text ?? '';
        } finally {
          clearTimeout(timer);
          controller.signal.removeEventListener('abort', onParentAbort);
        }
      };

      const attempts: { model: string; level: ThinkingLevel; timeoutMs: number }[] = [
        { model: 'gemini-3.1-flash-lite', level: ThinkingLevel.MINIMAL, timeoutMs: 10000 },
        { model: 'gemini-3.1-flash-lite', level: ThinkingLevel.MINIMAL, timeoutMs: 10000 },
        { model: 'gemini-4-hydrogen', level: ThinkingLevel.LOW, timeoutMs: 12000 },
      ];

      if (wantStream) {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
      }

      let finalReply = '';
      let lastErr: unknown = null;

      for (let i = 0; i < attempts.length; i++) {
        if (controller.signal.aborted) break;
        const { model, level, timeoutMs } = attempts[i];
        try {
          const text = await runAttempt(model, level, timeoutMs);
          if (text.trim()) {
            finalReply = text;
            break;
          }
          lastErr = new Error('Empty response from AI model.');
        } catch (err) {
          lastErr = err;
          if (controller.signal.aborted) break;
          if (i < attempts.length - 1) {
            await new Promise((r) => setTimeout(r, 300 * (i + 1)));
          }
        }
      }

      if (!finalReply.trim()) {
        if (lastErr) throw lastErr;
        if (wantStream) {
          res.write(`data: ${JSON.stringify({ error: 'AI mentor returned an empty response. Please try again.' })}\n\n`);
          return res.end();
        }
        return res.status(502).json({ error: 'AI mentor returned an empty response. Please try again.' });
      }

      if (wantStream) {
        res.write(`data: ${JSON.stringify({ done: true, ms: Date.now() - startedAt })}\n\n`);
        return res.end();
      }
      return res.json({ reply: finalReply.trim(), mode: 'gemini', ms: Date.now() - startedAt });
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : 'Upstream AI service error';
      let cleanMsg = rawMsg;
      try {
        const parsed = JSON.parse(rawMsg) as { error?: { message?: string } };
        if (parsed?.error?.message) {
          try {
            const inner = JSON.parse(parsed.error.message) as { error?: { message?: string } };
            cleanMsg = inner?.error?.message || parsed.error.message;
          } catch {
            cleanMsg = parsed.error.message;
          }
        }
      } catch {
        // keep rawMsg
      }
      console.error(`AI chat error (${Date.now() - startedAt}ms):`, cleanMsg);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: `AI Mentor unavailable: ${cleanMsg}` })}\n\n`);
        return res.end();
      }
      return res.status(502).json({ error: `AI Mentor unavailable: ${cleanMsg}` });
    } finally {
      clearTimeout(timeoutHandle);
    }
  });

  // ==================== ADMIN ROUTES (STRICTLY AUTHORIZED ADMIN ONLY) ====================
  app.get('/api/admin/stats', requireAdmin, (_req, res) => {
    const analytics = getAdminAnalytics();
    return res.json(analytics);
  });

  app.post('/api/admin/users/:userId/approve', requireAdmin, (req: AuthenticatedRequest, res) => {
    const targetUserId = Number(req.params.userId);
    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }
    const exists = db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId);
    if (!exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const rawPlan = req.body?.plan;
    const plan: SubscriptionPlan =
      rawPlan === 'team' || rawPlan === 'pro' || rawPlan === 'free' ? rawPlan : 'free';
    const proApproved = Boolean(req.body?.proApproved);
    const validSlugs = new Set(COURSES.map((c) => c.slug));
    const approvedCourses = Array.isArray(req.body?.approvedCourses)
      ? req.body.approvedCourses.filter((s: unknown): s is string => typeof s === 'string' && validSlugs.has(s))
      : [];
    const adminNote = typeof req.body?.adminNote === 'string' ? req.body.adminNote.trim().slice(0, 240) : undefined;

    adminUpdateUserAccess({
      targetUserId,
      plan,
      proApproved,
      approvedCourses,
      adminEmail: 'Academy Admin',
      adminNote,
    });

    return res.json(getAdminAnalytics());
  });

  app.post('/api/admin/payments/:requestId/review', requireAdmin, (req: AuthenticatedRequest, res) => {
    const requestId = Number(req.params.requestId);
    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({ error: 'Invalid payment request ID.' });
    }
    const decision = req.body?.decision === 'rejected' ? 'rejected' : req.body?.decision === 'approved' ? 'approved' : null;
    if (!decision) {
      return res.status(400).json({ error: 'Decision must be approved or rejected.' });
    }

    const validSlugs = new Set(COURSES.map((c) => c.slug));
    const overridePlan =
      req.body?.overridePlan === 'team' || req.body?.overridePlan === 'pro' || req.body?.overridePlan === 'free'
        ? (req.body.overridePlan as SubscriptionPlan)
        : undefined;
    const overrideCourses = Array.isArray(req.body?.overrideCourses)
      ? req.body.overrideCourses.filter((s: unknown): s is string => typeof s === 'string' && validSlugs.has(s))
      : undefined;
    const adminNote = typeof req.body?.adminNote === 'string' ? req.body.adminNote.trim().slice(0, 240) : undefined;

    const updatedUserId = adminReviewPaymentRequest({
      requestId,
      decision,
      adminEmail: 'Academy Admin',
      adminNote,
      overridePlan,
      overrideCourses,
    });

    if (updatedUserId === null) {
      return res.status(404).json({ error: 'Payment request not found.' });
    }

    return res.json(getAdminAnalytics());
  });

  app.get('/api/admin/export-csv', requireAdmin, (_req, res) => {
    const { users } = getAdminAnalytics();
    const header = [
      'ID',
      'Name',
      'Email',
      'Role',
      'Plan',
      'Pro Approved',
      'Approved Courses',
      'Date Joined',
      'Courses Enrolled',
      'Lessons Completed',
      'Problems Solved',
      'XP',
      'Streak',
    ];
    const lines = [
      header.map(escapeCsvCell).join(','),
      ...users.map((u) =>
        [
          u.id,
          u.name,
          u.email,
          u.role,
          u.plan,
          u.proApproved ? 'Yes' : 'No',
          u.approvedCourses.join(' | ') || 'None',
          u.dateJoined,
          u.coursesEnrolled.join(' | ') || 'None',
          u.lessonsCompletedCount,
          u.problemsSolvedCount,
          u.xp,
          u.streak,
        ]
          .map(escapeCsvCell)
          .join(',')
      ),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="learntech-users.csv"');
    return res.send(lines.join('\r\n'));
  });

  app.get('/api/admin/export-excel', requireAdmin, async (_req, res) => {
    try {
      const { users } = getAdminAnalytics();
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'LearnTech Academy';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Users');
      sheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Name', key: 'name', width: 24 },
        { header: 'Email', key: 'email', width: 32 },
        { header: 'Role', key: 'role', width: 12 },
        { header: 'Plan', key: 'plan', width: 12 },
        { header: 'Pro Approved', key: 'proApproved', width: 14 },
        { header: 'Approved Courses', key: 'approvedCourses', width: 32 },
        { header: 'Date Joined', key: 'dateJoined', width: 24 },
        { header: 'Courses Enrolled', key: 'courses', width: 42 },
        { header: 'Lessons Completed', key: 'lessons', width: 18 },
        { header: 'Problems Solved', key: 'problems', width: 16 },
        { header: 'XP', key: 'xp', width: 10 },
        { header: 'Streak (Days)', key: 'streak', width: 14 },
      ];

      sheet.getRow(1).font = { bold: true };
      for (const u of users) {
        sheet.addRow({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          plan: u.plan,
          proApproved: u.proApproved ? 'Yes' : 'No',
          approvedCourses: u.approvedCourses.join(', ') || 'None',
          dateJoined: u.dateJoined,
          courses: u.coursesEnrolled.join(', ') || 'None',
          lessons: u.lessonsCompletedCount,
          problems: u.problemsSolvedCount,
          xp: u.xp,
          streak: u.streak,
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="learntech-users.xlsx"');
      return res.send(Buffer.from(buffer));
    } catch (err) {
      console.error('Excel export error:', err);
      return res.status(500).json({ error: 'Failed to generate Excel workbook.' });
    }
  });

  app.get('/api/admin/export-db', requireAdmin, async (_req, res) => {
    const tmpBackup = path.join(os.tmpdir(), `learntech-backup-${Date.now()}.db`);
    try {
      await db.backup(tmpBackup);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment; filename="learntech-academy.db"');
      const stream = fs.createReadStream(tmpBackup);
      stream.on('close', () => {
        fs.unlink(tmpBackup, () => {});
      });
      stream.pipe(res);
    } catch (err) {
      fs.unlink(tmpBackup, () => {});
      console.error('DB backup error:', err);
      return res.status(500).json({ error: 'Failed to export SQLite database.' });
    }
  });

  app.get('/api/admin/export-zip', requireAdmin, (_req, res) => {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="learntech-academy-source.zip"');

    const archive = createArchiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err: unknown) => {
      console.error('ZIP archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create source ZIP.' });
      } else {
        res.end();
      }
    });

    archive.pipe(res);
    archive.glob('**/*', {
      cwd: process.cwd(),
      dot: false,
      ignore: [
        'node_modules/**',
        '.next/**',
        'dist/**',
        '.git/**',
        '*.db',
        '*.db-wal',
        '*.db-shm',
      ],
    });
    archive.finalize();
  });

  // ==================== VITE DEV OR STATIC PRODUCTION ====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LearnTech Academy listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
