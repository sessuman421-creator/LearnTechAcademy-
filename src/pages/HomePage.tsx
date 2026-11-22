import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, Code2, MessageCircle, Phone, Terminal } from 'lucide-react';
import { COURSES } from '../data/courses.ts';
import { CourseCard } from '../components/CourseCard.tsx';
import { UpgradeModal } from '../components/UpgradeModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import type { CurrencyCode, SubscriptionPlan } from '../types/academy.ts';
import { CURRENCY_CONFIG, PAYMENT_INFO, formatPlanPrice, hasFullProAccess } from '../utils/access.ts';

export function HomePage() {
  const { user } = useAuth();
  const [heroImgErr, setHeroImgErr] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<'lessons' | 'sandbox' | 'mentor'>('lessons');
  const [currency, setCurrency] = useState<CurrencyCode>('GHS');
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; plan: SubscriptionPlan }>({
    open: false,
    plan: 'pro',
  });

  const popularCourses = COURSES.slice(0, 4);
  const totalLessons = COURSES.reduce((sum, c) => sum + c.lessons.length, 0);
  const isPro = hasFullProAccess(user);

  const metrics = [
    { value: '8', label: 'Engineering tracks from frontend to security' },
    { value: String(totalLessons), label: 'Full technical lessons with graded quizzes' },
    { value: '30', label: 'Browser-runnable Python, JS & CSS problems' },
    { value: '100%', label: 'Progress persisted in local SQLite' },
  ];

  const workflows = [
    {
      id: 'lessons' as const,
      index: '01',
      title: 'Structured Technical Curriculum',
      summary:
        'Each track spans 10 to 12 lessons combining architectural trade-offs, production snippets, and 3-question comprehension checks.',
    },
    {
      id: 'sandbox' as const,
      index: '02',
      title: 'In-Browser Monaco Coding Labs',
      summary:
        'Practice algorithms, DOM structure, and data transformations in VS Code’s Monaco Editor with instant test assertions and XP.',
    },
    {
      id: 'mentor' as const,
      index: '03',
      title: 'Progress-Aware AI Debugging',
      summary:
        'Open the dedicated AI Mentor workspace to inspect your active code, trace edge-case bugs, or plan your next study module.',
    },
  ];

  const testimonials = [
    {
      quote:
        'Before LearnTech Academy, I knew React basics but struggled with database indexing and auth boundaries. Finishing the Backend and Frontend tracks helped me cut our API P95 latency by 60% and move into a Senior Engineer role.',
      name: 'Kieran Patel',
      role: 'Senior Full-Stack Engineer',
      org: 'Northstar Payments',
      hasPhoto: false,
    },
    {
      quote:
        'The AI Engineering track skips hype and teaches hybrid search, RRF reranking, and evaluation harnesses. Within six weeks our team shipped a grounded support assistant without regression spikes.',
      name: 'Elena Vance',
      role: 'Staff Systems Architect',
      org: 'Vanguard Cloud Labs',
      hasPhoto: true,
    },
    {
      quote:
        'Solving the 30 Python, JavaScript, and CSS challenges alongside the main courses kept my daily streak unbroken. Technical interviews felt straightforward once those patterns clicked.',
      name: 'Amara Mensah',
      role: 'Software Engineer II',
      org: 'Helios Telemetry',
      hasPhoto: false,
    },
  ];

  const pricingTiers: {
    plan: SubscriptionPlan;
    name: string;
    audience: string;
    price: string;
    cadence: string;
    featured: boolean;
    limits: string[];
    ctaLabel: string;
  }[] = [
    {
      plan: 'free',
      name: 'Explorer',
      audience: 'For solo learners getting started',
      price: formatPlanPrice('free', currency),
      cadence: 'forever',
      featured: false,
      limits: [
        'Lessons 1–3 across all 8 engineering tracks',
        '15 interactive Monaco coding challenges (1–5 per language)',
        'SQLite-persisted XP, streaks, and quiz history',
        'Dedicated AI Mentor study recommendations',
      ],
      ctaLabel: user ? 'Open Dashboard' : 'Start Free Account',
    },
    {
      plan: 'pro',
      name: 'Pro Engineer',
      audience: 'For builders mastering full-stack & AI',
      price: formatPlanPrice('pro', currency),
      cadence: 'per month',
      featured: true,
      limits: [
        `All ${totalLessons} deep-dive lessons and quizzes unlocked`,
        'All 30 Python, JavaScript & HTML/CSS challenges + solutions',
        'Pro Engineering Resource Vault & downloadable playbooks',
        'Pro AI Architecture Review & Mock Interview modes',
      ],
      ctaLabel: isPro ? 'Pro Active · Open Vault' : 'Upgrade via Telecel',
    },
    {
      plan: 'team',
      name: 'Team Cohort',
      audience: 'For product and platform engineering teams',
      price: formatPlanPrice('team', currency),
      cadence: 'per 5 seats / mo',
      featured: false,
      limits: [
        'Full Pro curriculum & Resource Vault access',
        'Cohort registration analytics and CSV/Excel exports',
        'Application security and architecture checklists',
        'Priority WhatsApp & Email onboarding with admin',
      ],
      ctaLabel: isPro ? 'Team Active · Dashboard' : 'Subscribe via Telecel',
    },
  ];

  return (
    <div className="bg-[#F7F5F0]">
      {/* Editorial Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-14 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="text-xs font-semibold tracking-wide text-sky-700">
              Software Engineering · AI Systems · Cloud · Security
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-[-0.03em] text-stone-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08] [text-wrap:balance]">
              Learn production engineering by shipping real code.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
              Eight structured engineering tracks and {totalLessons} technical lessons paired with an in-browser Monaco coding lab and a dedicated AI mentor workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                to="/courses"
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold whitespace-nowrap"
              >
                Explore 8 Tracks <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/practice"
                className="btn-secondary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold whitespace-nowrap"
              >
                <Code2 className="h-4 w-4 text-sky-700" /> Open Coding Lab
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[280px] overflow-hidden rounded-2xl surface-card">
              {!heroImgErr ? (
                <img
                  src="/src/assets/images/hero_academy_workspace_1795343842326.jpg"
                  alt="LearnTech Academy engineering workstation"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgErr(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[280px] items-center justify-center bg-[#F3F1EC] p-8 text-center">
                  <div>
                    <Terminal className="mx-auto h-10 w-10 text-stone-700" />
                    <p className="mt-3 font-display text-base font-semibold text-stone-900">
                      LearnTech Engineering Studio
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clean White Divider-Separated Metrics Bar */}
        <div className="mt-12 grid grid-cols-1 divide-y divide-stone-100 rounded-2xl surface-card sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {metrics.map((m) => (
            <div key={m.label} className="px-6 py-5">
              <p className="font-display text-3xl font-bold text-stone-900 tabular-nums">{m.value}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-stone-500">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Tracks */}
      <section className="border-t border-[#E6E3DC] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                Featured Engineering Tracks
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-stone-500 sm:text-base">
                Each course runs 10 to 12 focused lessons with architecture notes, production snippets, and quizzes.
              </p>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-800 whitespace-nowrap shrink-0"
            >
              View all 8 tracks <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {popularCourses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Mechanism Showcase */}
      <section className="border-t border-[#E6E3DC] bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              How the learning loop works
            </h2>
            <p className="mt-2 text-sm text-stone-500 sm:text-base">
              Inspect a capability on the left to preview the live engineering environment on the right.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-[#E6E3DC] bg-white lg:col-span-5">
              {workflows.map((wf) => {
                const active = activeWorkflow === wf.id;
                return (
                  <button
                    key={wf.id}
                    type="button"
                    onClick={() => setActiveWorkflow(wf.id)}
                    className={`w-full py-5 px-5 text-left transition-colors cursor-pointer ${
                      active ? 'bg-[#F7F5F0]' : 'hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <div className="flex items-baseline gap-3">
                      <span className={`font-mono text-xs tabular-nums ${active ? 'text-sky-700 font-semibold' : 'text-stone-400'}`}>
                        {wf.index}.
                      </span>
                      <h3 className={`font-display text-base font-semibold ${active ? 'text-stone-900' : 'text-stone-700'}`}>
                        {wf.title}
                      </h3>
                    </div>
                    <p className="mt-2 pl-7 text-sm leading-relaxed text-stone-500">{wf.summary}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-[#E6E3DC] bg-[#FAF9F6] p-6 lg:col-span-7">
              {activeWorkflow === 'lessons' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E6E3DC] pb-3 text-xs text-stone-500">
                    <span className="font-semibold text-sky-700">AI Engineering · Lesson 6 of 12</span>
                    <span className="font-mono font-medium text-stone-700">+50 XP</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-stone-900">
                    Hybrid Search (BM25 + Vectors) & Reranking
                  </h3>
                  <p className="text-sm leading-relaxed text-stone-600">
                    Combine lexical BM25 scores with semantic embeddings via Reciprocal Rank Fusion so exact error codes and conceptual questions both rank cleanly.
                  </p>
                  <pre className="overflow-x-auto rounded-xl border border-[#E6E3DC] bg-white p-4 font-mono text-xs leading-relaxed text-stone-800">
                    <code>{`export function reciprocalRankFusion(rankings: string[][], k = 60) {
  const scores = new Map<string, number>();
  for (const list of rankings) {
    list.forEach((id, idx) => scores.set(id, (scores.get(id) ?? 0) + 1 / (k + idx + 1)));
  }
  return [...scores.entries()].sort((a, b) => b[1] - a[1]);
}`}</code>
                  </pre>
                </div>
              )}

              {activeWorkflow === 'sandbox' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E6E3DC] pb-3 text-xs text-stone-500">
                    <span className="font-mono font-medium text-stone-900">py-4.py · Two Sum Indices</span>
                    <span className="font-mono font-semibold text-emerald-700">2 / 2 Checks Passed</span>
                  </div>
                  <pre className="overflow-x-auto rounded-xl border border-[#E6E3DC] bg-white p-4 font-mono text-xs leading-relaxed text-stone-800">
                    <code>{`def two_sum(nums, target):
    seen = {}
    for idx, val in enumerate(nums):
        need = target - val
        if need in seen:
            return [seen[need], idx]
        seen[val] = idx`}</code>
                  </pre>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-emerald-900">
                      <span className="flex items-center gap-2 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> [2,7,11,15], target 9
                      </span>
                      <span className="font-mono">[0,1]</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-emerald-900">
                      <span className="flex items-center gap-2 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> [3,2,4], target 6
                      </span>
                      <span className="font-mono">[1,2]</span>
                    </div>
                  </div>
                </div>
              )}

              {activeWorkflow === 'mentor' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E6E3DC] pb-3 text-xs text-stone-500">
                    <span className="font-semibold text-sky-700">Engineering Mentor</span>
                    <span className="font-mono">Workspace: /ai · py-6.py</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="rounded-xl bg-stone-900 px-4 py-3 text-white">
                      Why does my bracket checker pass &quot;()&quot; but fail on &quot;((&quot;?
                    </div>
                    <div className="rounded-xl border border-[#E6E3DC] bg-white px-4 py-3 text-stone-700 leading-relaxed">
                      Your loop finishes without checking whether unclosed openers remain on the stack. Return <code className="font-mono text-sky-700">len(stack) == 0</code> at the end instead of <code className="font-mono text-sky-700">True</code>.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Attributable Testimonials */}
      <section className="border-t border-[#E6E3DC] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            Outcomes from practicing engineers
          </h2>

          <div className="mt-8 grid grid-cols-1 divide-y divide-stone-200 overflow-hidden rounded-2xl surface-card lg:grid-cols-3 lg:divide-y-0 lg:divide-x">
            {testimonials.map((t) => (
              <blockquote key={t.name} className="flex flex-col justify-between p-6">
                <p className="text-sm leading-relaxed text-stone-700">“{t.quote}”</p>
                <footer className="mt-6 flex items-center gap-3">
                  {t.hasPhoto && !avatarErr ? (
                    <img
                      src="/src/assets/images/instructor_avatar_founder_1795343842200.jpg"
                      alt={t.name}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarErr(true)}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E6E3DC] bg-[#F7F5F0] text-xs font-semibold text-stone-800">
                      {t.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{t.name}</p>
                    <p className="text-xs text-stone-500">
                      {t.role} · {t.org}
                    </p>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Matrix (Ghana Cedis & Naira with Telecel Admin Payment) */}
      <section id="pricing" className="border-t border-[#E6E3DC] bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                Simple, transparent access
              </h2>
              <p className="mt-2 text-sm text-stone-500 sm:text-base">
                Pay directly to the admin via Telecel Network ({PAYMENT_INFO.telecelNumber}) in Ghana Cedis or Naira, then confirm via WhatsApp or the in-app verification form.
              </p>
            </div>

            <div className="inline-flex items-center gap-1 rounded-xl border border-[#E6E3DC] bg-[#FAF9F6] p-1 self-start sm:self-auto">
              {(['GHS', 'NGN'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    currency === code ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {CURRENCY_CONFIG[code].label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-[#E6E3DC] bg-white lg:grid-cols-3 lg:divide-y-0 lg:divide-x">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col p-7 ${tier.featured ? 'bg-[#FAF9F6]' : 'bg-white'}`}
              >
                <div>
                  <h3 className="font-display text-lg font-semibold text-stone-900">{tier.name}</h3>
                  <p className="mt-1 text-xs text-stone-500">{tier.audience}</p>
                </div>

                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold text-stone-900 tabular-nums">{tier.price}</span>
                  <span className="text-xs text-stone-500">{tier.cadence}</span>
                </div>

                <ul className="mt-6 flex-1 space-y-3 border-t border-stone-200 pt-5 text-sm text-stone-700">
                  {tier.limits.map((lim) => (
                    <li key={lim} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>

                {tier.plan === 'free' ? (
                  <Link
                    to={user ? '/dashboard' : '/signup'}
                    className="btn-secondary mt-7 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
                  >
                    {tier.ctaLabel}
                  </Link>
                ) : isPro ? (
                  <Link
                    to="/dashboard"
                    className={`mt-7 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap ${
                      tier.featured ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {tier.ctaLabel}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setUpgradeModal({ open: true, plan: tier.plan })}
                    className={`mt-7 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap cursor-pointer ${
                      tier.featured ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {tier.ctaLabel}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Admin Receiver & Payment Confirmation Bar */}
          <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-[#E6E3DC] bg-[#FAF9F6] p-5 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-stone-900">
                Direct Payment Receiver: {PAYMENT_INFO.receiverName}
              </p>
              <p className="text-xs text-stone-600">
                Send subscription payment to{' '}
                <strong className="font-mono text-stone-900">
                  {PAYMENT_INFO.network}: {PAYMENT_INFO.telecelNumber}
                </strong>{' '}
                and confirm with your account email so the admin can approve your Pro access in the database.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6E3DC] bg-white px-3 py-1.5 font-mono text-xs font-semibold text-stone-900">
                <Phone className="h-3.5 w-3.5 text-sky-700" /> {PAYMENT_INFO.telecelNumber}
              </span>
              <a
                href={PAYMENT_INFO.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-emerald-800 whitespace-nowrap"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp: {PAYMENT_INFO.whatsappNumber}
              </a>
            </div>
          </div>
        </div>
      </section>

      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal((prev) => ({ ...prev, open: false }))}
        initialPlan={upgradeModal.plan}
        initialCurrency={currency}
      />
    </div>
  );
}
