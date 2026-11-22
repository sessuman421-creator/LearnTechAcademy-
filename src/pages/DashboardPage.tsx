import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Download,
  FileText,
  Flame,
  Lock,
  MessageCircle,
  MessageSquareCode,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import { COURSES, getNextRecommendedLesson } from '../data/courses.ts';
import { PRACTICE_PROBLEMS } from '../data/problems.ts';
import { apiFetch, useAuth } from '../context/AuthContext.tsx';
import { UpgradeModal } from '../components/UpgradeModal.tsx';
import { MarkdownMessage } from '../components/MarkdownMessage.tsx';
import type { ProResourceItem } from '../types/academy.ts';
import { CURRENCY_CONFIG, PAYMENT_INFO, hasFullProAccess } from '../utils/access.ts';

export function DashboardPage() {
  const { user, loading } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [resources, setResources] = useState<ProResourceItem[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [activeResourceId, setActiveResourceId] = useState<string | null>(null);

  const isPro = hasFullProAccess(user);
  const hasAnyProUnlock = Boolean(user && (isPro || user.approvedCourses.length > 0));

  useEffect(() => {
    if (!hasAnyProUnlock) {
      setResources([]);
      return;
    }
    let active = true;
    setLoadingResources(true);
    apiFetch('/api/pro/resources')
      .then(async (res) => {
        if (!res.ok) return { resources: [] as ProResourceItem[] };
        return (await res.json()) as { resources: ProResourceItem[] };
      })
      .then((data) => {
        if (active) {
          setResources(data.resources || []);
          if (data.resources?.length && !activeResourceId) {
            setActiveResourceId(data.resources[0].id);
          }
        }
      })
      .catch(() => {
        if (active) setResources([]);
      })
      .finally(() => {
        if (active) setLoadingResources(false);
      });
    return () => {
      active = false;
    };
  }, [hasAnyProUnlock, activeResourceId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="h-40 animate-pulse rounded-2xl bg-stone-200/70" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="rounded-2xl surface-card p-8 sm:p-10">
          <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
            Track your engineering progress
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-500">
            Sign in or create an account to persist completed lessons, coding lab XP, enrolled tracks, and your daily streak.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/signin" className="btn-primary rounded-xl px-6 py-2.5 text-sm font-semibold">
              Sign In
            </Link>
            <Link to="/signup" className="btn-secondary rounded-xl px-6 py-2.5 text-sm font-semibold">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const completedLessonIds = new Set(user.completedLessons.map((l) => l.lessonId));
  const recommended = getNextRecommendedLesson(user.enrolledCourses, completedLessonIds);
  const enrolledCourseObjects = COURSES.filter((c) => user.enrolledCourses.includes(c.slug));
  const pendingRequest = user.paymentRequests.find((r) => r.status === 'pending');

  const kpis = [
    { icon: BookOpen, label: 'Courses Enrolled', value: String(user.enrolledCourses.length) },
    { icon: CheckCircle2, label: 'Lessons Completed', value: String(user.completedLessons.length) },
    { icon: Trophy, label: 'Total XP Earned', value: user.xp.toLocaleString() },
    { icon: Flame, label: 'Active Streak', value: `${user.streak}d` },
  ];

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTranscript = () => {
    const lines = [
      '# LearnTech Academy — Verified Student Transcript',
      `Student: ${user.name} (${user.email})`,
      `Plan Status: ${isPro ? `Approved ${user.plan.toUpperCase()}` : 'Course Access Granted'}`,
      `Approved By: ${user.approvedBy || 'Academy Admin'}`,
      `Total XP: ${user.xp}`,
      `Lessons Completed: ${user.completedLessons.length}`,
      `Practice Problems Solved: ${user.completedProblems.length}`,
      '',
      '## Completed Lessons',
      ...user.completedLessons.map(
        (l) => `- [${l.courseSlug}] ${l.lessonId} (Quiz: ${l.quizScore}/3) — ${l.completedAt.slice(0, 10)}`
      ),
    ];
    downloadTextFile(`learntech-transcript-${user.name.toLowerCase().replace(/\s+/g, '-')}.md`, lines.join('\n'));
  };

  const selectedResource = resources.find((r) => r.id === activeResourceId) ?? resources[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-sky-700">Student Overview</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-stone-900">
            Welcome back, {user.name}
          </h1>
          <p className="mt-1 text-xs text-stone-500 tabular-nums">
            Joined {new Date(user.dateJoined).toLocaleDateString()} · <span className="font-mono">{user.email}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/ai" className="btn-secondary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold">
            <MessageSquareCode className="h-3.5 w-3.5 text-sky-700" />
            AI Mentor
          </Link>
          <Link to="/courses" className="btn-secondary rounded-xl px-4 py-2 text-xs font-semibold">
            Browse Courses
          </Link>
          <Link to="/practice" className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold">
            Open Coding Lab
          </Link>
        </div>
      </div>

      {/* Divider-Separated 4-Column KPI Row */}
      <div className="mt-8 grid grid-cols-2 divide-y divide-stone-100 overflow-hidden rounded-2xl surface-card lg:grid-cols-4 lg:divide-y-0 lg:divide-x">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="p-5">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-medium">{k.label}</span>
                <Icon className="h-4 w-4 text-sky-700" />
              </div>
              <p className="mt-3 font-display text-3xl font-bold text-stone-900 tabular-nums">{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* Membership & Admin Approval Status Card */}
      <section className="mt-8 rounded-2xl surface-card p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-700">
              {isPro ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <Lock className="h-4 w-4 text-sky-700" />}
              <span>
                {isPro
                  ? `${user.plan === 'team' ? 'Team Cohort' : 'Pro Engineer'} · Admin Approved`
                  : user.approvedCourses.length > 0
                  ? `${user.approvedCourses.length} Pro Course${user.approvedCourses.length > 1 ? 's' : ''} Unlocked`
                  : pendingRequest
                  ? 'Payment Pending Admin Verification'
                  : 'Explorer Free Plan'}
              </span>
            </div>
            <h2 className="mt-1 font-display text-lg font-bold text-stone-900">
              {isPro
                ? 'Full Pro Curriculum, Coding Lab & Resource Vault Unlocked'
                : pendingRequest
                ? `Awaiting confirmation for ${CURRENCY_CONFIG[pendingRequest.currency].symbol}${pendingRequest.amount} (${pendingRequest.paymentReference})`
                : 'Upgrade for full 88-lesson access, 30 practice challenges & Pro Resource Vault'}
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              {isPro
                ? `Confirmed by ${user.approvedBy || 'Academy Admin'}${
                    user.approvedAt ? ` on ${new Date(user.approvedAt).toLocaleDateString()}` : ''
                  }. All Pro AI modes and downloadable playbooks are active.`
                : `Pay GH₵29 or ₦29 directly via ${PAYMENT_INFO.network} (${PAYMENT_INFO.telecelNumber}) and confirm via WhatsApp (${PAYMENT_INFO.whatsappNumber}) or in-app reference submission.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {hasAnyProUnlock && (
              <button
                type="button"
                onClick={handleDownloadTranscript}
                className="btn-secondary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-sky-700" /> Download Transcript
              </button>
            )}
            {!isPro && (
              <button
                type="button"
                onClick={() => setUpgradeOpen(true)}
                className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                {pendingRequest ? 'Submit Another Reference' : 'Pay via Telecel & Upgrade'}
              </button>
            )}
          </div>
        </div>

        {user.approvedCourses.length > 0 && !isPro && (
          <div className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-600">
            <span className="font-semibold text-stone-900">Admin-Unlocked Pro Courses: </span>
            {user.approvedCourses
              .map((slug) => COURSES.find((c) => c.slug === slug)?.title ?? slug)
              .join(', ')}
          </div>
        )}

        {pendingRequest && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3 text-xs">
            <span className="text-stone-500">Need faster confirmation?</span>
            <a
              href={PAYMENT_INFO.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Admin ({PAYMENT_INFO.whatsappNumber})
            </a>
          </div>
        )}

        {user.paymentRequests.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-xl border border-[#E6E3DC]">
            <div className="border-b border-[#E6E3DC] bg-[#FAF9F6] px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              Payment Confirmation History
            </div>
            <div className="divide-y divide-stone-100">
              {user.paymentRequests.map((pr) => (
                <div key={pr.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs">
                  <div>
                    <span className="font-semibold text-stone-900 capitalize">{pr.planRequested}</span>
                    <span className="mx-1.5 text-stone-300">·</span>
                    <span className="font-mono font-medium text-stone-800">
                      {CURRENCY_CONFIG[pr.currency].symbol}
                      {pr.amount}
                    </span>
                    <span className="mx-1.5 text-stone-300">·</span>
                    <span className="font-mono text-stone-600">Ref: {pr.paymentReference}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold capitalize ${
                        pr.status === 'approved'
                          ? 'text-emerald-700'
                          : pr.status === 'rejected'
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {pr.status}
                    </span>
                    <span className="font-mono text-[11px] text-stone-400">{pr.createdAt.slice(0, 10)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Pro Engineering Resource Vault (Only rendered when Admin-approved) */}
      {hasAnyProUnlock && (
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-emerald-700">Unlocked Pro Resources</p>
              <h2 className="font-display text-xl font-bold text-stone-900">Pro Engineering Resource Vault</h2>
            </div>
            <Link to="/ai" className="text-xs font-semibold text-sky-700 hover:underline">
              Open Pro AI Architecture & Interview Modes →
            </Link>
          </div>

          {loadingResources ? (
            <div className="mt-4 h-40 animate-pulse rounded-2xl bg-stone-200/70" />
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="divide-y divide-stone-100 overflow-hidden rounded-2xl surface-card lg:col-span-5">
                {resources.map((res) => {
                  const active = selectedResource?.id === res.id;
                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => setActiveResourceId(res.id)}
                      className={`w-full px-5 py-4 text-left transition-colors cursor-pointer ${
                        active ? 'bg-[#F7F5F0]' : 'hover:bg-[#FAF9F6]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-sky-700 font-semibold">
                        <span>{res.category}</span>
                        <span className="font-mono text-stone-500">{res.format}</span>
                      </div>
                      <h3 className="mt-1 font-display text-sm font-semibold text-stone-900">{res.title}</h3>
                      <p className="mt-1 text-xs text-stone-500 line-clamp-2">{res.summary}</p>
                    </button>
                  );
                })}
              </div>

              {selectedResource && (
                <div className="rounded-2xl surface-card p-6 lg:col-span-7">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-sky-700" />
                      <h3 className="font-display text-base font-bold text-stone-900">{selectedResource.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadTextFile(`${selectedResource.id}.md`, selectedResource.content)}
                      className="btn-secondary inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" /> Download .md
                    </button>
                  </div>
                  <div className="mt-4">
                    <MarkdownMessage text={selectedResource.content} />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Recommended Next Step */}
      {recommended && (
        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl surface-card p-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold text-sky-700">Suggested Next Lesson</p>
            <h2 className="mt-1 font-display text-xl font-bold text-stone-900">
              {recommended.lesson.number}. {recommended.lesson.title}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {recommended.course.title} · {recommended.lesson.duration} · +{recommended.lesson.xpReward} XP
            </p>
          </div>
          <Link
            to={`/courses/${recommended.course.slug}/lessons/${recommended.lesson.id}`}
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold whitespace-nowrap shrink-0"
          >
            Continue Lesson <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Enrolled Courses Progress */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-stone-900">Enrolled Courses</h2>
        {enrolledCourseObjects.length === 0 ? (
          <div className="mt-4 rounded-2xl surface-card p-8 text-center">
            <p className="text-sm text-stone-600">You haven’t enrolled in a track yet.</p>
            <Link to="/courses" className="btn-primary mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold">
              Explore 8 Tracks
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {enrolledCourseObjects.map((course) => {
              const doneCount = user.completedLessons.filter((l) => l.courseSlug === course.slug).length;
              const pct = Math.round((doneCount / course.lessons.length) * 100);
              const nextInTrack = course.lessons.find((l) => !completedLessonIds.has(l.id)) ?? course.lessons[0];
              return (
                <div key={course.slug} className="rounded-2xl surface-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-sky-700">{course.category}</p>
                      <h3 className="mt-1 font-display text-base font-semibold text-stone-900">{course.title}</h3>
                    </div>
                    <span className="font-mono text-xs font-semibold text-stone-700 tabular-nums">{pct}%</span>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full rounded-full bg-stone-900" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-stone-500 tabular-nums">
                    <span>
                      {doneCount} / {course.lessons.length} lessons completed
                    </span>
                    <Link
                      to={`/courses/${course.slug}/lessons/${nextInTrack.id}`}
                      className="font-semibold text-sky-700 hover:underline"
                    >
                      Resume →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Coding Practice Mastery */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-stone-900">Coding Practice Progress</h2>
          <span className="text-xs text-stone-500 tabular-nums">
            {user.completedProblems.length} / {PRACTICE_PROBLEMS.length} Problems Solved
          </span>
        </div>

        <div className="mt-4 rounded-2xl surface-card overflow-hidden">
          {user.completedProblems.length === 0 ? (
            <div className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <Code2 className="h-5 w-5 text-sky-700" />
                <p className="text-sm text-stone-600">
                  Solve Python, JavaScript, or HTML/CSS problems in the Monaco Lab to earn bonus XP.
                </p>
              </div>
              <Link
                to="/practice"
                className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0"
              >
                Solve First Problem
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {user.completedProblems.map((cp) => {
                const prob = PRACTICE_PROBLEMS.find((p) => p.id === cp.problemId);
                return (
                  <div
                    key={cp.problemId}
                    className="flex items-center justify-between px-5 py-3 text-xs"
                  >
                    <span className="truncate font-medium text-stone-900">
                      {prob ? `${prob.number}. ${prob.title}` : cp.problemId}
                    </span>
                    <span className="shrink-0 font-mono font-semibold text-emerald-700 tabular-nums">
                      +{cp.xpAwarded} XP
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        initialPlan="pro"
      />
    </div>
  );
}
