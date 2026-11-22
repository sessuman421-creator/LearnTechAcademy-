import { COURSES_TECH } from './coursesTech.ts';
import { COURSES_DESIGN_CLOUD } from './coursesDesignCloud.ts';
import type { Course, CourseCategory, Lesson } from '../types/academy.ts';

export const COURSE_CATEGORIES: ('All' | CourseCategory)[] = [
  'All',
  'App Development',
  'AI Engineering',
  'Backend Engineering',
  'Cyber Security',
  'Data Science',
  'UI/UX Design',
  'Cloud Engineering',
  'Frontend Development',
];

export const COURSES: Course[] = [...COURSES_TECH, ...COURSES_DESIGN_CLOUD];

export function getCourseBySlug(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

export function getLessonById(courseSlug: string, lessonId: string): { course: Course; lesson: Lesson } | undefined {
  const course = getCourseBySlug(courseSlug);
  if (!course) return undefined;
  const lesson = course.lessons.find((l) => l.id === lessonId);
  if (!lesson) return undefined;
  return { course, lesson };
}

export function getNextRecommendedLesson(
  enrolledSlugs: string[],
  completedLessonIds: Set<string>
): { course: Course; lesson: Lesson } | null {
  const orderedCourses = [
    ...COURSES.filter((c) => enrolledSlugs.includes(c.slug)),
    ...COURSES.filter((c) => !enrolledSlugs.includes(c.slug)),
  ];
  for (const course of orderedCourses) {
    const next = course.lessons.find((l) => !completedLessonIds.has(l.id));
    if (next) return { course, lesson: next };
  }
  return null;
}
