import Database from 'better-sqlite3';
import path from 'node:path';
import type {
  AdminStatsResponse,
  AdminUserRecord,
  CurrencyCode,
  PaymentRequestRecord,
  PaymentStatus,
  SubscriptionPlan,
  UserProfile,
} from '../src/types/academy.ts';
import { COURSES } from '../src/data/courses.ts';

export const DB_PATH = path.resolve(process.cwd(), 'learntech.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    plan TEXT NOT NULL DEFAULT 'free',
    pro_approved INTEGER NOT NULL DEFAULT 0,
    approved_at TEXT,
    approved_by TEXT,
    xp INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 1,
    last_active_date TEXT NOT NULL,
    last_signed_in TEXT,
    date_joined TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    enrolled_at TEXT NOT NULL,
    UNIQUE(user_id, course_slug)
  );

  CREATE TABLE IF NOT EXISTS lesson_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    quiz_score INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, course_slug, lesson_id)
  );

  CREATE TABLE IF NOT EXISTS practice_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id TEXT NOT NULL,
    language TEXT NOT NULL,
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT NOT NULL,
    UNIQUE(user_id, problem_id)
  );

  CREATE TABLE IF NOT EXISTS course_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    granted_by TEXT NOT NULL,
    granted_at TEXT NOT NULL,
    UNIQUE(user_id, course_slug)
  );

  CREATE TABLE IF NOT EXISTS payment_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_requested TEXT NOT NULL,
    currency TEXT NOT NULL,
    amount INTEGER NOT NULL,
    payment_network TEXT NOT NULL DEFAULT 'Telecel Network (0500717586)',
    payment_reference TEXT NOT NULL,
    confirmation_channel TEXT NOT NULL,
    requested_courses_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    created_at TEXT NOT NULL,
    reviewed_at TEXT,
    reviewed_by TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_users_joined ON users(date_joined);
  CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
  CREATE INDEX IF NOT EXISTS idx_progress_user ON lesson_progress(user_id);
  CREATE INDEX IF NOT EXISTS idx_practice_user ON practice_submissions(user_id);
  CREATE INDEX IF NOT EXISTS idx_course_access_user ON course_access(user_id);
  CREATE INDEX IF NOT EXISTS idx_payment_requests_user ON payment_requests(user_id);
  CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
`);

// Safe additive migration for pre-existing learntech.db files
const existingUserCols = new Set(
  (db.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map((c) => c.name)
);
if (!existingUserCols.has('plan')) {
  db.exec(`ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'`);
}
if (!existingUserCols.has('pro_approved')) {
  db.exec(`ALTER TABLE users ADD COLUMN pro_approved INTEGER NOT NULL DEFAULT 0`);
}
if (!existingUserCols.has('approved_at')) {
  db.exec(`ALTER TABLE users ADD COLUMN approved_at TEXT`);
}
if (!existingUserCols.has('approved_by')) {
  db.exec(`ALTER TABLE users ADD COLUMN approved_by TEXT`);
}
if (!existingUserCols.has('last_signed_in')) {
  db.exec(`ALTER TABLE users ADD COLUMN last_signed_in TEXT`);
}
db.exec(`UPDATE users SET approved_by = 'Academy Admin' WHERE approved_by LIKE '%@%'`);
db.exec(`UPDATE payment_requests SET reviewed_by = 'Academy Admin' WHERE reviewed_by LIKE '%@%'`);
db.exec(`UPDATE course_access SET granted_by = 'Academy Admin' WHERE granted_by LIKE '%@%'`);
// Remove any legacy fake seeded accounts so only real signed-in users appear
db.exec(`DELETE FROM users WHERE password_hash LIKE 'seeded:%'`);

export interface DbUserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'student';
  plan: SubscriptionPlan;
  pro_approved: number;
  approved_at: string | null;
  approved_by: string | null;
  xp: number;
  streak: number;
  last_active_date: string;
  last_signed_in?: string | null;
  date_joined: string;
}

