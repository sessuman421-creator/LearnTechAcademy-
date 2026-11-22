import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-[#E6E3DC] bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="font-display text-base font-bold tracking-tight text-stone-900">
              LearnTech Academy
            </Link>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-500">
              Structured software engineering curriculum with browser-runnable Monaco coding labs, quizzes, and progress-aware technical mentorship.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wide text-stone-900">Curriculum</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-stone-500">
              <li>
                <Link to="/courses" className="hover:text-stone-900 transition-colors">
                  All Courses
                </Link>
              </li>
              <li>
                <Link to="/practice" className="hover:text-stone-900 transition-colors">
                  Practice Lab
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-stone-900 transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wide text-stone-900">Account</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-stone-500">
              <li>
                <Link to="/signin" className="hover:text-stone-900 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-stone-900 transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E6E3DC] pt-6 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} LearnTech Academy</p>
          <p className="tabular-nums">8 Tracks · 88 Lessons · 30 Interactive Challenges</p>
        </div>
      </div>
    </footer>
  );
}
