import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Code2 } from 'lucide-react';
import type { Course } from '../types/academy.ts';

export function CourseCard({ course }: { course: Course }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl surface-card transition-all duration-150 hover:border-stone-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-[#E6E3DC] bg-[#F3F1EC]">
        {!imgFailed ? (
          <img
            src={course.coverImage}
            alt={course.title}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[#F3F1EC] p-6 text-center">
            <Code2 className="h-8 w-8 text-stone-500" />
            <span className="mt-2 text-xs font-medium text-stone-500">{course.category}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-stone-500 tabular-nums">
          <span className="font-semibold text-sky-700">{course.category}</span>
          <span aria-hidden="true" className="text-stone-300">·</span>
          <span>{course.lessons.length} lessons</span>
          <span aria-hidden="true" className="text-stone-300">·</span>
          <span>{course.level}</span>
        </div>

        <h3 className="mt-2 font-display text-base font-semibold leading-snug text-stone-900">
          {course.title}
        </h3>

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-stone-500">
          {course.subtitle}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-3.5 text-xs text-stone-500 tabular-nums">
          <span>
            {course.instructor} · {course.duration}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-stone-900 group-hover:text-sky-700 transition-colors">
            Syllabus <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