interface DbPaymentRow {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  plan_requested: SubscriptionPlan;
  currency: CurrencyCode;
  amount: number;
  payment_network: string;
  payment_reference: string;
  confirmation_channel: 'email' | 'whatsapp';
  requested_courses_json: string;
  status: PaymentStatus;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

function mapPaymentRow(r: DbPaymentRow): PaymentRequestRecord {
  let requestedCourses: string[] = [];
  try {
    const parsed = JSON.parse(r.requested_courses_json);
    if (Array.isArray(parsed)) {
      requestedCourses = parsed.filter((s): s is string => typeof s === 'string');
    }
  } catch {
    requestedCourses = [];
  }
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    userEmail: r.user_email,
    planRequested: r.plan_requested,
    currency: r.currency,
    amount: r.amount,
    paymentNetwork: r.payment_network,
    paymentReference: r.payment_reference,
    confirmationChannel: r.confirmation_channel,
    requestedCourses,
    status: r.status,
    adminNote: r.admin_note,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
    reviewedBy: r.reviewed_by,
  };
}

export function getUserProfileById(userId: number): UserProfile | null {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as DbUserRow | undefined;
  if (!user) return null;

  const enrolledRows = db
    .prepare('SELECT course_slug FROM enrollments WHERE user_id = ? ORDER BY enrolled_at DESC')
    .all(userId) as { course_slug: string }[];

  const lessonRows = db
    .prepare('SELECT course_slug, lesson_id, completed_at, quiz_score FROM lesson_progress WHERE user_id = ? ORDER BY completed_at DESC')
    .all(userId) as { course_slug: string; lesson_id: string; completed_at: string; quiz_score: number }[];

  const problemRows = db
    .prepare('SELECT problem_id, language, xp_awarded, completed_at FROM practice_submissions WHERE user_id = ? ORDER BY completed_at DESC')
    .all(userId) as { problem_id: string; language: string; xp_awarded: number; completed_at: string }[];

  const accessRows = db
    .prepare('SELECT course_slug FROM course_access WHERE user_id = ? ORDER BY granted_at DESC')
    .all(userId) as { course_slug: string }[];

  const paymentRows = db
    .prepare(
      `SELECT p.*, u.name as user_name, u.email as user_email
       FROM payment_requests p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`
    )
    .all(userId) as DbPaymentRow[];

  const isAdmin = user.role === 'admin';
  const effectivePlan: SubscriptionPlan = isAdmin ? 'pro' : user.plan || 'free';
  const effectiveProApproved = isAdmin || user.pro_approved === 1;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: effectivePlan,
    proApproved: effectiveProApproved,
    approvedAt: user.approved_at ?? null,
    approvedBy: user.approved_by ?? null,
    approvedCourses: accessRows.map((r) => r.course_slug),
    paymentRequests: paymentRows.map(mapPaymentRow),
    xp: user.xp,
    streak: user.streak,
    dateJoined: user.date_joined,
    enrolledCourses: enrolledRows.map((r) => r.course_slug),
    completedLessons: lessonRows.map((r) => ({
      courseSlug: r.course_slug,
      lessonId: r.lesson_id,
      completedAt: r.completed_at,
      quizScore: r.quiz_score,
    })),
    completedProblems: problemRows.map((r) => ({
      problemId: r.problem_id,
      language: r.language,
      xpAwarded: r.xp_awarded,
      completedAt: r.completed_at,
    })),
  };
}

export function touchUserStreak(userId: number) {
  const user = db.prepare('SELECT id, streak, last_active_date FROM users WHERE id = ?').get(userId) as
    | { id: number; streak: number; last_active_date: string }
    | undefined;
  if (!user) return;
  const today = new Date().toISOString().slice(0, 10);
  if (user.last_active_date === today) return;

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const nextStreak = user.last_active_date === yesterday ? user.streak + 1 : 1;
  db.prepare('UPDATE users SET streak = ?, last_active_date = ? WHERE id = ?').run(nextStreak, today, userId);
}

export function recordUserSignIn(userId: number) {
  const nowIso = new Date().toISOString();
  db.prepare('UPDATE users SET last_signed_in = ? WHERE id = ?').run(nowIso, userId);
  touchUserStreak(userId);
}

