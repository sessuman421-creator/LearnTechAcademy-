# LearnTech Academy

Full-stack interactive engineering academy built with React 19, TypeScript, Tailwind CSS v4, Express, SQLite (`better-sqlite3`), Monaco Editor, Recharts, `@google/genai`, ExcelJS, and Archiver.

## Features

- **Home & Marketing Platform**: Hero showcase, academy metrics, popular tracks, engineering features, testimonials, and pricing tiers.
- **8 Engineering Tracks (88 Lessons)**:
  - App Development (11 lessons)
  - AI Engineering (12 lessons)
  - Backend Engineering (11 lessons)
  - Cyber Security (11 lessons)
  - Data Science (10 lessons)
  - UI/UX Design (10 lessons)
  - Cloud Engineering (11 lessons)
  - Frontend Development (12 lessons)
  - Every lesson includes structured architectural notes, copyable code snippets, a 3-question quiz, and SQLite-backed completion (`+50 XP`).
- **Monaco Coding Practice Lab (`/practice`)**: 30 interactive coding problems across Python (10), JavaScript (10), and HTML/CSS (10) with live test verification, sandboxed HTML preview, hints, reference solutions, and XP rewards.
- **Authentication & Progress (`/signin`, `/signup`, `/dashboard`)**: Passwordless email-only sign-in, signed `HttpOnly` JWT session cookies, CSRF header/origin checks, and persistent SQLite progress (`learntech.db`).
- **Dedicated AI Engineering Mentor (`/ai`)**: Server-side `@google/genai` (`gemini-3.1-flash-lite`) SSE streaming workspace aware of user progress, current lesson, and active Monaco code, with curriculum-aware fallback responses when no API key is configured.
- **Protected Admin Console (`/admin`)**: Strictly verified on the server for authorized administrator access. Includes 14-day user growth & enrollment charts, Telecel payment verification queue, per-user Pro & course approvals, searchable users directory, and downloads for **CSV**, **Excel (`.xlsx`)**, **SQLite Database Backup (`.db`)**, and **Full Source Code ZIP** (excluding `node_modules`, `.next`, `dist`, `.git`, `.env`).

## Database Schema (`learntech.db`)

- `users`: `id`, `name`, `email`, `password_hash`, `role`, `plan`, `pro_approved`, `approved_at`, `approved_by`, `xp`, `streak`, `last_active_date`, `date_joined`
- `enrollments`: `id`, `user_id`, `course_slug`, `enrolled_at`
- `lesson_progress`: `id`, `user_id`, `course_slug`, `lesson_id`, `completed_at`, `quiz_score`
- `practice_submissions`: `id`, `user_id`, `problem_id`, `language`, `xp_awarded`, `completed_at`
- `course_access`: `id`, `user_id`, `course_slug`, `granted_by`, `granted_at`
- `payment_requests`: `id`, `user_id`, `plan_requested`, `currency`, `amount`, `payment_network`, `payment_reference`, `confirmation_channel`, `requested_courses_json`, `status`, `admin_note`, `created_at`, `reviewed_at`, `reviewed_by`

## Folder Structure

```text
├── server.ts                  # Express + Vite server & all /api/* endpoints
├── server/
│   ├── db.ts                  # SQLite schema, WAL setup, seed data & analytics queries
│   └── auth.ts                # bcrypt/JWT cookies, CSRF validation & admin middleware
├── src/
│   ├── App.tsx                # SPA router and global layout
│   ├── index.css              # Tailwind v4 theme & glassmorphism styles
│   ├── types/academy.ts       # Shared TypeScript interfaces
│   ├── data/
│   │   ├── courses.ts         # Unified 8-track curriculum helpers
│   │   ├── coursesTech.ts     # App, AI, Backend, Security courses
│   │   ├── coursesDesignCloud.ts # Data Science, UI/UX, Cloud, Frontend courses
│   │   └── problems.ts        # 30 Python, JS & HTML/CSS coding challenges
│   ├── utils/codeRunner.ts    # In-browser sandbox runner & Python/JS/DOM test validator
│   ├── context/AuthContext.tsx
│   ├── components/            # Navbar, Footer, CourseCard, AIAssistant
│   └── pages/                 # Home, Courses, CourseDetail, Lesson, Practice, Dashboard, Auth, Admin
├── .env.example
└── package.json
```

## Scripts

```bash
npm run dev     # Start Express + Vite dev server on port 3000
npm run lint    # Run TypeScript type check (tsc --noEmit)
npm run build   # Build production client bundle to dist/
npm start       # Serve production build via server.ts
```

## Environment Variables

See `.env.example`:
- `GEMINI_API_KEY`: Server-side Gemini API key (configured automatically in AI Studio Secrets).
- `APP_URL`: Runtime service URL.
- `SESSION_SECRET`: Optional JWT signing key (falls back to an ephemeral in-memory cryptographic key when unset).
