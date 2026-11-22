import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronDown, Clock, Lock, PlayCircle } from 'lucide-react';
import { getCourseBySlug } from '../data/courses.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { UpgradeModal } from '../components/UpgradeModal.tsx';
import { canAccessCourseLesson } from '../utils/access.ts';
import type { Lesson } from '../types/academy.ts';

export function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const course = slug ? getCourseBySlug(slug) : undefined;
  const { user, enrollCourse } = useAuth();
  const navigate = useNavigate();
  const [enrolling, setEnrolling] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const groupedModules = useMemo(() => {
    if (!course) return [];
    const groups: { moduleTitle: string; lessons: Lesson[] }[] = [];
    for (const lesson of course.lessons) {
      const existing = groups.find((g) => g.moduleTitle === lesson.moduleTitle);
      if (existing) {
        existing.lessons.push(lesson);
      } else {
        groups.push({ moduleTitle: lesson.moduleTitle, lessons: [lesson] });
      }
    }
    return groups;
  }, [course]);

  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-stone-900">Course not found</h1>
        <p className="mt-2 text-sm text-stone-500">The requested track could not be located.</p>
        <Link to="/courses" className="btn-primary mt-6 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold">
          Back to Courses
        </Link>
      </div>
    );
  }

  const completedSet = new Set(
    user?.completedLessons.filter((l) => l.courseSlug === course.slug).map((l) => l.lessonId) ?? []
  );
  const isEnrolled = Boolean(user?.enrolledCourses.includes(course.slug));
  const firstLesson = course.lessons[0];
  const nextLesson = course.lessons.find((l) => !completedSet.has(l.id)) ?? firstLesson;
  const progressPct = Math.round((completedSet.size / course.lessons.length) * 100);
  const fullCourseUnlocked = canAccessCourseLesson(user, course.slug, 4);

  const toggleModule = (title: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [title]: !(prev[title] ?? true),
    }));
  };

  const handleStartCourse = async () => {
    if (user && !isEnrolled) {
      setEnrolling(true);
      await enrollCourse(course.slug);
      setEnrolling(false);
    }
    const targetLesson = canAccessCourseLesson(user, course.slug, nextLesson.number) ? nextLesson : firstLesson;
    navigate(`/courses/${course.slug}/lessons/${targetLesson.id}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> All Courses
      </Link>

      {/* Course Overview */}
      <div className="mt-6 grid grid-cols-1 gap-8 rounded-2xl surface-card p-6 sm:p-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 tabular-nums">
            <span className="font-semibold text-sky-700">{course.category}</span>
            <span className="text-stone-300">·</span>
            <span>{course.level}</span>
            <span className="text-stone-300">·</span>
            <span>{course.lessons.length} lessons</span>
            <span className="text-stone-300">·</span>
            <span>{course.duration}</span>
          </div>

          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl [text-wrap:balance]">
            {course.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-stone-600">{course.subtitle}</p>

          <div className="mt-6 border-t border-stone-100 pt-5">
            <h2 className="text-sm font-semibold text-stone-900">Track outcomes</h2>
            <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {course.outcomes.map((out) => (
                <li key={out} className="flex items-start gap-2 text-sm text-stone-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                  <span>{out}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#E6E3DC] bg-[#FAF9F6] p-5 lg:col-span-4">
          <div>
            <p className="text-xs font-medium text-stone-500">Instructor</p>
            <p className="mt-1 font-display text-base font-semibold text-stone-900">{course.instructor}</p>
            <p className="text-xs text-stone-500">{course.instructorRole}</p>

            <div className="mt-5 border-t border-[#E6E3DC] pt-4">
              <div className="flex items-center justify-between text-xs text-stone-700 tabular-nums">
                <span>Progress</span>
                <span>
                  {completedSet.size}/{course.lessons.length} ({progressPct}%)
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-stone-900 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-stone-500">
                {fullCourseUnlocked
                  ? 'Full track unlocked (Lessons 1–' + course.lessons.length + ').'
                  : 'Lessons 1–3 free · Lessons 4–' + course.lessons.length + ' require Pro approval.'}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              disabled={enrolling}
              onClick={handleStartCourse}
              className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer"
            >
              <PlayCircle className="h-4 w-4" />
              {completedSet.size > 0
                ? 'Resume Next Lesson'
                : isEnrolled
                ? 'Start Lesson 1'
                : 'Enroll & Start Learning'}
            </button>
            {!fullCourseUnlocked && (
              <button
                type="button"
                onClick={() => setUpgradeOpen(true)}
                className="btn-secondary inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5 text-sky-700" /> Unlock Full Course (Telecel)
              </button>
            )}
            {!user && (
              <p className="text-center text-xs text-stone-500">
                <Link to="/signin" className="font-semibold text-sky-700 hover:underline">
                  Sign in
                </Link>{' '}
                to save progress and earn XP.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Curriculum Accordion */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900">Curriculum</h2>
          <span className="text-xs text-stone-500 tabular-nums">
            {groupedModules.length} Modules · {course.lessons.length} Lessons
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {groupedModules.map((group, groupIdx) => {
            const isOpen = openModules[group.moduleTitle] ?? true;
            const completedInModule = group.lessons.filter((l) => completedSet.has(l.id)).length;
            return (
              <div key={group.moduleTitle} className="overflow-hidden rounded-2xl surface-card">
                <button
                  type="button"
                  onClick={() => toggleModule(group.moduleTitle)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-semibold text-sky-700 tabular-nums">
                      Module {groupIdx + 1} · {completedInModule}/{group.lessons.length} Completed
                    </p>
                    <h3 className="mt-0.5 font-display text-base font-semibold text-stone-900">
                      {group.moduleTitle}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-stone-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="divide-y divide-stone-100 border-t border-stone-100">
                    {group.lessons.map((lesson) => {
                      const done = completedSet.has(lesson.id);
                      const unlocked = canAccessCourseLesson(user, course.slug, lesson.number);
                      return (
                        <Link
                          key={lesson.id}
                          to={`/courses/${course.slug}/lessons/${lesson.id}`}
                          className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[#FAF9F6] transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {done ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            ) : !unlocked ? (
                              <Lock className="h-4 w-4 shrink-0 text-stone-400" />
                            ) : (
                              <BookOpen className="h-4 w-4 shrink-0 text-stone-400" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-stone-900">
                                {lesson.number}. {lesson.title}
                              </p>
                              <p className="truncate text-xs text-stone-500">{lesson.summary}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 text-xs text-stone-500 tabular-nums">
                            {!unlocked && <span className="font-semibold text-sky-700">Pro</span>}
                            <span className="hidden sm:inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> {lesson.duration}
                            </span>
                            <span className="font-mono font-medium text-stone-700">+{lesson.xpReward} XP</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        initialPlan="pro"
        initialCourseSlug={course.slug}
      />
    </div>
  );
}