export function createPaymentRequest(params: {
  userId: number;
  planRequested: SubscriptionPlan;
  currency: CurrencyCode;
  amount: number;
  paymentReference: string;
  confirmationChannel: 'email' | 'whatsapp';
  requestedCourses: string[];
}): PaymentRequestRecord {
  const nowIso = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO payment_requests
       (user_id, plan_requested, currency, amount, payment_network, payment_reference, confirmation_channel, requested_courses_json, status, created_at)
       VALUES (?, ?, ?, ?, 'Telecel Network (0500717586)', ?, ?, ?, 'pending', ?)`
    )
    .run(
      params.userId,
      params.planRequested,
      params.currency,
      params.amount,
      params.paymentReference,
      params.confirmationChannel,
      JSON.stringify(params.requestedCourses),
      nowIso
    );

  const row = db
    .prepare(
      `SELECT p.*, u.name as user_name, u.email as user_email
       FROM payment_requests p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`
    )
    .get(Number(info.lastInsertRowid)) as DbPaymentRow;
  return mapPaymentRow(row);
}

export function adminUpdateUserAccess(params: {
  targetUserId: number;
  plan: SubscriptionPlan;
  proApproved: boolean;
  approvedCourses: string[];
  adminEmail: string;
  adminNote?: string;
}) {
  const nowIso = new Date().toISOString();
  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE users
       SET plan = ?, pro_approved = ?, approved_at = ?, approved_by = ?
       WHERE id = ?`
    ).run(
      params.plan,
      params.proApproved ? 1 : 0,
      params.proApproved || params.approvedCourses.length > 0 ? nowIso : null,
      params.proApproved || params.approvedCourses.length > 0 ? params.adminEmail : null,
      params.targetUserId
    );

    db.prepare('DELETE FROM course_access WHERE user_id = ?').run(params.targetUserId);
    const insertAccess = db.prepare(
      'INSERT OR IGNORE INTO course_access (user_id, course_slug, granted_by, granted_at) VALUES (?, ?, ?, ?)'
    );
    for (const slug of params.approvedCourses) {
      insertAccess.run(params.targetUserId, slug, params.adminEmail, nowIso);
    }

    if (params.proApproved || params.approvedCourses.length > 0) {
      db.prepare(
        `UPDATE payment_requests
         SET status = 'approved', admin_note = COALESCE(?, admin_note), reviewed_at = ?, reviewed_by = ?
         WHERE user_id = ? AND status = 'pending'`
      ).run(params.adminNote ?? 'Confirmed by admin', nowIso, params.adminEmail, params.targetUserId);
    }
  });
  tx();
}

