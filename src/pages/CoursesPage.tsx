import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { COURSE_CATEGORIES, COURSES } from '../data/courses.ts';
import { CourseCard } from '../components/CourseCard.tsx';
import type { CourseCategory } from '../types/academy.ts';

export function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | CourseCategory>('All');
  const [selectedLevel, setSelectedLevel] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return COURSES.filter((course) => {
      const catMatch = selectedCategory === 'All' || course.category === selectedCategory;
      const lvlMatch = selectedLevel === 'All' || course.level === selectedLevel;
      const queryMatch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.subtitle.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q) ||
        course.lessons.some((l) => l.title.toLowerCase().includes(q));
      return catMatch && lvlMatch && queryMatch;
    });
  }, [searchQuery, selectedCategory, selectedLevel]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLevel('All');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Engineering Course Catalog
        </h1>
        <p className="mt-2.5 text-base text-stone-500">
          8 tracks covering App Development, AI, Backend, Cyber Security, Data Science, UI/UX, Cloud, and Frontend Engineering.
        </p>
      </div>

      {/* Rounded Search Pill Bar matching reference UI + Level Switcher */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by course, topic, or lesson..."
            aria-label="Search courses"
            className="w-full rounded-full border border-[#E6E3DC] bg-white py-2.5 pl-11 pr-10 text-sm text-stone-900 placeholder:text-stone-400 shadow-[0_1px_2px_rgba(24,24,27,0.03)] focus:border-stone-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:text-stone-900"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#E6E3DC] bg-white p-1">
          {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedLevel === lvl
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Course Categories">
        {COURSE_CATEGORIES.map((category) => {
          const active = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                active
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-[#E6E3DC] bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <p className="mt-6 text-xs font-medium text-stone-500 tabular-nums">
        Showing {filteredCourses.length} of {COURSES.length} tracks
      </p>

      {/* Course Grid or Empty State */}
      {filteredCourses.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl surface-card p-10 text-center">
          <p className="font-display text-lg font-semibold text-stone-900">No matching tracks found</p>
          <p className="mt-2 text-sm text-stone-500">
            Clear your search query or switch to another category filter.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="btn-primary mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
