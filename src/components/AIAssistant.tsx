import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquareCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export function AIAssistant() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide when unauthenticated or already inside the dedicated /ai workspace
  if (!user || location.pathname === '/ai' || location.pathname === '/signin' || location.pathname === '/signup') {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-5 md:right-5">
      <button
        type="button"
        onClick={() => navigate('/ai')}
        aria-label="Open AI Mentor Workspace"
        className="inline-flex h-11 items-center gap-2 rounded-full border border-[#E6E3DC] bg-white px-4 text-xs font-semibold text-stone-900 shadow-md hover:border-stone-300 hover:bg-stone-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
      >
        <MessageSquareCode className="h-4 w-4 text-sky-700" />
        <span className="whitespace-nowrap">Ask Mentor</span>
      </button>
    </div>
  );
}