export function adminReviewPaymentRequest(params: {
  requestId: number;
  decision: 'approved' | 'rejected';
  adminEmail: string;
  adminNote?: string;
  overridePlan?: SubscriptionPlan;
  overrideCourses?: string[];
}) {
  const reqRow = db.prepare('SELECT * FROM payment_requests WHERE id = ?').get(params.requestId) as DbPaymentRow | undefined;
  if (!reqRow) return null;

  const nowIso = new Date().toISOString();
  let requestedCourses: string[] = [];
  try {
    const parsed = JSON.parse(reqRow.requested_courses_json);
    if (Array.isArray(parsed)) {
      requestedCourses = parsed.filter((s): s is string => typeof s === 'string');
    }
  } catch {
    requestedCourses = [];
  }

  const finalCourses = params.overrideCourses ?? requestedCourses;
  const finalPlan: SubscriptionPlan = params.overridePlan ?? reqRow.plan_requested;

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE payment_requests
       SET status = ?, admin_note = ?, reviewed_at = ?, reviewed_by = ?
       WHERE id = ?`
    ).run(params.decision, params.adminNote ?? null, nowIso, params.adminEmail, params.requestId);

    if (params.decision === 'approved') {
      const upgradeFullPro = finalPlan === 'pro' || finalPlan === 'team';
      if (upgradeFullPro) {
        db.prepare(
          `UPDATE users
           SET plan = ?, pro_approved = 1, approved_at = ?, approved_by = ?
           WHERE id = ?`
        ).run(finalPlan, nowIso, params.adminEmail, reqRow.user_id);
      }

      if (finalCourses.length > 0) {
        const insertAccess = db.prepare(
          'INSERT OR IGNORE INTO course_access (user_id, course_slug, granted_by, granted_at) VALUES (?, ?, ?, ?)'
        );
        for (const slug of finalCourses) {
          insertAccess.run(reqRow.user_id, slug, params.adminEmail, nowIso);
        }
        if (!upgradeFullPro) {
          db.prepare(
            `UPDATE users SET approved_at = COALESCE(approved_at, ?), approved_by = COALESCE(approved_by, ?) WHERE id = ?`
          ).run(nowIso, params.adminEmail, reqRow.user_id);
        }
      }
    }
  });

  tx();
  return reqRow.user_id;
}

export function getAdminAnalytics(): AdminStatsResponse {
  const users = db
    .prepare(`SELECT * FROM users WHERE role = 'student' ORDER BY COALESCE(last_signed_in, date_joined) DESC`)
    .all() as DbUserRow[];
  const studentIds = new Set(users.map((u) => u.id));
  const enrollments = db.prepare('SELECT user_id, course_slug FROM enrollments').all() as {
    user_id: number;
    course_slug: string;
  }[];
  const lessonCounts = db
    .prepare('SELECT user_id, COUNT(*) as cnt FROM lesson_progress GROUP BY user_id')
    .all() as { user_id: number; cnt: number }[];
  const problemCounts = db
    .prepare('SELECT user_id, COUNT(*) as cnt FROM practice_submissions GROUP BY user_id')
    .all() as { user_id: number; cnt: number }[];
  const accessRows = db.prepare('SELECT user_id, course_slug FROM course_access').all() as {
    user_id: number;
    course_slug: string;
  }[];
  const paymentRows = db
    .prepare(
      `SELECT p.*, u.name as user_name, u.email as user_email
       FROM payment_requests p
       JOIN users u ON u.id = p.user_id
       WHERE u.role = 'student'
       ORDER BY CASE WHEN p.status = 'pending' THEN 0 ELSE 1 END, p.created_at DESC`
    )
    .all() as DbPaymentRow[];

  const enrollByUser = new Map<number, string[]>();
  const accessByUser = new Map<number, string[]>();
  const categoryCountMap = new Map<string, number>();

  for (const e of enrollments) {
    if (!studentIds.has(e.user_id)) continue;
    const list = enrollByUser.get(e.user_id) ?? [];
    list.push(e.course_slug);
    enrollByUser.set(e.user_id, list);

    const course = COURSES.find((c) => c.slug === e.course_slug);
    const cat = course?.category ?? e.course_slug;
    categoryCountMap.set(cat, (categoryCountMap.get(cat) ?? 0) + 1);
  }

  for (const a of accessRows) {
    if (!studentIds.has(a.user_id)) continue;
    const list = accessByUser.get(a.user_id) ?? [];
    list.push(a.course_slug);
    accessByUser.set(a.user_id, list);
  }

  const lessonCountMap = new Map(lessonCounts.map((r) => [r.user_id, r.cnt]));
  const problemCountMap = new Map(problemCounts.map((r) => [r.user_id, r.cnt]));

  const todayStr = new Date().toISOString().slice(0, 10);
  let activeToday = 0;
  let totalXp = 0;
  let totalCompletions = 0;
  let approvedProUsers = 0;

  const perDayCounts = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    perDayCounts.set(d, 0);
  }

  const adminUsers: AdminUserRecord[] = users.map((u) => {
    if (u.last_active_date === todayStr) activeToday += 1;
    if (u.pro_approved === 1) approvedProUsers += 1;
    totalXp += u.xp;
    const lc = lessonCountMap.get(u.id) ?? 0;
    const pc = problemCountMap.get(u.id) ?? 0;
    totalCompletions += lc + pc;

    const joinDay = u.date_joined.slice(0, 10);
    if (perDayCounts.has(joinDay)) {
      perDayCounts.set(joinDay, (perDayCounts.get(joinDay) ?? 0) + 1);
    }

    const slugs = enrollByUser.get(u.id) ?? [];
    const courseNames = slugs.map((s) => COURSES.find((c) => c.slug === s)?.title ?? s);

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      plan: u.plan || 'free',
      proApproved: u.pro_approved === 1,
      approvedAt: u.approved_at ?? null,
      approvedCourses: accessByUser.get(u.id) ?? [],
      xp: u.xp,
      streak: u.streak,
      dateJoined: u.date_joined,
      lastSignedIn: u.last_signed_in ?? u.date_joined,
      coursesEnrolled: courseNames,
      lessonsCompletedCount: lc,
      problemsSolvedCount: pc,
    };
  });

  const mappedPayments = paymentRows.map(mapPaymentRow);
  const pendingPayments = mappedPayments.filter((p) => p.status === 'pending').length;

  const usersPerDay = [...perDayCounts.entries()].map(([date, count]) => ({
    date,
    label: date.slice(5),
    count,
  }));

  const categoryBreakdown = [...categoryCountMap.entries()]
    .map(([category, enrollmentsCount]) => ({ category, enrollments: enrollmentsCount }))
    .sort((a, b) => b.enrollments - a.enrollments);

  return {
    totalUsers: users.length,
    activeToday,
    totalCompletions,
    totalXp,
    approvedProUsers,
    pendingPayments,
    usersPerDay,
    categoryBreakdown,
    users: adminUsers,
    paymentRequests: mappedPayments,
  };
}
