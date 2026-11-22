import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { AIAssistant } from './components/AIAssistant.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { CoursesPage } from './pages/CoursesPage.tsx';
import { CourseDetailPage } from './pages/CourseDetailPage.tsx';
import { LessonPage } from './pages/LessonPage.tsx';
import { PracticePage } from './pages/PracticePage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { SignInPage, SignUpPage } from './pages/AuthPages.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { AIPage } from './pages/AIPage.tsx';

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="rounded-2xl border border-[#E6E3DC] bg-white px-6 py-4 text-sm font-medium text-stone-600 shadow-xs">
          Checking session...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: `${location.pathname}${location.search}` }} replace />;
  }

  return children;
}

function AppShell() {
  const { user } = useAuth();

  return (
    <div className={`flex min-h-screen flex-col bg-[#F7F5F0] text-stone-900 ${user ? 'pb-16 md:pb-0' : ''}`}>
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <HomePage />
              </RequireAuth>
            }
          />
          <Route
            path="/courses"
            element={
              <RequireAuth>
                <CoursesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:slug"
            element={
              <RequireAuth>
                <CourseDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:slug/lessons/:lessonId"
            element={
              <RequireAuth>
                <LessonPage />
              </RequireAuth>
            }
          />
          <Route
            path="/practice"
            element={
              <RequireAuth>
                <PracticePage />
              </RequireAuth>
            }
          />
          <Route
            path="/ai"
            element={
              <RequireAuth>
                <AIPage />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to={user ? '/' : '/signin'} replace />} />
        </Routes>
      </main>
      {user && <Footer />}
      {user && <AIAssistant />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
