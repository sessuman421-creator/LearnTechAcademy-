import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Lock,
  Pause,
  Play,
  Volume2,
} from 'lucide-react';
import { getLessonById } from '../data/courses.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { UpgradeModal } from '../components/UpgradeModal.tsx';
import { PAYMENT_INFO, canAccessCourseLesson } from '../utils/access.ts';

export function LessonPage() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const resolved = useMemo(
    () => (slug && lessonId ? getLessonById(slug, lessonId) : undefined),
    [slug, lessonId]
  );
  const { user, completeLesson, setEditorContext } = useAuth();
  const navigate = useNavigate();

  const [playing, setPlaying] = useState(false);
  const [videoSeconds, setVideoSeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizChecked, setQuizChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    setSelectedAnswers({});
    setQuizChecked(false);
    setPlaying(false);
    setVideoSeconds(0);
    setStatusMessage(null);
  }, [slug, lessonId]);

  const lessonCode = resolved?.lesson.codeExample.code;
  const lessonLanguage = resolved?.lesson.codeExample.language;
  const resolvedCourseSlug = resolved?.course.slug;
  const resolvedCourseTitle = resolved?.course.title;
  const resolvedLessonId = resolved?.lesson.id;
  const resolvedLessonTitle = resolved?.lesson.title;
  const resolvedLessonNumber = resolved?.lesson.number ?? 1;
  const isLessonUnlocked = resolvedCourseSlug
    ? canAccessCourseLesson(user, resolvedCourseSlug, resolvedLessonNumber)
    : false;

  useEffect(() => {
    if (resolvedCourseSlug && resolvedLessonId && isLessonUnlocked) {
      setEditorContext({
        code: lessonCode,
        language: lessonLanguage,
        courseSlug: resolvedCourseSlug,
        courseTitle: resolvedCourseTitle,
        lessonId: resolvedLessonId,
        lessonTitle: resolvedLessonTitle,
        pathname: `/courses/${resolvedCourseSlug}/lessons/${resolvedLessonId}`,
      });
    }
  }, [
    isLessonUnlocked,
    lessonCode,
    lessonLanguage,
    resolvedCourseSlug,
    resolvedCourseTitle,
    resolvedLessonId,
    resolvedLessonTitle,
    setEditorContext,
  ]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setVideoSeconds((prev) => (prev >= 180 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [playing]);

  if (!resolved) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-stone-900">Lesson not found</h1>
        <Link to="/courses" className="btn-primary mt-5 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold">
          Return to Courses
        </Link>
      </div>
    );
  }

  const { course, lesson } = resolved;
  const completedSet = new Set(
    user?.completedLessons.filter((l) => l.courseSlug === course.slug).map((l) => l.lessonId) ?? []
  );
  const isAlreadyComplete = completedSet.has(lesson.id);

  const currentIndex = course.lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? course.lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null;

  const quizScore = lesson.quiz.reduce(
    (score, q) => (selectedAnswers[q.id] === q.correctIndex ? score + 1 : score),
    0
  );

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(lesson.codeExample.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!user) {
      setStatusMessage('Sign in to save lesson progress and collect +50 XP.');
      return;
    }
    setSaving(true);
    setQuizChecked(true);
    const result = await completeLesson(course.slug, lesson.id, quizScore);
    setSaving(false);
    if (!result.ok) {
      setStatusMessage(result.error || 'Upgrade to Pro to record progress on this lesson.');
      return;
    }
    setStatusMessage(
      isAlreadyComplete
        ? 'Lesson progress updated.'
        : `Completed! +${lesson.xpReward} XP saved to your profile.`
    );
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          to={`/courses/${course.slug}`}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {course.title}
        </Link>
        <span className="text-xs font-medium text-stone-500 tabular-nums">
          Lesson {lesson.number} of {course.lessons.length} · {lesson.duration}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Sidebar Lesson List */}
        <aside className="order-2 lg:order-1 lg:col-span-4 xl:col-span-3">
          <div className="sticky top-20 overflow-hidden rounded-2xl surface-card">
            <div className="border-b border-stone-100 px-4 py-3.5">
              <h2 className="font-display text-sm font-semibold text-stone-900">Lessons</h2>
              <p className="mt-0.5 text-xs text-stone-500 tabular-nums">
                {completedSet.size} of {course.lessons.length} completed
              </p>
            </div>
            <nav className="max-h-[65vh] divide-y divide-stone-100 overflow-y-auto" aria-label="Course lessons">
              {course.lessons.map((item) => {
                const active = item.id === lesson.id;
                const done = completedSet.has(item.id);
                const unlocked = canAccessCourseLesson(user, course.slug, item.number);
                return (
                  <Link
                    key={item.id}
                    to={`/courses/${course.slug}/lessons/${item.id}`}
                    className={`flex items-center justify-between gap-2 px-4 py-2.5 text-xs transition-colors ${
                      active
                        ? 'bg-stone-900 text-white font-semibold'
                        : 'text-stone-700 hover:bg-[#FAF9F6] hover:text-stone-900'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      {done ? (
                        <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-white' : 'text-emerald-600'}`} />
                      ) : !unlocked ? (
                        <Lock className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-stone-300' : 'text-stone-400'}`} />
                      ) : (
                        <span className="w-4 text-center font-mono tabular-nums opacity-70">{item.number}</span>
                      )}
                      <span className="truncate">{item.title}</span>
                    </span>
                    {!unlocked && (
                      <span className={`text-[10px] font-semibold ${active ? 'text-stone-300' : 'text-sky-700'}`}>
                        Pro
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Lesson Content */}
        <div className="order-1 space-y-8 lg:order-2 lg:col-span-8 xl:col-span-9">
          <div>
            <p className="text-xs font-semibold text-sky-700">
              {lesson.moduleTitle} · +{lesson.xpReward} XP
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl [text-wrap:balance]">
              {lesson.number}. {lesson.title}
            </h1>
            <p className="mt-2 text-base text-stone-600">{lesson.summary}</p>
          </div>

          {!isLessonUnlocked ? (
            <div className="rounded-2xl surface-card p-8 text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E6E3DC] bg-[#FAF9F6] text-sky-700">
                <Lock className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-xl font-bold text-stone-900">
                Pro Lesson Locked (Lessons 4–{course.lessons.length})
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-stone-600">
                Lessons 1–3 in every track are free to explore. To unlock full notes, code examples, and quizzes for this course, pay <strong className="text-stone-900">GH₵29 or ₦29</strong> via {PAYMENT_INFO.network} (<strong className="font-mono">{PAYMENT_INFO.telecelNumber}</strong>) and confirm via WhatsApp (<strong className="font-mono">{PAYMENT_INFO.whatsappNumber}</strong>) or the payment form for admin approval.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setUpgradeOpen(true)}
                  className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer"
                >
                  Pay via Telecel & Request Approval
                </button>
                <Link
                  to={`/courses/${course.slug}/lessons/${course.lessons[0].id}`}
                  className="btn-secondary rounded-xl px-5 py-2.5 text-sm font-semibold"
                >
                  Go to Free Lesson 1
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Interactive Video Lecture Player */}
              <div className="overflow-hidden rounded-2xl surface-card">
                <div className="relative flex aspect-video flex-col justify-between bg-[#FAF9F6] p-6">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>Lecture Briefing · {course.instructor}</span>
                    <span className="font-mono tabular-nums">{lesson.duration}</span>
                  </div>

                  <div className="my-auto flex flex-col items-center text-center">
                    <button
                      type="button"
                      onClick={() => setPlaying((p) => !p)}
                      aria-label={playing ? 'Pause lecture preview' : 'Play lecture preview'}
                      className="btn-primary inline-flex h-14 w-14 items-center justify-center rounded-full shadow-md cursor-pointer"
                    >
                      {playing ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
                    </button>
                    <p className="mt-4 font-display text-base font-semibold text-stone-900">
                      {lesson.title}
                    </p>
                    <p className="mt-1 max-w-md text-xs text-stone-500">
                      {playing
                        ? 'Playing synchronized lecture walkthrough — review notes and code below.'
                        : 'Press play to preview lesson pacing or read full notes below.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                      <div
                        className="h-full rounded-full bg-stone-900 transition-all duration-300"
                        style={{ width: `${(videoSeconds / 180) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-stone-500 font-mono tabular-nums">
                      <span>{formatTimer(videoSeconds)} / 03:00</span>
                      <span className="inline-flex items-center gap-1">
                        <Volume2 className="h-3.5 w-3.5" /> Transcript Ready
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engineering Notes */}
              <div className="space-y-6 rounded-2xl surface-card p-6">
                {lesson.notes.map((section) => (
                  <section key={section.heading}>
                    <h2 className="font-display text-lg font-semibold text-stone-900">{section.heading}</h2>
                    <p className="mt-2 max-w-[72ch] text-sm leading-relaxed text-stone-600 sm:text-base">
                      {section.body}
                    </p>
                    {section.keyPoints && section.keyPoints.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {section.keyPoints.map((kp) => (
                          <li key={kp} className="flex items-start gap-2.5 text-sm text-stone-700">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                            <span>{kp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>

              {/* Code Example Block */}
              <div className="overflow-hidden rounded-2xl surface-card">
                <div className="flex items-center justify-between border-b border-stone-100 bg-[#FAF9F6] px-4 py-2.5 text-xs text-stone-500">
                  <span className="font-mono font-medium text-stone-800">
                    {lesson.codeExample.filename} · {lesson.codeExample.language}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="btn-secondary inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="overflow-x-auto bg-white p-4 font-mono text-xs leading-relaxed text-stone-900 sm:text-sm">
                  <code>{lesson.codeExample.code}</code>
                </pre>
              </div>

              {/* Interactive Lesson Quiz */}
              <section className="rounded-2xl surface-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold text-stone-900">Knowledge Check</h2>
                  {quizChecked && (
                    <span className="text-xs font-semibold text-sky-700 tabular-nums">
                      Score: {quizScore} / {lesson.quiz.length}
                    </span>
                  )}
                </div>

                <div className="mt-5 space-y-6">
                  {lesson.quiz.map((q, qIdx) => {
                    const chosen = selectedAnswers[q.id];
                    return (
                      <div key={q.id} className="space-y-2.5">
                        <p className="text-sm font-medium text-stone-900">
                          {qIdx + 1}. {q.question}
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = chosen === optIdx;
                            const isCorrect = optIdx === q.correctIndex;
                            let styleClass =
                              'border-[#E6E3DC] bg-[#FAF9F6] text-stone-700 hover:border-stone-300 hover:text-stone-900';
                            if (quizChecked) {
                              if (isCorrect) {
                                styleClass = 'border-emerald-300 bg-emerald-50 text-emerald-900';
                              } else if (isSelected && !isCorrect) {
                                styleClass = 'border-rose-300 bg-rose-50 text-rose-900';
                              }
                            } else if (isSelected) {
                              styleClass = 'border-stone-900 bg-stone-900 text-white';
                            }

                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                                  setQuizChecked(false);
                                }}
                                className={`rounded-xl border px-3.5 py-2.5 text-left text-xs leading-relaxed transition-colors cursor-pointer ${styleClass}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {quizChecked && (
                          <p className="text-xs text-stone-500">
                            Explanation: {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuizChecked(true)}
                      className="btn-secondary rounded-xl px-4 py-2 text-sm font-medium cursor-pointer"
                    >
                      Check Quiz
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleMarkComplete}
                      className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold disabled:opacity-60 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {saving
                        ? 'Saving...'
                        : isAlreadyComplete
                        ? 'Completed (Update Score)'
                        : `Mark as Complete (+${lesson.xpReward} XP)`}
                    </button>
                  </div>
                  {statusMessage && (
                    <p className="text-xs font-medium text-sky-700" role="status">
                      {statusMessage}
                    </p>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Next / Previous Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E6E3DC] pt-6">
            {prevLesson ? (
              <button
                type="button"
                onClick={() => navigate(`/courses/${course.slug}/lessons/${prevLesson.id}`)}
                className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" /> Previous: {prevLesson.title}
              </button>
            ) : (
              <span />
            )}

            {nextLesson && (
              <button
                type="button"
                onClick={() => navigate(`/courses/${course.slug}/lessons/${nextLesson.id}`)}
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer"
              >
                Next: {nextLesson.title} <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        initialPlan="pro"
        initialCourseSlug={course.slug}
      />
    </div>
  );
}
