import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BarChart2, BookOpen, Code2, MessageSquareCode, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export function Navbar() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';

  const navLinks = [
    { to: '/courses', label: 'Courses', icon: BookOpen },
    { to: '/practice', label: 'Practice Lab', icon: Code2 },
    { to: '/ai', label: 'AI Mentor', icon: MessageSquareCode },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  const handleSignout = async () => {
    await signout();
    navigate('/signin');
  };

  return (
    <>
      <header className="border-b border-[#E6E3DC] bg-white/95 backdrop-blur-md md:sticky md:top-0 md:z-40">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single-line brand wordmark */}
          <Link
            to={user ? '/' : '/signin'}
            className="font-display text-base font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
          >
            LearnTech Academy
          </Link>

          {/* Zone 2: Clean single-line text links (authenticated only) */}
          {user && (
            <nav className="hidden md:flex items-center gap-7" aria-label="Primary">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ${
                      isActive
                        ? 'text-stone-900 underline decoration-stone-900 decoration-2 underline-offset-8'
                        : 'text-stone-500 hover:text-stone-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Zone 3: Single primary action */}
          <div className="flex items-center shrink-0">
            {user ? (
              <button
                type="button"
                onClick={handleSignout}
                className="btn-secondary rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
              >
                Sign Out
              </button>
            ) : location.pathname === '/signup' ? (
              <Link
                to="/signin"
                className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
              >
                Sign In
              </Link>
            ) : (
              <Link
                to="/signup"
                className="btn-secondary rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (authenticated only) */}
      {user && (
        <nav
          aria-label="Mobile Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-[#E6E3DC] bg-white/95 px-1 backdrop-blur-md md:hidden"
        >
          <NavLink
            to="/courses"
            className={({ isActive }) =>
              `flex min-h-[44px] min-w-[52px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
              }`
            }
          >
            <BookOpen className="h-5 w-5" />
            <span>Courses</span>
          </NavLink>

          <NavLink
            to="/ai"
            className={({ isActive }) =>
              `flex min-h-[44px] min-w-[52px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
              }`
            }
          >
            <MessageSquareCode className="h-5 w-5" />
            <span>AI Mentor</span>
          </NavLink>

          <NavLink
            to="/practice"
            className={({ isActive }) =>
              `flex min-h-[44px] min-w-[52px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
              }`
            }
          >
            <Code2 className="h-5 w-5" />
            <span>Practice</span>
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex min-h-[44px] min-w-[52px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
              }`
            }
          >
            <BarChart2 className="h-5 w-5" />
            <span>Progress</span>
          </NavLink>

          <NavLink
            to={isAdmin ? '/admin' : '/dashboard'}
            className={({ isActive }) =>
              `flex min-h-[44px] min-w-[52px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
              }`
            }
          >
            {isAdmin ? <ShieldCheck className="h-5 w-5" /> : <User className="h-5 w-5" />}
            <span>{isAdmin ? 'Admin' : 'Account'}</span>
          </NavLink>
        </nav>
      )}
    </>
  );
}
