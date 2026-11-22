import type { Course, Lesson } from '../types/academy.ts';

function buildLesson(
  coursePrefix: string,
  number: number,
  moduleTitle: string,
  title: string,
  duration: string,
  summary: string,
  conceptBody: string,
  keyPoints: string[],
  archBody: string,
  language: string,
  filename: string,
  code: string,
  quiz: { q: string; opts: [string, string, string, string]; ans: number; exp: string }[]
): Lesson {
  return {
    id: `${coursePrefix}-l${number}`,
    number,
    title,
    moduleTitle,
    duration,
    xpReward: 50,
    summary,
    notes: [
      {
        heading: 'Core Architecture & Mental Model',
        body: conceptBody,
        keyPoints,
      },
      {
        heading: 'Production Trade-Offs & Pitfalls',
        body: archBody,
      },
    ],
    codeExample: {
      language,
      filename,
      code: code.trim(),
    },
    quiz: quiz.map((item, idx) => ({
      id: `${coursePrefix}-l${number}-q${idx + 1}`,
      question: item.q,
      options: item.opts,
      correctIndex: item.ans,
      explanation: item.exp,
    })),
  };
}

export const COURSES_TECH: Course[] = [
  {
    slug: 'app-development',
    title: 'Cross-Platform Mobile & Desktop Engineering',
    subtitle: 'Design 60fps native interfaces, offline-first SQLite sync engines, and resilient mobile releases.',
    category: 'App Development',
    level: 'Intermediate',
    duration: '14h 30m',
    instructor: 'Elena Vance',
    instructorRole: 'Principal Mobile Architect',
    coverImage: '/src/assets/images/hero_academy_workspace_1795343842326.jpg',
    accentFrom: '#2563eb',
    accentTo: '#06b6d4',
    rating: 4.9,
    studentsCount: 4820,
    outcomes: [
      'Architect type-safe navigation trees and deep linking',
      'Implement optimistic offline-first sync queues over SQLite',
      'Build 60fps spring gesture physics on the UI thread',
      'Automate signed iOS, Android, and desktop builds',
    ],
    lessons: [
      buildLesson(
        'app',
        1,
        'Foundations & Native Bridge',
        'Mobile Architecture & Threading Model',
        '32 min',
        'Understand how modern cross-platform runtimes separate the JavaScript thread, shadow layout tree, and native UI thread.',
        'Responsive mobile software requires protecting the 16.6ms frame budget on the main UI thread. Heavy JSON parsing, cryptographic hashing, and database reads must never block frame commits.',
        [
          'Keep UI thread strictly for layout measurement and compositing',
          'Use JSI / native C++ bindings to eliminate async JSON bridge overhead',
          'Batch state updates before triggering shadow-tree reconciliation',
        ],
        'Avoid dispatching rapid setState calls inside scroll listeners. Instead, drive animated transforms through worklets or native driver nodes so scrolling stays locked at 60-120Hz even during data fetches.',
        'typescript',
        'src/runtime/frameBudget.ts',
        `export interface FrameMetrics {
  frameDurationMs: number;
  droppedFrames: number;
}

export function evaluateFrameBudget(samplesMs: number[], targetFps = 60): FrameMetrics {
  const budgetMs = 1000 / targetFps;
  const maxSample = Math.max(...samplesMs, 0);
  const droppedFrames = samplesMs.filter((ms) => ms > budgetMs).length;
  return {
    frameDurationMs: Number(maxSample.toFixed(2)),
    droppedFrames,
  };
}`,
        [
          {
            q: 'What is the maximum frame budget for a smooth 60fps mobile interface?',
            opts: ['8.3 ms', '16.6 ms', '33.3 ms', '50.0 ms'],
            ans: 1,
            exp: '1000 ms divided by 60 frames equals 16.67 ms per frame.',
          },
          {
            q: 'Why do modern frameworks prefer JSI over an asynchronous JSON bridge?',
            opts: [
              'It disables native rendering',
              'It allows direct synchronous C++ host object calls without serialization',
              'It removes TypeScript compilation',
              'It forces all code onto the main UI thread',
            ],
            ans: 1,
            exp: 'JSI holds direct references to C++ host objects, avoiding repeated JSON stringify/parse cycles.',
          },
          {
            q: 'Where should heavy SQLite queries execute in a mobile app?',
            opts: [
              'Inside the render function',
              'Inside a scroll event handler',
              'On a background worker or async native thread',
              'Inside CSS keyframes',
            ],
            ans: 2,
            exp: 'Offloading I/O to background threads preserves smooth UI responsiveness.',
          },
        ]
      ),
      buildLesson(
        'app',
        2,
        'Foundations & Native Bridge',
        'Type-Safe Navigation & Deep Linking',
        '28 min',
        'Structure nested stack, tab, and modal navigators with strongly typed route parameters and universal links.',
        'Navigation state is core application state. Defining a single source of truth for route parameter types eliminates runtime undefined-param crashes when users enter via push notifications or external links.',
        [
          'Validate incoming universal link parameters at the router boundary',
          'Preserve back-stack restoration across OS process death',
          'Separate authentication gates from public marketing routes cleanly',
        ],
        'Always handle cold-start deep links by queuing the target route until session hydration completes, preventing race conditions that dump authenticated users onto a login screen.',
        'typescript',
        'src/navigation/routes.ts',
        `export type AppRoute =
  | { name: 'Home' }
  | { name: 'CourseDetail'; params: { slug: string } }
  | { name: 'LessonPlayer'; params: { slug: string; lessonId: string } };

export function parseDeepLink(url: string): AppRoute {
  const parsed = new URL(url, 'https://learntech.academy');
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments[0] === 'courses' && segments[1] && segments[2]) {
    return { name: 'LessonPlayer', params: { slug: segments[1], lessonId: segments[2] } };
  }
  if (segments[0] === 'courses' && segments[1]) {
    return { name: 'CourseDetail', params: { slug: segments[1] } };
  }
  return { name: 'Home' };
}`,
        [
          {
            q: 'Why should deep link parameters be parsed and validated at the router boundary?',
            opts: [
              'External URLs may contain malformed or missing segments',
              'Browsers forbid query strings on mobile',
              'It compresses JavaScript bundle size by 50%',
              'It bypasses HTTPS verification',
            ],
            ans: 0,
            exp: 'External links are untrusted input and must be safely normalized into typed routes.',
          },
          {
            q: 'What happens if a cold-start deep link runs before session hydration finishes?',
            opts: [
              'The app speeds up',
              'Auth guards may falsely redirect the user to sign in',
              'SQLite automatically drops tables',
              'Push tokens are revoked',
            ],
            ans: 1,
            exp: 'Waiting for auth hydration ensures protected links route cleanly.',
          },
          {
            q: 'Which pattern prevents invalid route parameter typos at compile time?',
            opts: ['Using any types', 'Discriminated union route types', 'String concatenation', 'Global window variables'],
            ans: 1,
            exp: 'Discriminated unions enforce exact parameter shapes per screen.',
          },
        ]
      ),
      buildLesson(
        'app',
        3,
        'Foundations & Native Bridge',
        'Responsive Layout & Safe Area Geometry',
        '26 min',
        'Adapt layouts seamlessly across phones, foldables, tablets, and desktop windows using constraint-driven flex grids.',
        'Hardcoding pixel heights breaks across notches, dynamic islands, foldables, and split-screen multitasking. Rely on safe-area insets, flex proportions, and breakpoint hooks.',
        [
          'Respect top status bar, home indicator, and keyboard avoidance insets',
          'Enforce minimum 44x44pt touch targets for mobile controls',
          'Use adaptive multi-pane master-detail layouts on tablet widths (>= 768px)',
        ],
        'Test landscape rotation and virtual keyboard appearance together—sticky bottom toolbars often overlap text inputs when keyboard avoidance is misconfigured.',
        'typescript',
        'src/layout/safeInsets.ts',
        `export interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export function computeContentPadding(insets: Insets, basePadding = 16) {
  return {
    paddingTop: Math.max(insets.top, basePadding),
    paddingBottom: Math.max(insets.bottom + 8, basePadding),
    paddingHorizontal: Math.max(insets.left, insets.right, basePadding),
  };
}`,
        [
          {
            q: 'What is the minimum recommended touch target size for mobile interactive controls?',
            opts: ['20x20 pt', '28x28 pt', '44x44 pt', '80x80 pt'],
            ans: 2,
            exp: '44x44 pt ensures reliable thumb accuracy across devices.',
          },
          {
            q: 'At tablet widths, what layout upgrade replaces single-column drill-downs?',
            opts: ['Master-detail split view', 'Hidden navigation', 'Fixed 320px centered box', 'Horizontal marquee'],
            ans: 0,
            exp: 'Master-detail panes use wider viewport real estate productively.',
          },
          {
            q: 'Why must safe-area insets be combined with base padding?',
            opts: [
              'To prevent content from sitting under hardware notches or gesture bars',
              'To disable scrolling',
              'To increase network throughput',
              'To hide the status bar',
            ],
            ans: 0,
            exp: 'Safe-area insets protect content from hardware cutouts and OS chrome.',
          },
        ]
      ),
      buildLesson(
        'app',
        4,
        'Offline-First & Persistence',
        'Local SQLite Schema & Migrations',
        '38 min',
        'Design relational local storage using SQLite with versioned schema migrations and indexed lookups.',
        'Mobile and desktop apps feel instantaneous when reading from a local SQLite database rather than waiting on cold network round-trips.',
        [
          'Enable WAL (Write-Ahead Logging) mode for concurrent reads during writes',
          'Track schema_version inside PRAGMA user_version for atomic migrations',
          'Index foreign keys and timestamp columns used in feed queries',
        ],
        'Never wrap unindexed SELECT * queries inside list item renderers. Project only required columns and run migrations inside transactions so partial failures roll back cleanly.',
        'sql',
        'migrations/001_init.sql',
        `PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS local_notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_notes_sync ON local_notes(sync_status, updated_at);`,
        [
          {
            q: 'Why is WAL mode recommended for local SQLite databases in apps?',
            opts: [
              'It encrypts the disk automatically',
              'It allows concurrent reads while a write transaction is occurring',
              'It uploads data to S3',
              'It removes the need for primary keys',
            ],
            ans: 1,
            exp: 'Write-Ahead Logging prevents readers from blocking writers and vice versa.',
          },
          {
            q: 'How should schema migrations be executed?',
            opts: [
              'Without transactions',
              'Inside atomic transactions tracked by schema version',
              'By dropping the entire database every launch',
              'Only on iOS devices',
            ],
            ans: 1,
            exp: 'Transactional migrations ensure the schema never ends up half-migrated.',
          },
          {
            q: 'What does an index on (sync_status, updated_at) optimize?',
            opts: [
              'Finding pending items to upload in chronological order',
              'Reducing image file size',
              'Compiling TypeScript faster',
              'Rendering SVG gradients',
            ],
            ans: 0,
            exp: 'Composite indexes speed up filtered sync queue queries dramatically.',
          },
        ]
      ),
      buildLesson(
        'app',
        5,
        'Offline-First & Persistence',
        'Optimistic UI & Outbox Sync Queues',
        '40 min',
        'Build an outbox pattern that mutates local state immediately and reconciles server state when connectivity returns.',
        'Users expect tap actions like bookmarking or completing a lesson to reflect instantaneously—even on an airplane or subway.',
        [
          'Write local mutation + outbox queue entry in a single atomic transaction',
          'Attach idempotency keys to every outbox payload so retries never duplicate records',
          'Use exponential backoff with jitter when draining the sync queue',
        ],
        'Design conflict resolution explicitly: last-write-wins works for profile fields, while CRDTs or append-only logs are safer for collaborative notes.',
        'typescript',
        'src/sync/outboxQueue.ts',
        `export interface OutboxJob {
  id: string;
  idempotencyKey: string;
  endpoint: string;
  payload: Record<string, unknown>;
  attempts: number;
}

export function nextBackoffMs(attempts: number, baseMs = 1000, maxMs = 60000): number {
  const exp = Math.min(maxMs, baseMs * Math.pow(2, attempts));
  const jitter = Math.random() * 0.25 * exp;
  return Math.round(exp + jitter);
}`,
        [
          {
            q: 'Why does every outbox sync job carry an idempotency key?',
            opts: [
              'To compress JSON payloads',
              'To guarantee network retries do not create duplicate server records',
              'To bypass authentication',
              'To format timestamps',
            ],
            ans: 1,
            exp: 'Idempotency keys let the server safely deduplicate retried requests.',
          },
          {
            q: 'Why add jitter to exponential backoff?',
            opts: [
              'To prevent synchronized retry storms when connectivity returns',
              'To drain battery faster',
              'To sort arrays alphabetically',
              'To disable TLS certificates',
            ],
            ans: 0,
            exp: 'Jitter spreads out client retries so servers are not overwhelmed simultaneously.',
          },
          {
            q: 'When should local state and the outbox entry be written?',
            opts: [
              'In separate unrelated timeouts',
              'Inside the same atomic local transaction',
              'Only after server confirmation',
              'Once per week',
            ],
            ans: 1,
            exp: 'Atomic persistence prevents UI updates without a corresponding queued sync job.',
          },
        ]
      ),
      buildLesson(
        'app',
        6,
        'Offline-First & Persistence',
        'Virtualized Lists & Media Caching',
        '34 min',
        'Render 10,000-row feeds smoothly using cell recycling, stable keys, and bounded disk image caches.',
        'Unbounded ScrollViews allocate native views for every row upfront, exhausting memory quickly. Virtualized lists recycle a small window of cells around the viewport.',
        [
          'Supply deterministic item heights or fast layout estimators to avoid jumpiness',
          'Downsample images to display dimensions before decoding into bitmap memory',
          'Set strict LRU disk cache size caps so OS storage warnings never trigger',
        ],
        'Never use array indices as list keys when items reorder or filter—recycled native views will flash stale thumbnails across rows.',
        'typescript',
        'src/media/cachePolicy.ts',
        `export interface CacheEntry {
  key: string;
  bytes: number;
  lastAccessed: number;
}

export function evictLRU(entries: CacheEntry[], maxBytes: number): string[] {
  const sorted = [...entries].sort((a, b) => a.lastAccessed - b.lastAccessed);
  let total = sorted.reduce((sum, e) => sum + e.bytes, 0);
  const evicted: string[] = [];
  for (const item of sorted) {
    if (total <= maxBytes) break;
    evicted.push(item.key);
    total -= item.bytes;
  }
  return evicted;
}`,
        [
          {
            q: 'Why should images be decoded at target display dimensions rather than raw 4K resolution?',
            opts: [
              'A 4K decoded bitmap consumes ~32MB+ of RAM even inside a 100px thumbnail',
              'Mobile screens cannot show JPEGs',
              'It disables network caching',
              'It increases CPU usage intentionally',
            ],
            ans: 0,
            exp: 'Uncompressed bitmap memory scales with pixel dimensions (width * height * 4 bytes).',
          },
          {
            q: 'What bug occurs if array index is used as a list key on a mutable feed?',
            opts: [
              'The app compiles faster',
              'Recycled cells retain wrong state or flash incorrect thumbnails',
              'SQLite locks permanently',
              'Dark mode stops working',
            ],
            ans: 1,
            exp: 'Stable unique IDs ensure recycled cells bind cleanly to the right data.',
          },
          {
            q: 'Which cache eviction strategy keeps frequently viewed media warm?',
            opts: ['FIFO', 'LRU (Least Recently Used)', 'Random drop', 'Never evict'],
            ans: 1,
            exp: 'LRU evicts the oldest unused entries while preserving active items.',
          },
        ]
      ),
      buildLesson(
        'app',
        7,
        'Motion & Native Capabilities',
        'Gesture Physics & Spring Animations',
        '35 min',
        'Craft tactile swipeable cards, bottom sheets, and interruptible spring transitions driven by velocity.',
        'Duration-based easing curves feel robotic when interrupted mid-flight. Real physics springs preserve user drag velocity so gestures feel physically attached to the finger.',
        [
          'Transfer gesture end velocity directly into spring initialVelocity',
          'Animate only GPU-composited transforms (translateX, translateY, scale, opacity)',
          'Honor OS reduce-motion accessibility preferences automatically',
        ],
        'Never animate height or padding during interactive drags—layout recalculation every frame causes immediate stutter on mid-range hardware.',
        'typescript',
        'src/motion/springSnap.ts',
        `export function chooseSnapPoint(
  position: number,
  velocity: number,
  snapPoints: number[],
  projectionSeconds = 0.12
): number {
  const projected = position + velocity * projectionSeconds;
  return snapPoints.reduce((closest, point) =>
    Math.abs(point - projected) < Math.abs(closest - projected) ? point : closest
  );
}`,
        [
          {
            q: 'Why use velocity projection when choosing a bottom sheet snap point?',
            opts: [
              'A quick flick snaps naturally to the intended destination even before crossing halfway',
              'It disables touch input',
              'It lowers screen brightness',
              'It increases bundle size',
            ],
            ans: 0,
            exp: 'Projecting position + velocity * dt mirrors natural physical momentum.',
          },
          {
            q: 'Which CSS/native properties stay on the GPU compositor thread?',
            opts: ['width and height', 'margin and top', 'transform and opacity', 'border-width'],
            ans: 2,
            exp: 'Transform and opacity avoid expensive layout and paint passes.',
          },
          {
            q: 'What should happen if the user enables Reduced Motion in OS settings?',
            opts: [
              'Ignore it',
              'Replace large spatial springs with crisp short opacity fades',
              'Disable all buttons',
              'Crash intentionally',
            ],
            ans: 1,
            exp: 'Respecting reduced motion prevents vestibular discomfort while keeping state clear.',
          },
        ]
      ),
      buildLesson(
        'app',
        8,
        'Motion & Native Capabilities',
        'Push Notifications & Background Tasks',
        '30 min',
        'Register APNs/FCM tokens securely, handle foreground/background delivery, and schedule OS-friendly background sync.',
        'Push notifications bridge server events to dormant devices, while OS background schedulers impose strict battery and execution quotas.',
        [
          'Associate device push tokens with authenticated user sessions and revoke on sign-out',
          'Include minimal metadata in push payloads and fetch sensitive details over TLS',
          'Schedule background refresh tasks using OS constraint APIs (WorkManager / BGTaskScheduler)',
        ],
        'Never rely on silent pushes for critical delivery—battery saver modes routinely throttle silent background wakes.',
        'typescript',
        'src/notifications/tokenRegistry.ts',
        `export interface DeviceRegistration {
  userId: string;
  platform: 'ios' | 'android' | 'web';
  pushToken: string;
  updatedAtIso: string;
}

export function sanitizePushPayload(title: string, route: string) {
  return {
    title: title.slice(0, 80),
    data: { route: route.startsWith('/') ? route : '/' },
  };
}`,
        [
          {
            q: 'What should happen to a device push token when the user signs out?',
            opts: [
              'Keep sending notifications to the device',
              'Unregister or disassociate the token from that user account on the server',
              'Store the token in URL parameters',
              'Reinstall the app',
            ],
            ans: 1,
            exp: 'Disassociating tokens prevents private notifications leaking to the next person using the device.',
          },
          {
            q: 'Why avoid putting sensitive PII directly inside push notification payloads?',
            opts: [
              'Push payloads traverse third-party relay infrastructure and may display on lock screens',
              'JSON cannot hold strings',
              'APNs rejects all text',
              'It slows down SQLite',
            ],
            ans: 0,
            exp: 'Keep payloads minimal and fetch sensitive state inside the authenticated app.',
          },
          {
            q: 'Why do OSes throttle background tasks?',
            opts: [
              'To preserve battery life and thermal budgets',
              'Because TypeScript forbids timers',
              'To block Wi-Fi connections',
              'To break offline sync',
            ],
            ans: 0,
            exp: 'Mobile OSes coalesce background work to protect battery longevity.',
          },
        ]
      ),
      buildLesson(
        'app',
        9,
        'Security & Release',
        'Biometric Auth & Secure Keychain Storage',
        '32 min',
        'Store refresh tokens inside hardware-backed Keychain / Keystore enclaves gated by FaceID or fingerprint prompts.',
        'Plain AsyncStorage or SharedPreferences files are readable on rooted devices or backups. Credentials belong exclusively in hardware-encrypted OS keystores.',
        [
          'Store short-lived access tokens in memory and refresh tokens in Keychain/Keystore',
          'Exclude sensitive caches from automatic iCloud/Google Drive device backups',
          'Verify biometric authentication cryptographically rather than via boolean flags',
        ],
        'Never hardcode API secrets inside mobile binaries—reverse engineers inspect IPA and APK strings in seconds.',
        'typescript',
        'src/security/tokenStore.ts',
        `export interface SessionTokens {
  accessToken: string;
  expiresAtMs: number;
}

export function needsRefresh(tokens: SessionTokens, skewMs = 30_000): boolean {
  return Date.now() + skewMs >= tokens.expiresAtMs;
}`,
        [
          {
            q: 'Where should long-lived refresh tokens be stored on mobile devices?',
            opts: [
              'Plaintext JSON file',
              'OS Keychain (iOS) / Keystore (Android)',
              'Global window object',
              'Public user preferences',
            ],
            ans: 1,
            exp: 'Hardware-backed keystores isolate cryptographic keys and tokens from other apps.',
          },
          {
            q: 'Why should secrets never be embedded in mobile app binaries?',
            opts: [
              'Anyone can decompile or inspect strings in distributed IPA/APK packages',
              'JSON files cannot contain keys',
              'Mobile CPUs cannot read constants',
              'App stores delete all strings',
            ],
            ans: 0,
            exp: 'Client binaries are untrusted environments; keep secrets on your backend.',
          },
          {
            q: 'Why include a clock-skew buffer when checking token expiration?',
            opts: [
              'To proactively refresh before an API request fails mid-flight',
              'To extend token lifetime infinitely',
              'To disable HTTPS',
              'To skip signature checks',
            ],
            ans: 0,
            exp: 'Refreshing slightly early avoids transient 401 errors on slow networks.',
          },
        ]
      ),
      buildLesson(
        'app',
        10,
        'Security & Release',
        'Desktop Packaging & Native Windowing',
        '29 min',
        'Extend your cross-platform architecture to macOS, Windows, and Linux desktops with native menus, tray icons, and auto-updaters.',
        'Desktop users expect keyboard shortcuts, multi-window support, crisp titlebar integration, and silent signed auto-updates.',
        [
          'Isolate renderer UI from OS filesystem APIs via narrow, validated IPC bridges',
          'Expose standard command palettes and keyboard accelerators (Cmd/Ctrl+K)',
          'Verify cryptographic signatures on every auto-update bundle before swap',
        ],
        'Never enable unrestricted Node integration inside webview renderers—any XSS would escalate to full filesystem access.',
        'typescript',
        'src/desktop/ipcWhitelist.ts',
        `const ALLOWED_CHANNELS = new Set(['file:exportCsv', 'window:toggleMaximize', 'app:version']);

export function validateIpcChannel(channel: string): boolean {
  return ALLOWED_CHANNELS.has(channel);
}`,
        [
          {
            q: 'Why isolate desktop UI renderers from unrestricted Node/OS access?',
            opts: [
              'To prevent untrusted web content or XSS from accessing the host filesystem',
              'To make windows smaller',
              'To disable keyboard shortcuts',
              'To remove CSS support',
            ],
            ans: 0,
            exp: 'Context isolation + explicit IPC whitelists enforce least privilege.',
          },
          {
            q: 'What ensures downloaded desktop auto-updates have not been tampered with?',
            opts: ['Filename check', 'Code-signing certificate and signature verification', 'HTTP status 200', 'Zip compression'],
            ans: 1,
            exp: 'Cryptographic signature verification validates publisher authenticity.',
          },
          {
            q: 'What UX pattern boosts desktop power-user efficiency?',
            opts: ['Disabling keyboard tab navigation', 'Command palette & keyboard shortcuts', 'Popup ads', 'Single-line scrolling'],
            ans: 1,
            exp: 'Keyboard shortcuts and command palettes match desktop ergonomics.',
          },
        ]
      ),
      buildLesson(
        'app',
        11,
        'Security & Release',
        'CI/CD Signing, Telemetry & Store Releases',
        '31 min',
        'Automate deterministic builds, crash symbolication, staged rollouts, and OTA hotfixes safely.',
        'Shipping consistently requires reproducible CI pipelines that manage provisioning profiles, upload dSYMs/ProGuard maps, and roll out releases in staged percentages.',
        [
          'Pin runtime and native dependency versions in lockfiles for reproducible builds',
          'Upload source maps and debug symbols during CI so production crashes are readable',
          'Roll out to 5% -> 25% -> 100% of users with automated crash-free rate gates',
        ],
        'Never ship over-the-air JS updates that break native binary schema assumptions; enforce strict binary compatibility version headers.',
        'yaml',
        '.github/workflows/release.yml',
        `name: Mobile Release Pipeline
on:
  push:
    tags: ['v*']
jobs:
  verify-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test -- --ci
      - run: npm run build`,
        [
          {
            q: 'Why upload debug symbols (dSYMs / ProGuard mappings) during CI builds?',
            opts: [
              'To deobfuscate production crash stack traces into readable lines',
              'To inflate app download size',
              'To bypass App Store review',
              'To enable dark mode',
            ],
            ans: 0,
            exp: 'Without symbols, minified/stripped crash reports are unreadable.',
          },
          {
            q: 'What is the purpose of a 5% staged rollout?',
            opts: [
              'To catch regressions early before impacting the entire user base',
              'To slow down CI servers',
              'To delete old user accounts',
              'To avoid testing locally',
            ],
            ans: 0,
            exp: 'Phased rollouts limit blast radius when unexpected device bugs appear.',
          },
          {
            q: 'Why must OTA updates check native binary compatibility versions?',
            opts: [
              'To prevent new JS code from calling native modules absent in older binaries',
              'To double image brightness',
              'To disable offline mode',
              'To clear local SQLite automatically',
            ],
            ans: 0,
            exp: 'Runtime compatibility checks prevent native bridge crashes on un-updated installs.',
          },
        ]
      ),
    ],
  },
  {
    slug: 'ai-engineering',
    title: 'Production LLM Systems, Agents & RAG',
    subtitle: 'Engineer reliable retrieval pipelines, structured tool-calling agents, evals, and low-latency inference.',
    category: 'AI Engineering',
    level: 'Advanced',
    duration: '16h 15m',
    instructor: 'Dr. Marcus Chen',
    instructorRole: 'Staff AI Systems Engineer',
    coverImage: '/src/assets/images/course_ai_engineering_1795343841445.jpg',
    accentFrom: '#6366f1',
    accentTo: '#22d3ee',
    rating: 4.9,
    studentsCount: 6340,
    outcomes: [
      'Design hybrid BM25 + dense vector retrieval pipelines with reranking',
      'Enforce deterministic JSON schemas for structured extraction',
      'Build multi-step tool-calling agents with loop budgets and safety guards',
      'Measure hallucination, latency, and cost with automated eval suites',
    ],
    lessons: [
      buildLesson(
        'ai',
        1,
        'LLM Fundamentals & APIs',
        'Transformer Context, Tokens & Attention',
        '30 min',
        'Master how tokenization, KV-cache memory, and context windows govern latency, cost, and reasoning accuracy.',
        'Large Language Models process subword tokens sequentially. Understanding prefill (parallel prompt processing) versus decode (autoregressive token generation) explains why prompt length and output length behave very differently.',
        [
          'Prefill scales in parallel; decode is memory-bandwidth bound per generated token',
          'Prompt caching reuses KV states across shared system instructions',
          'Keep critical instructions and constraints near the start or end of long contexts',
        ],
        'Stuffing 50,000 irrelevant tokens into a prompt increases latency, raises billable cost, and degrades retrieval accuracy ("lost in the middle"). Curate context surgically.',
        'typescript',
        'src/ai/tokenBudget.ts',
        `export function estimateTokens(text: string): number {
  return Math.ceil(text.trim().length / 4);
}

export function trimContextToBudget(chunks: string[], maxTokens: number): string[] {
  const selected: string[] = [];
  let used = 0;
  for (const chunk of chunks) {
    const cost = estimateTokens(chunk);
    if (used + cost > maxTokens) break;
    selected.push(chunk);
    used += cost;
  }
  return selected;
}`,
        [
          {
            q: 'Which phase of LLM inference generates tokens sequentially one by one?',
            opts: ['Tokenization', 'Prefill', 'Decode', 'Embedding'],
            ans: 2,
            exp: 'Decode generates each new token autoregressively conditioned on prior KV cache.',
          },
          {
            q: 'What problem occurs when dumping huge amounts of unranked text into prompts?',
            opts: [
              'Higher latency, higher cost, and degraded recall in middle sections',
              'Zero latency',
              'Automatic SQL injection',
              'Smaller JSON schemas',
            ],
            ans: 0,
            exp: 'Focused, high-signal context outperforms noisy giant prompts.',
          },
          {
            q: 'How does prompt caching reduce latency and cost?',
            opts: [
              'By skipping output tokens',
              'By reusing computed Key-Value attention tensors for repeated prefixes',
              'By lowering network MTU',
              'By converting JSON to XML',
            ],
            ans: 1,
            exp: 'Prefix KV caching avoids recomputing attention over static system instructions.',
          },
        ]
      ),
      buildLesson(
        'ai',
        2,
        'LLM Fundamentals & APIs',
        'Server-Side SDK Patterns & Streaming SSE',
        '34 min',
        'Keep API credentials strictly on the server and stream model tokens cleanly to browsers using Server-Sent Events.',
        'Production AI apps never embed model API keys in client JavaScript. Express or Next.js route handlers validate user auth, enforce rate limits, invoke the SDK, and stream chunks incrementally.',
        [
          'Use Server-Sent Events (text/event-stream) for unidirectional token streaming',
          'Abort upstream model requests immediately when the client disconnects',
          'Separate system instructions from untrusted user input cleanly',
        ],
        'Always set explicit request timeouts and handle partial stream errors gracefully so the UI never hangs indefinitely on a stalled socket.',
        'typescript',
        'src/server/streamRoute.ts',
        `export function formatSseEvent(event: string, data: unknown): string {
  return \`event: \${event}\\ndata: \${JSON.stringify(data)}\\n\\n\`;
}`,
        [
          {
            q: 'Where must LLM API keys always reside in web applications?',
            opts: [
              'Browser localStorage',
              'Server-side environment variables accessed only by backend routes',
              'Client React state',
              'HTML meta tags',
            ],
            ans: 1,
            exp: 'Backend proxy routes keep credentials completely invisible to clients.',
          },
          {
            q: 'Why is SSE preferred over polling for LLM text generation?',
            opts: [
              'Users see the first token in ~200ms rather than waiting 8 seconds for full completion',
              'SSE works without HTTP',
              'SSE encrypts passwords in SQLite',
              'Polling is illegal in browsers',
            ],
            ans: 0,
            exp: 'Streaming dramatically lowers perceived latency (Time To First Token).',
          },
          {
            q: 'What should the server do if the user closes the tab mid-stream?',
            opts: [
              'Keep generating tokens forever',
              'Pass an AbortSignal to cancel upstream generation',
              'Restart the database',
              'Log the API key',
            ],
            ans: 1,
            exp: 'Propagating abort signals prevents wasted compute and billing.',
          },
        ]
      ),
      buildLesson(
        'ai',
        3,
        'LLM Fundamentals & APIs',
        'Structured Outputs & Schema Enforcement',
        '32 min',
        'Guarantee type-safe JSON responses using strict response schemas instead of fragile regex parsing.',
        'Asking an LLM politely to "only output JSON" fails in production whenever it wraps output in markdown fences or adds conversational chatter. Constrained decoding schemas enforce structure at the token sampler level.',
        [
          'Define explicit property types, required fields, and enum constraints',
          'Validate parsed JSON with TypeScript/Zod at runtime before downstream DB writes',
          'Use clear property descriptions inside schemas to guide extraction accuracy',
        ],
        'Keep schemas shallow and focused; deeply nested recursive schemas degrade model accuracy and slow down grammar compilation.',
        'typescript',
        'src/ai/structuredExtract.ts',
        `export interface LessonSummarySchema {
  keyConcept: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  actionItems: string[];
}

export function validateExtractedSummary(raw: unknown): LessonSummarySchema | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.keyConcept !== 'string' || !Array.isArray(obj.actionItems)) return null;
  return {
    keyConcept: obj.keyConcept,
    difficulty: obj.difficulty === 'Advanced' || obj.difficulty === 'Intermediate' ? obj.difficulty : 'Beginner',
    actionItems: obj.actionItems.filter((x): x is string => typeof x === 'string'),
  };
}`,
        [
          {
            q: 'Why is constrained schema output superior to prompt-only JSON instructions?',
            opts: [
              'It restricts token sampling to valid schema grammar, eliminating markdown wrapper bugs',
              'It removes the need for prompts',
              'It reduces image resolution',
              'It disables TypeScript',
            ],
            ans: 0,
            exp: 'Schema constraints enforce structural validity directly during decoding.',
          },
          {
            q: 'Should you still validate structured AI output in TypeScript before writing to a DB?',
            opts: [
              'Yes—runtime validation guards against edge-case field anomalies or truncation',
              'No, JSON.parse is always sufficient',
              'Only on Fridays',
              'Only for CSS files',
            ],
            ans: 0,
            exp: 'Defense-in-depth runtime validation protects database integrity.',
          },
          {
            q: 'How do property descriptions inside a JSON schema help the model?',
            opts: [
              'They clarify semantic intent for each field',
              'They compress TCP packets',
              'They change CSS colors',
              'They replace embeddings',
            ],
            ans: 0,
            exp: 'Clear field descriptions guide the model on exact expected semantics.',
          },
        ]
      ),
      buildLesson(
        'ai',
        4,
        'Retrieval-Augmented Generation',
        'Document Chunking & Metadata Indexing',
        '36 min',
        'Split codebases, PDFs, and technical docs into semantically coherent chunks enriched with structural metadata.',
        'Poor chunking breaks sentences, detaches headings from paragraphs, and cuts functions in half. High-quality RAG begins with structure-aware segmentation.',
        [
          'Split by markdown headings, AST function boundaries, or paragraph breaks first',
          'Attach parent heading, source URL, and updated_at metadata to every chunk',
          'Add 10–15% overlap only when splitting continuous prose without natural boundaries',
        ],
        'Store the full parent section alongside small search chunks ("small-to-big retrieval") so vector matching stays sharp while the LLM reads complete context.',
        'typescript',
        'src/rag/chunker.ts',
        `export interface TextChunk {
  index: number;
  content: string;
  charCount: number;
}

export function chunkMarkdownSections(markdown: string, maxChars = 900): TextChunk[] {
  const sections = markdown.split(/\\n(?=##\\s)/g);
  return sections.map((sec, idx) => ({
    index: idx,
    content: sec.trim().slice(0, maxChars),
    charCount: Math.min(sec.trim().length, maxChars),
  }));
}`,
        [
          {
            q: 'What is the "small-to-big" retrieval pattern?',
            opts: [
              'Index small high-precision chunks for matching, then pass the larger parent section to the LLM',
              'Shrink the font size on mobile',
              'Delete old database rows',
              'Use tiny models for everything',
            ],
            ans: 0,
            exp: 'Small chunks match queries sharply, while parent context gives the LLM full nuance.',
          },
          {
            q: 'Why attach metadata (source, section, timestamp) to every vector chunk?',
            opts: [
              'To support pre-filtering by permissions, recency, and citations',
              'To slow down indexing',
              'To replace SQLite',
              'To hide author names',
            ],
            ans: 0,
            exp: 'Metadata filtering enforces access control and enables accurate source citations.',
          },
          {
            q: 'What happens when naive fixed-character chunking cuts through a code block?',
            opts: [
              'Context and syntax meaning are fragmented across separate embeddings',
              'The code runs faster',
              'Tokens become free',
              'CSS animations break',
            ],
            ans: 0,
            exp: 'AST or heading-aware splitting preserves semantic integrity.',
          },
        ]
      ),
      buildLesson(
        'ai',
        5,
        'Retrieval-Augmented Generation',
        'Embeddings & Cosine Similarity Search',
        '35 min',
        'Represent meaning as high-dimensional vectors and query nearest neighbors efficiently.',
        'Embedding models map text into dense vectors where semantic similarity corresponds to geometric proximity measured via cosine similarity or dot product.',
        [
          'Use the exact same embedding model for indexing documents and embedding queries',
          'Normalize vectors to unit length so cosine similarity reduces to a fast dot product',
          'Filter by tenant/user ACL metadata before ranking similarity scores',
        ],
        'Never treat vector search as a replacement for exact keyword search—error codes, SKUs, and function names still need lexical matching.',
        'typescript',
        'src/rag/similarity.ts',
        `export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}`,
        [
          {
            q: 'Why must documents and search queries use the same embedding model?',
            opts: [
              'Different models occupy incompatible vector spaces',
              'It saves disk space',
              'Browsers enforce it',
              'To enable dark mode',
            ],
            ans: 0,
            exp: 'Vectors from different embedding models have different dimensions and geometries.',
          },
          {
            q: 'When vectors are L2-normalized, cosine similarity equals what operation?',
            opts: ['Division', 'Dot product', 'Modulo', 'Bitwise XOR'],
            ans: 1,
            exp: 'Unit norms make the denominator 1, leaving only the dot product.',
          },
          {
            q: 'Where do dense embeddings struggle compared to keyword search?',
            opts: [
              'Paraphrased questions',
              'Exact alphanumeric IDs, error codes like ERR_4092, and rare acronyms',
              'Multi-sentence concepts',
              'Synonyms',
            ],
            ans: 1,
            exp: 'Exact identifiers match far better with BM25 lexical search.',
          },
        ]
      ),
      buildLesson(
        'ai',
        6,
        'Retrieval-Augmented Generation',
        'Hybrid Search (BM25 + Vectors) & Reranking',
        '38 min',
        'Combine lexical BM25 scores with semantic vector scores using Reciprocal Rank Fusion and cross-encoder reranking.',
        'Hybrid retrieval merges the precision of keyword search with the recall of semantic vectors. Reciprocal Rank Fusion (RRF) combines ranked lists cleanly without fragile score calibration.',
        [
          'Run dense vector search + BM25 keyword search in parallel',
          'Merge candidate lists via RRF: sum(1 / (k + rank))',
          'Pass top 25 candidates through a cross-encoder reranker down to top 5',
        ],
        'Cross-encoder rerankers are too slow to scan 100,000 documents directly, but blazingly accurate on the top 25 candidates from fast first-stage retrieval.',
        'typescript',
        'src/rag/rrf.ts',
        `export function reciprocalRankFusion(
  rankings: string[][],
  k = 60
): { id: string; score: number }[] {
  const scores = new Map<string, number>();
  for (const list of rankings) {
    list.forEach((docId, idx) => {
      const prev = scores.get(docId) ?? 0;
      scores.set(docId, prev + 1 / (k + idx + 1));
    });
  }
  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}`,
        [
          {
            q: 'Why does Reciprocal Rank Fusion (RRF) use ranks instead of raw similarity scores?',
            opts: [
              'BM25 scores and cosine similarities are on incompatible scales',
              'RRF deletes duplicates',
              'Ranks are random numbers',
              'Cosine similarity is always negative',
            ],
            ans: 0,
            exp: 'Rank-based fusion combines heterogeneous search engines without manual weight tuning.',
          },
          {
            q: 'Why apply a cross-encoder reranker only to the top ~25 candidates?',
            opts: [
              'Cross-encoders attend jointly over query + doc and are computationally expensive at corpus scale',
              'They only accept 25 bytes',
              'They cannot read English',
              'They require SQLite triggers',
            ],
            ans: 0,
            exp: 'Two-stage retrieval balances speed (first stage) with deep relevance (rerank stage).',
          },
          {
            q: 'What does hybrid search solve?',
            opts: [
              'Both semantic synonyms AND exact identifier/keyword lookups',
              'CSS grid layout',
              'Password hashing',
              'Image compression',
            ],
            ans: 0,
            exp: 'Combining dense + lexical search covers both conceptual and exact matches.',
          },
        ]
      ),
      buildLesson(
        'ai',
        7,
        'Agents & Tool Calling',
        'Function Calling & Deterministic Tool Contracts',
        '40 min',
        'Connect models safely to databases, calculators, and APIs using typed function declarations.',
        'Models should never guess arithmetic or fabricate database records. Function calling lets the model emit structured tool invocations that your server validates and executes.',
        [
          'Write crisp parameter schemas and clear descriptions specifying when to invoke each tool',
          'Validate every tool argument server-side before executing database or API actions',
          'Return concise, structured tool observations back into the conversation turn',
        ],
        'Treat model-generated tool arguments as untrusted input—never pass them into raw SQL or filesystem paths without strict validation.',
        'typescript',
        'src/ai/toolRegistry.ts',
        `export interface ToolResult {
  ok: boolean;
  output: unknown;
}

export function executeSafeMathTool(a: number, b: number, op: 'add' | 'mul'): ToolResult {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return { ok: false, output: 'Invalid numeric arguments' };
  }
  return { ok: true, output: op === 'add' ? a + b : a * b };
}`,
        [
          {
            q: 'Who actually executes a declared tool function in an AI agent loop?',
            opts: [
              'The LLM weights directly',
              'Your application server after validating the model’s requested arguments',
              'The browser CSS engine',
              'The DNS resolver',
            ],
            ans: 1,
            exp: 'The model proposes tool calls; your backend validates and runs them.',
          },
          {
            q: 'How should model-supplied tool parameters be treated?',
            opts: [
              'As untrusted input requiring schema and authorization checks',
              'As pre-verified admin commands',
              'Executed inside eval()',
              'Ignored completely',
            ],
            ans: 0,
            exp: 'Prompt injections can influence tool arguments, so server validation is mandatory.',
          },
          {
            q: 'Why return concise JSON from tools instead of huge raw HTML dumps?',
            opts: [
              'To save context tokens and keep model reasoning focused',
              'JSON cannot contain numbers',
              'HTML crashes Node.js',
              'Tools must return empty strings',
            ],
            ans: 0,
            exp: 'Clean tool outputs prevent context pollution and reduce hallucination.',
          },
        ]
      ),
      buildLesson(
        'ai',
        8,
        'Agents & Tool Calling',
        'Agentic Loops, Budgets & Human-in-the-Loop',
        '36 min',
        'Design bounded ReAct loops with step caps, cycle detection, and explicit approval gates for destructive mutations.',
        'Unbounded autonomous loops can burn tokens infinitely or repeat failed tool calls. Production agents operate within strict step budgets and pause for confirmation before irreversible writes.',
        [
          'Cap maximum reasoning/tool iterations (e.g., maxSteps = 6)',
          'Detect repeated identical tool calls and break loops gracefully',
          'Require explicit user confirmation before sending emails, deleting records, or charging cards',
        ],
        'Always return a graceful partial summary when a step budget exhausts instead of throwing an unhandled 500 error.',
        'typescript',
        'src/ai/agentBudget.ts',
        `export class StepBudget {
  private steps = 0;
  private maxSteps: number;

  constructor(maxSteps = 6) {
    this.maxSteps = maxSteps;
  }

  consume(): boolean {
    if (this.steps >= this.maxSteps) return false;
    this.steps += 1;
    return true;
  }

  remaining(): number {
    return Math.max(0, this.maxSteps - this.steps);
  }
}`,
        [
          {
            q: 'Why enforce a maximum step budget on an agent loop?',
            opts: [
              'To prevent infinite retry loops and runaway token costs',
              'To force hallucinations',
              'To disable streaming',
              'To skip database migrations',
            ],
            ans: 0,
            exp: 'Step caps guarantee bounded latency and predictable spend.',
          },
          {
            q: 'Which actions require human-in-the-loop confirmation?',
            opts: [
              'Read-only search queries',
              'Irreversible mutations like deleting data, sending emails, or financial transfers',
              'Counting array length',
              'Formatting dates',
            ],
            ans: 1,
            exp: 'Confirmation gates prevent costly mistakes from ambiguous prompts.',
          },
          {
            q: 'What should trigger loop circuit-breaking?',
            opts: [
              'The agent calling the exact same tool with identical failing args repeatedly',
              'The first successful answer',
              'A fast response',
              'High contrast dark mode',
            ],
            ans: 0,
            exp: 'Repeated identical calls signal a stuck reasoning cycle.',
          },
        ]
      ),
      buildLesson(
        'ai',
        9,
        'Evaluation & Safety',
        'Automated Evals & Groundedness Metrics',
        '37 min',
        'Replace "vibes-based" prompt tweaking with golden datasets, rubric judges, and regression gates in CI.',
        'Every prompt change can silently break three other edge cases. Systematic evaluations score faithfulness, relevance, format validity, and tool accuracy across curated test cases.',
        [
          'Build a golden dataset of real user queries, edge cases, and adversarial prompts',
          'Separate deterministic checks (valid JSON, citations present) from LLM-as-judge rubrics',
          'Track pass rates across prompt/model versions before deploying to production',
        ],
        'Calibrate LLM judges against human labels on 50 examples first; never trust an uncalibrated judge blindly.',
        'typescript',
        'src/evals/scorecard.ts',
        `export interface EvalCaseResult {
  id: string;
  schemaValid: boolean;
  groundedScore: number; // 0 to 1
}

export function summarizeEvalRun(results: EvalCaseResult[]) {
  const total = results.length || 1;
  const schemaPassRate = results.filter((r) => r.schemaValid).length / total;
  const avgGrounded = results.reduce((s, r) => s + r.groundedScore, 0) / total;
  return {
    schemaPassRate: Number((schemaPassRate * 100).toFixed(1)),
    avgGrounded: Number(avgGrounded.toFixed(2)),
  };
}`,
        [
          {
            q: 'Why maintain a golden evaluation dataset before tuning prompts?',
            opts: [
              'To measure objectively whether edits improve or regress accuracy across cases',
              'To increase bundle size',
              'To avoid writing TypeScript',
              'To replace unit tests for SQL',
            ],
            ans: 0,
            exp: 'Golden evals turn prompt engineering into measurable software engineering.',
          },
          {
            q: 'Which checks should remain purely deterministic rather than using an LLM judge?',
            opts: [
              'JSON schema validity, regex constraints, and expected tool names',
              'Tone friendliness',
              'Summary conciseness',
              'Writing style',
            ],
            ans: 0,
            exp: 'Deterministic code checks are instant, free, and 100% consistent.',
          },
          {
            q: 'What does "groundedness" measure in a RAG system?',
            opts: [
              'Whether claims in the answer are supported by retrieved context rather than invented',
              'How many pixels are on screen',
              'Database table count',
              'CPU clock speed',
            ],
            ans: 0,
            exp: 'Groundedness detects hallucinations unsupported by source passages.',
          },
        ]
      ),
      buildLesson(
        'ai',
        10,
        'Evaluation & Safety',
        'Prompt Injection Defense & Guardrails',
        '33 min',
        'Protect AI workflows against indirect prompt injections, PII leakage, and unauthorized tool escalation.',
        'When an AI reads untrusted web pages, PDFs, or user tickets, adversarial text inside those documents can attempt to override system instructions.',
        [
          'Treat retrieved documents and user inputs as data, never trusted instructions',
          'Enforce authorization checks in backend code—never rely on prompt wording for access control',
          'Redact sensitive PII before logging AI traces or sending external analytics',
        ],
        'Defense in depth means even if a prompt injection tricks the model into proposing an admin tool call, the server middleware rejects it immediately.',
        'typescript',
        'src/ai/redactPii.ts',
        `export function redactSensitiveText(input: string): string {
  return input
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/\\b\\d{3}-\\d{2}-\\d{4}\\b/g, '[REDACTED_ID]');
}`,
        [
          {
            q: 'What is indirect prompt injection?',
            opts: [
              'Malicious instructions hidden inside retrieved documents or emails processed by the model',
              'A CSS animation bug',
              'Typing quickly in an editor',
              'Compressing a ZIP file',
            ],
            ans: 0,
            exp: 'Untrusted external data read by an LLM can contain adversarial directives.',
          },
          {
            q: 'Where must role-based access permissions be enforced in an AI app?',
            opts: [
              'Only in the system prompt',
              'In server-side code and database queries before passing data or running tools',
              'In CSS classes',
              'In client tooltips',
            ],
            ans: 1,
            exp: 'Prompts are probabilistic; access control must be enforced deterministically in code.',
          },
          {
            q: 'Why redact PII before persisting AI telemetry logs?',
            opts: [
              'To minimize privacy exposure and comply with data protection standards',
              'To break JSON parsing',
              'To double model latency',
              'To remove timestamps',
            ],
            ans: 0,
            exp: 'Telemetry logs should not unnecessarily accumulate sensitive user details.',
          },
        ]
      ),
      buildLesson(
        'ai',
        11,
        'Optimization & Scale',
        'Model Routing, Caching & Cost Control',
        '31 min',
        'Route simple classification to fast lightweight models while reserving deep reasoning models for complex synthesis.',
        'Sending every greeting or FAQ lookup to the largest reasoning model wastes 10x cost and latency. Cascading model routers match task complexity to the optimal model tier.',
        [
          'Classify request complexity or route deterministic FAQs via semantic cache first',
          'Use fast flash models for summarization, chat, and extraction',
          'Reserve heavy reasoning models for debugging, architecture, and multi-doc synthesis',
        ],
        'Track per-feature token spend alongside user value so cost spikes are spotted within minutes rather than on month-end invoices.',
        'typescript',
        'src/ai/modelRouter.ts',
        `export type TaskComplexity = 'simple' | 'complex' | 'deep_debug';

export function selectModelTier(task: TaskComplexity): string {
  if (task === 'deep_debug') return 'gemini-4-carbon';
  if (task === 'complex') return 'gemini-4-neon';
  return 'gemini-4-hydrogen';
}`,
        [
          {
            q: 'What is the main benefit of model tier routing?',
            opts: [
              'Optimal balance of speed, cost, and reasoning depth per request',
              'Forcing every request to take 30 seconds',
              'Disabling streaming',
              'Removing authentication',
            ],
            ans: 0,
            exp: 'Routing simple tasks to fast models slashes latency and spend without sacrificing quality.',
          },
          {
            q: 'When should semantic caching return a cached response?',
            opts: [
              'For high-frequency, non-personalized documentation questions',
              'For private user account balances',
              'For random number generation',
              'For live stock tickers',
            ],
            ans: 0,
            exp: 'Static shared queries benefit hugely from caching; private user data must stay isolated.',
          },
          {
            q: 'Which metric helps catch runaway AI spend early?',
            opts: [
              'Tokens per request and cost per feature endpoint',
              'Monitor screen brightness',
              'CSS file count',
              'Mouse hover speed',
            ],
            ans: 0,
            exp: 'Per-endpoint token telemetry identifies regressions right away.',
          },
        ]
      ),
      buildLesson(
        'ai',
        12,
        'Optimization & Scale',
        'Observability, Tracing & Fallback Resilience',
        '34 min',
        'Instrument end-to-end spans across retrieval, reranking, and model calls with graceful fallbacks.',
        'When an AI response feels slow or wrong, trace spans reveal whether time was spent in vector search, model prefill, or tool execution.',
        [
          'Assign a unique correlation traceId to every AI conversation turn',
          'Log latency breakdown: retrievalMs, modelTtftMs, totalMs, and token counts',
          'Implement exponential backoff retries for transient 429/503 upstream errors',
        ],
        'Never swallow errors silently—surface clean user-friendly recovery actions while preserving full server diagnostics.',
        'typescript',
        'src/ai/traceSpan.ts',
        `export interface AiTurnTrace {
  traceId: string;
  retrievalMs: number;
  modelMs: number;
  status: 'ok' | 'retry_exhausted';
}

export function totalTurnLatency(trace: AiTurnTrace): number {
  return trace.retrievalMs + trace.modelMs;
}`,
        [
          {
            q: 'Why trace retrieval latency separately from LLM generation latency?',
            opts: [
              'To pinpoint whether bottlenecks come from database search or model inference',
              'To double CPU load',
              'To disable caching',
              'To hide HTTP status codes',
            ],
            ans: 0,
            exp: 'Separate span timings isolate exact performance bottlenecks.',
          },
          {
            q: 'How should transient 429 rate-limit responses from upstream AI APIs be handled?',
            opts: [
              'Retry briefly with exponential backoff and jitter, respecting Retry-After',
              'Loop infinitely with zero delay',
              'Crash the whole Express process',
              'Expose the API key in the UI',
            ],
            ans: 0,
            exp: 'Bounded backoff handles temporary congestion cleanly.',
          },
          {
            q: 'What does TTFT stand for in streaming AI observability?',
            opts: [
              'Time To First Token',
              'Total Transfer File Table',
              'Token Tree Format Type',
              'Transport Tunnel Failover Test',
            ],
            ans: 0,
            exp: 'Time To First Token measures how quickly the user starts seeing output.',
          },
        ]
      ),
    ],
  },
  {
    slug: 'backend-engineering',
    title: 'Distributed APIs, Databases & High-Throughput Systems',
    subtitle: 'Master relational indexing, caching, rate limiting, message queues, and resilient API architecture.',
    category: 'Backend Engineering',
    level: 'Intermediate',
    duration: '15h 10m',
    instructor: 'Devon Brooks',
    instructorRole: 'Staff Infrastructure Engineer',
    coverImage: '/src/assets/images/course_cloud_systems_1795343841022.jpg',
    accentFrom: '#3b82f6',
    accentTo: '#8b5cf6',
    rating: 4.8,
    studentsCount: 5190,
    outcomes: [
      'Design idempotent REST APIs with cursor pagination and validation',
      'Optimize B-Tree indexes and eliminate N+1 database bottlenecks',
      'Implement token-bucket rate limiters and distributed locks',
      'Build reliable async job queues with dead-letter recovery',
    ],
    lessons: [
      buildLesson(
        'backend',
        1,
        'API Design & Contracts',
        'REST Semantics, Validation & Status Codes',
        '30 min',
        'Build predictable HTTP APIs with strict input validation, structured error envelopes, and proper status codes.',
        'Consistent API contracts let frontend, mobile, and partner consumers integrate without guesswork. Validate every request body, query param, and path param at the route boundary.',
        [
          'Return 201 Created on resource creation, 400/422 on validation errors, 401 vs 403 accurately',
          'Never leak raw SQL stack traces in 500 error responses',
          'Normalize error payloads into { code, message, details }',
        ],
        'Distinguish 401 Unauthorized (missing/invalid credentials) from 403 Forbidden (authenticated user lacks permission).',
        'typescript',
        'src/api/validate.ts',
        `export function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}`,
        [
          {
            q: 'Which HTTP status code distinguishes "authenticated but lacking permission" from "not signed in"?',
            opts: ['400', '401', '403', '404'],
            ans: 2,
            exp: '403 Forbidden means identity is known but lacks authorization; 401 means unauthenticated.',
          },
          {
            q: 'Why must raw database error stack traces never be returned to API clients?',
            opts: [
              'They expose internal schema, table names, and paths to attackers',
              'JSON cannot hold strings',
              'Browsers crash on 500 codes',
              'They slow down CSS rendering',
            ],
            ans: 0,
            exp: 'Log details server-side and return safe, generic messages to clients.',
          },
          {
            q: 'Where should input validation happen?',
            opts: [
              'Only in React forms',
              'Strictly on the server (in addition to helpful client UX checks)',
              'Only in database triggers',
              'Nowhere',
            ],
            ans: 1,
            exp: 'Anyone can bypass client JS via curl; server validation is mandatory.',
          },
        ]
      ),
      buildLesson(
        'backend',
        2,
        'API Design & Contracts',
        'Cursor Pagination vs Offset Pagination',
        '28 min',
        'Prevent duplicate rows and slow deep-page scans by switching high-volume feeds to keyset cursor pagination.',
        'OFFSET 50000 forces the database to scan and discard 50,000 rows on every request, and concurrent inserts cause items to shift across pages.',
        [
          'Use keyset cursors (WHERE (created_at, id) < (?, ?)) for constant-time paging',
          'Always include a unique tie-breaker column like id alongside timestamps',
          'Fetch limit + 1 rows to know cheaply whether hasNextPage is true',
        ],
        'Offset pagination remains convenient for small admin tables with jump-to-page UIs, while infinite feeds and APIs should default to cursors.',
        'sql',
        'queries/cursor_feed.sql',
        `SELECT id, title, created_at
FROM courses
WHERE (created_at, id) < (:cursorDate, :cursorId)
ORDER BY created_at DESC, id DESC
LIMIT 21;`,
        [
          {
            q: 'Why does OFFSET 100000 become slow in relational databases?',
            opts: [
              'The engine must still walk and discard 100,000 index entries before returning rows',
              'SQL forbids numbers above 1000',
              'Network cables drop packets',
              'UTF-8 breaks',
            ],
            ans: 0,
            exp: 'Keyset cursors jump directly to the starting index entry in O(log N).',
          },
          {
            q: 'Why include id as a tie-breaker in cursor pagination?',
            opts: [
              'Two rows with identical timestamps would otherwise be skipped or duplicated',
              'To sort alphabetically by title',
              'To encrypt the cursor',
              'To disable indexes',
            ],
            ans: 0,
            exp: 'Combining timestamp + unique ID creates a strict total ordering.',
          },
          {
            q: 'Why query limit + 1 rows in cursor pagination?',
            opts: [
              'To detect if another page exists without running a separate COUNT(*) query',
              'To waste RAM',
              'Because SQL arrays are 1-indexed',
              'To bypass auth',
            ],
            ans: 0,
            exp: 'Fetching one extra row avoids expensive full-table counts.',
          },
        ]
      ),
      buildLesson(
        'backend',
        3,
        'Relational Databases',
        'B-Tree Indexes & Query Plans (EXPLAIN)',
        '36 min',
        'Read query execution plans and design composite indexes that keep P99 latency under 10ms.',
        'An unindexed foreign key turns a 1ms index seek into a full sequential table scan that degrades linearly as your user base grows.',
        [
          'Order composite index columns with equality predicates first, range predicates second',
          'Inspect EXPLAIN ANALYZE to catch unexpected Seq Scans on large tables',
          'Avoid wrapping indexed columns in functions like LOWER(email) unless indexed on that expression',
        ],
        'Every extra index speeds up reads slightly at the expense of write amplification on INSERT/UPDATE—index deliberately based on real query patterns.',
        'sql',
        'queries/explain_index.sql',
        `CREATE INDEX idx_enrollments_user_course
ON enrollments(user_id, course_slug);

EXPLAIN QUERY PLAN
SELECT course_slug, enrolled_at
FROM enrollments
WHERE user_id = 42;`,
        [
          {
            q: 'What happens to query performance if you filter with WHERE LOWER(email) = ? on a standard index of email?',
            opts: [
              'The index cannot be used unless an expression index or normalized lowercase column is used',
              'It runs 10x faster automatically',
              'It deletes the table',
              'It upgrades SQLite to Postgres',
            ],
            ans: 0,
            exp: 'Wrapping an indexed column in a function breaks standard B-Tree ordering.',
          },
          {
            q: 'In a composite index (A, B), which column order helps WHERE status = ? AND created_at > ? ?',
            opts: ['(created_at, status)', '(status, created_at)', 'Neither works', 'Only primary keys'],
            ans: 1,
            exp: 'Equality columns first narrow the B-Tree range before scanning the inequality range.',
          },
          {
            q: 'What is the trade-off of adding 15 indexes to a write-heavy table?',
            opts: [
              'Faster writes',
              'Slower INSERT/UPDATE/DELETE operations and larger disk footprint',
              'Zero disk usage',
              'Broken HTTP headers',
            ],
            ans: 1,
            exp: 'Every index must be updated synchronously on row modifications.',
          },
        ]
      ),
      buildLesson(
        'backend',
        4,
        'Relational Databases',
        'Transactions, Isolation & Race Conditions',
        '38 min',
        'Prevent double-spending, duplicate enrollments, and lost updates using ACID transactions and atomic constraints.',
        'Checking a balance in JavaScript (`if (balance >= 10)`), waiting 5ms, and running `UPDATE` creates a classic TOCTOU (Time-of-Check to Time-of-Use) race condition under concurrent traffic.',
        [
          'Move invariant checks into atomic SQL updates (`WHERE balance >= ?`) or SERIALIZABLE transactions',
          'Back uniqueness invariants with database UNIQUE constraints, never app-level checks alone',
          'Keep transactions short—never hold a DB transaction open while calling an external HTTP API',
        ],
        'Always treat database constraint violations (e.g. SQLITE_CONSTRAINT_UNIQUE) gracefully as 409 Conflict responses.',
        'sql',
        'queries/atomic_xp.sql',
        `BEGIN IMMEDIATE;
INSERT OR IGNORE INTO lesson_progress (user_id, course_slug, lesson_id, completed_at)
VALUES (:userId, :slug, :lessonId, :now);
UPDATE users SET xp = xp + 50 WHERE id = :userId AND changes() > 0;
COMMIT;`,
        [
          {
            q: 'Why is checking "does email exist?" in JS before INSERT insufficient under concurrency?',
            opts: [
              'Two concurrent requests can both pass the check before either inserts',
              'JavaScript strings are immutable',
              'SQLite ignores WHERE clauses',
              'TLS blocks duplicate emails',
            ],
            ans: 0,
            exp: 'A database UNIQUE constraint guarantees atomicity across concurrent requests.',
          },
          {
            q: 'Why should external HTTP calls never run inside an open database transaction?',
            opts: [
              'Slow external APIs hold DB locks/connections hostage, causing pool exhaustion',
              'HTTP forbids JSON inside transactions',
              'SQL crashes on HTTPS',
              'It makes queries too fast',
            ],
            ans: 0,
            exp: 'Keep transactions strictly scoped to local DB reads/writes.',
          },
          {
            q: 'What does changes() > 0 prevent in an atomic XP reward update?',
            opts: [
              'Awarding XP twice if the lesson was already marked complete',
              'Saving the database file',
              'Using React Router',
              'Hashing passwords',
            ],
            ans: 0,
            exp: 'Checking rows inserted ensures idempotent XP awarding.',
          },
        ]
      ),
      buildLesson(
        'backend',
        5,
        'Caching & Rate Limiting',
        'Cache-Aside Patterns & Stampede Protection',
        '32 min',
        'Cut database load by 90% using TTL caching, explicit invalidation, and singleflight request coalescing.',
        'When a hot cache key expires under 5,000 requests/second, every worker misses simultaneously and hammers the database—a cache stampede.',
        [
          'Coalesce concurrent misses for the same key with an in-flight promise map (singleflight)',
          'Add random TTL jitter so seeded cache keys do not expire simultaneously',
          'Never cache private user records under shared public keys',
        ],
        'Prefer short TTLs + event-driven invalidation on mutations over stale multi-hour caches for user-visible data.',
        'typescript',
        'src/cache/singleflight.ts',
        `const inFlight = new Map<string, Promise<unknown>>();

export async function coalesce<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const promise = loader().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}`,
        [
          {
            q: 'What does singleflight request coalescing solve?',
            opts: [
              'Prevents duplicate simultaneous origin queries when a hot cache key misses',
              'Compresses PNG files',
              'Encrypts JWT cookies',
              'Renders 3D models',
            ],
            ans: 0,
            exp: 'Concurrent callers await the same in-flight loader promise.',
          },
          {
            q: 'Why add jitter to cache TTL durations?',
            opts: [
              'To stagger expirations and avoid synchronized load spikes',
              'To invalidate keys immediately',
              'To double memory usage',
              'To bypass CORS',
            ],
            ans: 0,
            exp: 'Jitter spreads cache refreshes smoothly over time.',
          },
          {
            q: 'What critical bug happens if user-specific data is cached under a key lacking userId?',
            opts: [
              'Cross-user data leakage where User B sees User A’s private response',
              'Faster CSS transitions',
              'Better SQL indexing',
              'Smaller HTML size',
            ],
            ans: 0,
            exp: 'Personalized cache keys must always scope by user/tenant identity.',
          },
        ]
      ),
      buildLesson(
        'backend',
        6,
        'Caching & Rate Limiting',
        'Token Bucket & Sliding Window Rate Limiters',
        '31 min',
        'Protect authentication, AI, and export endpoints against brute force and burst abuse.',
        'Fixed-window counters allow 2x bursts right across minute boundaries. Token buckets and sliding-window logs smooth traffic gracefully while supporting legitimate short bursts.',
        [
          'Apply strict limits on /signin, /signup, and expensive AI/export routes',
          'Return 429 Too Many Requests with standard Retry-After headers',
          'Key limits by IP for unauthenticated routes and userId for authenticated routes',
        ],
        'Behind reverse proxies like Cloud Run or Nginx, always read the trusted X-Forwarded-For boundary rather than raw socket IP.',
        'typescript',
        'src/middleware/rateLimit.ts',
        `export interface Bucket {
  tokens: number;
  lastRefillMs: number;
}

export function consumeToken(bucket: Bucket, capacity: number, refillPerSec: number): boolean {
  const now = Date.now();
  const elapsedSec = (now - bucket.lastRefillMs) / 1000;
  bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSec * refillPerSec);
  bucket.lastRefillMs = now;
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}`,
        [
          {
            q: 'Which HTTP status code indicates rate limiting?',
            opts: ['404', '429', '502', '301'],
            ans: 1,
            exp: '429 Too Many Requests signals clients to back off.',
          },
          {
            q: 'What flaw does a naive fixed-minute counter have?',
            opts: [
              'Clients can send 2x the limit right around :59 and :01 across the window boundary',
              'It blocks all traffic forever',
              'It hashes passwords',
              'It deletes SQLite rows',
            ],
            ans: 0,
            exp: 'Sliding windows or token buckets prevent boundary burst doubling.',
          },
          {
            q: 'Which endpoints need the tightest rate limits?',
            opts: [
              'Static CSS files',
              'Login, signup, password reset, and costly AI/export endpoints',
              'Favicon requests',
              'Health checks',
            ],
            ans: 1,
            exp: 'Auth and compute-heavy routes are primary targets for brute force and abuse.',
          },
        ]
      ),
      buildLesson(
        'backend',
        7,
        'Auth & Security',
        'Password Hashing with Bcrypt & Timing Safety',
        '33 min',
        'Hash passwords irreversibly with adaptive work factors and verify credentials safely.',
        'Fast hashes like SHA-256 can be brute-forced at billions of guesses per second on GPUs. Adaptive KDFs like bcrypt and Argon2 intentionally consume memory/CPU per hash.',
        [
          'Never store plaintext passwords or unsalted MD5/SHA hashes',
          'Use bcrypt cost factor >= 10 (or Argon2id) with automatic per-user random salts',
          'Return identical generic error messages on invalid email vs wrong password',
        ],
        'Returning "Email not found" vs "Wrong password" lets attackers enumerate registered user accounts silently.',
        'typescript',
        'src/auth/password.ts',
        `import bcrypt from 'bcryptjs';

export async function hashUserPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyUserPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}`,
        [
          {
            q: 'Why is SHA-256 unsuitable for password hashing?',
            opts: [
              'It is designed to be ultra-fast, allowing GPUs to brute-force billions of passwords/sec',
              'It only hashes numbers',
              'It cannot run in Node.js',
              'It outputs images',
            ],
            ans: 0,
            exp: 'Passwords need slow, adaptive work-factor algorithms like bcrypt or Argon2.',
          },
          {
            q: 'Why return the exact same message for "email not found" and "wrong password"?',
            opts: [
              'To prevent account enumeration attacks',
              'To save 4 bytes of JSON',
              'To disable cookies',
              'To crash bots',
            ],
            ans: 0,
            exp: 'Uniform login failures hide which emails exist in the database.',
          },
          {
            q: 'Does bcrypt generate a unique salt automatically per password?',
            opts: [
              'Yes, embedded inside the output hash string',
              'No, you must share one static salt across all users',
              'Only on Windows',
              'Only if cost is 0',
            ],
            ans: 0,
            exp: 'Per-user random salts neutralize precomputed rainbow tables.',
          },
        ]
      ),
      buildLesson(
        'backend',
        8,
        'Auth & Security',
        'Stateless JWTs, HttpOnly Cookies & RBAC',
        '35 min',
        'Sign session tokens securely, store them in HttpOnly cookies, and enforce server-side role checks.',
        'Client-side UI hiding does not protect an admin panel. Every privileged route must independently verify the signed session token and look up authoritative role state on the server.',
        [
          'Sign JWTs with strong server secrets and short expiration windows',
          'Set HttpOnly, Secure, SameSite attributes on session cookies so XSS cannot read tokens',
          'Verify role/ownership in server middleware before returning any protected data',
        ],
        'When cookies are used inside cross-origin preview iframes, pair SameSite=None; Secure; Partitioned with Origin/Host or custom header CSRF checks.',
        'typescript',
        'src/auth/rbac.ts',
        `export function isAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === 'admin@example.com';
}`,
        [
          {
            q: 'Why store session tokens in HttpOnly cookies rather than localStorage?',
            opts: [
              'JavaScript cannot read HttpOnly cookies, protecting sessions if an XSS bug occurs',
              'Cookies hold 500MB of data',
              'localStorage does not work in Chrome',
              'HttpOnly disables TLS',
            ],
            ans: 0,
            exp: 'HttpOnly blocks client script exfiltration of session credentials.',
          },
          {
            q: 'Why is hiding an Admin link in React insufficient for security?',
            opts: [
              'Anyone can inspect client bundles or call /api/admin endpoints directly with curl',
              'React deletes links automatically',
              'CSS hides server logs',
              'Browsers ignore hrefs',
            ],
            ans: 0,
            exp: 'Authorization must always be enforced on the backend API.',
          },
          {
            q: 'What does RBAC stand for?',
            opts: [
              'Role-Based Access Control',
              'Random Binary Array Cache',
              'Relational Backup Auto Commit',
              'Remote Browser Async Call',
            ],
            ans: 0,
            exp: 'RBAC maps user roles cleanly to permitted actions and resources.',
          },
        ]
      ),
      buildLesson(
        'backend',
        9,
        'Async Architecture',
        'Background Job Queues & Dead-Letter Handling',
        '34 min',
        'Decouple slow tasks—CSV/ZIP exports, video transcoding, email digests—from synchronous HTTP request threads.',
        'Blocking an HTTP request thread for 45 seconds causes load-balancer 504 timeouts and starves concurrent users. Enqueue slow work onto durable worker queues.',
        [
          'Design workers to be idempotent so retries after crashes remain safe',
          'Move poison jobs into a Dead-Letter Queue (DLQ) after max attempts',
          'Stream large ZIP/CSV exports directly to response sockets without buffering entire files in RAM',
        ],
        'Streaming with Node.js streams or archiver keeps server memory flat (~30MB) even when exporting hundreds of megabytes.',
        'typescript',
        'src/jobs/queuePolicy.ts',
        `export interface JobState {
  id: string;
  attempts: number;
  maxAttempts: number;
}

export function shouldDeadLetter(job: JobState): boolean {
  return job.attempts >= job.maxAttempts;
}`,
        [
          {
            q: 'Why stream large ZIP or CSV exports rather than building huge buffers in memory?',
            opts: [
              'Streaming keeps RAM usage constant and avoids out-of-memory crashes under concurrent downloads',
              'Buffers cannot store text',
              'ZIP files require CSS',
              'HTTP forbids buffers',
            ],
            ans: 0,
            exp: 'Streaming writes chunks incrementally to the socket.',
          },
          {
            q: 'What is a Dead-Letter Queue (DLQ) used for?',
            opts: [
              'Isolating repeatedly failing jobs for inspection without blocking healthy queue items',
              'Deleting user passwords',
              'Rendering charts',
              'Minifying JS',
            ],
            ans: 0,
            exp: 'DLQs prevent poison messages from infinitely blocking worker throughput.',
          },
          {
            q: 'Why must background job handlers be idempotent?',
            opts: [
              'At-least-once delivery queues can deliver the same job more than once',
              'Workers run only once a year',
              'SQLite lacks strings',
              'To skip error handling',
            ],
            ans: 0,
            exp: 'Idempotent handlers produce the same outcome even on duplicate execution.',
          },
        ]
      ),
      buildLesson(
        'backend',
        10,
        'Async Architecture',
        'Structured Logging, Metrics & Health Checks',
        '29 min',
        'Emit machine-readable JSON logs, RED metrics, and liveness/readiness probes for reliable operations.',
        'Unstructured `console.log("error")` strings are unsearchable during an outage. Structured JSON logs with request IDs let engineers correlate failures across services in seconds.',
        [
          'Emit structured JSON logs with timestamp, level, requestId, route, and durationMs',
          'Track RED metrics: Rate, Errors, Duration (P50/P95/P99)',
          'Expose /healthz checking actual database connectivity, not just static 200 OK',
        ],
        'Never log Authorization headers, cookies, passwords, or raw API keys in structured logs.',
        'typescript',
        'src/obs/logger.ts',
        `export function logEvent(level: 'info' | 'warn' | 'error', event: string, meta: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, event, ...meta }));
}`,
        [
          {
            q: 'What do the RED observability metrics represent?',
            opts: [
              'Rate, Errors, Duration',
              'Read, Execute, Delete',
              'Render, Encode, Decode',
              'Routes, Endpoints, Databases',
            ],
            ans: 0,
            exp: 'RED summarizes service health from the perspective of incoming requests.',
          },
          {
            q: 'Why check P95/P99 latency instead of only average latency?',
            opts: [
              'Averages hide tail latency spikes affecting your busiest power users',
              'P99 is always smaller than average',
              'SQLite deletes averages',
              'Averages require GPUs',
            ],
            ans: 0,
            exp: 'Tail percentiles expose slow queries hidden by fast cached hits.',
          },
          {
            q: 'What must NEVER appear in application logs?',
            opts: [
              'Request duration in ms',
              'Passwords, session cookies, and private API keys',
              'HTTP method',
              'Route path',
            ],
            ans: 1,
            exp: 'Credential scrubbing protects user and platform secrets.',
          },
        ]
      ),
      buildLesson(
        'backend',
        11,
        'Async Architecture',
        'Graceful Shutdown & Zero-Downtime Deploys',
        '27 min',
        'Handle SIGTERM cleanly, drain in-flight HTTP requests, and close SQLite/DB handles without corrupting state.',
        'Container orchestrators send SIGTERM before killing old instances during deploys. Catching SIGTERM lets you stop accepting new connections while finishing active requests.',
        [
          'Listen for SIGTERM and SIGINT on the Node.js process',
          'Close HTTP server to reject new connections while draining active sockets',
          'Flush and close database connections cleanly before exit(0)',
        ],
        'Set a hard fallback timeout (e.g., 10s) during shutdown so stuck keep-alive sockets never hang deployments past orchestrator grace periods.',
        'typescript',
        'src/server/shutdown.ts',
        `export function registerShutdown(closeFn: () => Promise<void>) {
  for (const sig of ['SIGTERM', 'SIGINT'] as const) {
    process.on(sig, async () => {
      await closeFn();
      process.exit(0);
    });
  }
}`,
        [
          {
            q: 'What signal do Kubernetes and Cloud Run send before terminating a container?',
            opts: ['SIGKILL immediately', 'SIGTERM', 'SIGHUP', 'SIGUSR2'],
            ans: 1,
            exp: 'SIGTERM gives the process a grace period to shut down cleanly.',
          },
          {
            q: 'What happens if a server exits immediately without closing active requests or DB handles?',
            opts: [
              'Clients see 502 Bad Gateway drops and WAL files may require recovery',
              'Requests double in speed',
              'Indexes multiply',
              'Dark mode resets',
            ],
            ans: 0,
            exp: 'Graceful draining finishes active responses cleanly.',
          },
          {
            q: 'Why add a fallback force-exit timer during shutdown?',
            opts: [
              'Idle keep-alive connections might otherwise delay server.close() past the container timeout',
              'To delete logs',
              'To trigger SIGKILL early',
              'To clear localStorage',
            ],
            ans: 0,
            exp: 'A bounded timeout guarantees clean exit before the orchestrator hard-kills.',
          },
        ]
      ),
    ],
  },
  {
    slug: 'cyber-security',
    title: 'Application Security, Threat Modeling & Defensive Ops',
    subtitle: 'Master OWASP defenses, cryptography, XSS/SSRF mitigation, zero-trust auth, and secure code auditing.',
    category: 'Cyber Security',
    level: 'Intermediate',
    duration: '14h 45m',
    instructor: 'Nadia Al-Mansoor',
    instructorRole: 'Principal Security Architect',
    coverImage: '/src/assets/images/course_cyber_security_1795343841490.jpg',
    accentFrom: '#06b6d4',
    accentTo: '#3b82f6',
    rating: 4.9,
    studentsCount: 4410,
    outcomes: [
      'Conduct STRIDE threat modeling on web and API architectures',
      'Eliminate SQL injection, XSS, CSRF, SSRF, and path traversal',
      'Implement secure cryptography, HMAC verification, and key rotation',
      'Configure strict Content Security Policies and audit dependencies',
    ],
    lessons: [
      buildLesson(
        'sec',
        1,
        'Threat Modeling & Foundations',
        'STRIDE Threat Modeling & Trust Boundaries',
        '31 min',
        'Identify entry points, trust boundaries, and attacker capabilities systematically before writing a line of code.',
        'Security is architectural, not an afterthought. Mapping where untrusted browser inputs cross into trusted server logic exposes high-impact weaknesses early.',
        [
          'Enumerate every entry point: REST payloads, URL params, headers, file uploads',
          'Map Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege (STRIDE)',
          'Enforce validation and authorization at every trust boundary crossing',
        ],
        'Never assume hidden UI fields or client-side flags represent a trust boundary—attackers craft raw HTTP requests directly.',
        'typescript',
        'src/security/boundaryCheck.ts',
        `export function assertSafeId(id: string): string {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
    throw new Error('Invalid identifier format');
  }
  return id;
}`,
        [
          {
            q: 'What does the "E" in STRIDE threat modeling stand for?',
            opts: ['Encryption', 'Elevation of Privilege', 'Execution', 'Error Handling'],
            ans: 1,
            exp: 'STRIDE stands for Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation of Privilege.',
          },
          {
            q: 'Where does a trust boundary exist in a typical web app?',
            opts: [
              'Between two React sibling components',
              'Between the browser client and the backend API server',
              'Between CSS rules',
              'Inside a variable name',
            ],
            ans: 1,
            exp: 'Clients are under user control; the backend server is a strict trust boundary.',
          },
          {
            q: 'Why reject unexpected characters in resource IDs early?',
            opts: [
              'Allow-listing valid formats blocks injection and traversal payloads immediately',
              'It makes URLs prettier',
              'It disables HTTPS',
              'It reduces monitor brightness',
            ],
            ans: 0,
            exp: 'Strict format allow-lists neutralize entire classes of parser attacks.',
          },
        ]
      ),
      buildLesson(
        'sec',
        2,
        'Threat Modeling & Foundations',
        'Injection Defenses: SQLi & Command Safety',
        '34 min',
        'Eliminate SQL and OS command injection completely using parameterized queries and argument arrays.',
        'Injection occurs whenever untrusted user strings are concatenated into an interpreter command—whether SQL, shell commands, or dynamic templates.',
        [
          'Always use prepared statements with bound parameters (? or :named)',
          'Never use child_process exec() or spawn({ shell: true }) with user strings',
          'Validate dynamic sort columns against an explicit allow-list map',
        ],
        'Even parameterized queries cannot parameterize a column or table name—use a strict TypeScript Map or switch statement for dynamic ORDER BY clauses.',
        'typescript',
        'src/security/safeSort.ts',
        `const SORT_COLUMNS: Record<string, string> = {
  newest: 'date_joined DESC',
  name: 'name ASC',
  xp: 'xp DESC',
};

export function resolveSortClause(key: string): string {
  return SORT_COLUMNS[key] ?? 'date_joined DESC';
}`,
        [
          {
            q: 'Why can SQL placeholders (?) not be used for ORDER BY column names?',
            opts: [
              'Placeholders bind literal values, not SQL identifiers/keywords',
              'ORDER BY is deprecated',
              'SQLite forbids sorting',
              'Numbers cannot be sorted',
            ],
            ans: 0,
            exp: 'Dynamic sort keys must be mapped through a strict server-side allow-list.',
          },
          {
            q: 'How do prepared statements prevent SQL injection?',
            opts: [
              'By separating query syntax compilation from bound parameter data',
              'By deleting single quotes in the browser',
              'By encrypting the entire hard drive',
              'By turning off HTTP POST',
            ],
            ans: 0,
            exp: 'Bound values are never parsed as executable SQL grammar.',
          },
          {
            q: 'Which Node.js process call is dangerous when passed user input?',
            opts: ['JSON.stringify', 'exec() / spawn with shell: true', 'Math.max', 'path.basename'],
            ans: 1,
            exp: 'Shell invocation interprets metacharacters like ; && | and $().',
          },
        ]
      ),
      buildLesson(
        'sec',
        3,
        'Web & Browser Security',
        'Cross-Site Scripting (XSS) & Safe Rendering',
        '32 min',
        'Prevent DOM and stored XSS using framework auto-escaping, URL scheme validation, and strict CSP headers.',
        'XSS allows attackers to execute arbitrary JavaScript in victims’ browsers—stealing data, hijacking actions, or modifying UI state.',
        [
          'Rely on React’s JSX text binding; avoid dangerouslySetInnerHTML and innerHTML',
          'Validate user-supplied URLs to allow only https: or http: (never javascript: or data:)',
          'Deploy Content-Security-Policy headers blocking inline scripts and untrusted origins',
        ],
        'Notice that `<a href={userWebsite}>` is still an XSS vector if `userWebsite` starts with `javascript:alert(1)`! Always validate URL protocols.',
        'typescript',
        'src/security/safeUrl.ts',
        `export function toSafeHttpUrl(raw: string): string | null {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}`,
        [
          {
            q: 'How can an `<a href={url}>` tag in React still cause XSS?',
            opts: [
              'If url begins with javascript: scheme and is clicked by a user',
              'If url contains https://',
              'React automatically deletes all anchor tags',
              'If CSS uses flexbox',
            ],
            ans: 0,
            exp: 'React does not block javascript: URLs automatically; protocol validation is required.',
          },
          {
            q: 'Why does React JSX `{userInput}` normally prevent XSS?',
            opts: [
              'It escapes HTML special characters as text nodes rather than parsing markup',
              'It runs a virus scanner',
              'It strips all spaces',
              'It hashes the string with bcrypt',
            ],
            ans: 0,
            exp: 'Text nodes never execute as HTML tags or script blocks.',
          },
          {
            q: 'What HTTP response header restricts which script sources a browser may execute?',
            opts: ['Content-Security-Policy', 'Accept-Encoding', 'Cache-Control', 'ETag'],
            ans: 0,
            exp: 'CSP provides a strong defense-in-depth layer against script injection.',
          },
        ]
      ),
      buildLesson(
        'sec',
        4,
        'Web & Browser Security',
        'CSRF Protection, CORS & Cookie Flags',
        '30 min',
        'Configure SameSite cookies, Origin verification, and tight CORS policies without breaking legitimate apps.',
        'Cross-Site Request Forgery tricks an authenticated browser into submitting state-changing requests to your server from another site.',
        [
          'Verify Origin / X-Forwarded-Host or require a custom header on cookie-authenticated mutations',
          'Never combine Access-Control-Allow-Origin: * with Allow-Credentials: true',
          'Use HttpOnly and Secure flags on every authentication cookie',
        ],
        'Browsers block cross-origin JavaScript from adding custom headers like X-Requested-With unless CORS explicitly permits them—making custom header checks a strong CSRF barrier.',
        'typescript',
        'src/security/csrfCheck.ts',
        `export function isTrustedMutationHeader(headerVal: string | undefined): boolean {
  return headerVal === 'LearnTech';
}`,
        [
          {
            q: 'Why is `Access-Control-Allow-Origin: *` dangerous on authenticated endpoints?',
            opts: [
              'Overly permissive CORS policies weaken origin isolation for sensitive API data',
              'It slows down CSS animations',
              'It disables SQLite WAL',
              'It breaks JSON formatting',
            ],
            ans: 0,
            exp: 'Authenticated APIs must restrict allowed origins explicitly.',
          },
          {
            q: 'Why does requiring a custom header (e.g. X-Requested-With) help defeat form-based CSRF?',
            opts: [
              'Plain HTML forms cannot attach custom headers, and cross-site XHR triggers CORS preflight',
              'Custom headers encrypt passwords',
              'Browsers delete cookies automatically',
              'It blocks GET requests',
            ],
            ans: 0,
            exp: 'Cross-origin custom headers require explicit CORS server approval.',
          },
          {
            q: 'Which cookie flag prevents client JavaScript from reading the cookie?',
            opts: ['Max-Age', 'Path', 'HttpOnly', 'Domain'],
            ans: 2,
            exp: 'HttpOnly isolates session cookies from document.cookie access.',
          },
        ]
      ),
      buildLesson(
        'sec',
        5,
        'Server & Infrastructure Security',
        'Path Traversal & Safe File Exports',
        '29 min',
        'Confine file reads and archive exports strictly within intended directories using canonical path verification.',
        'Inputs like `../../etc/passwd` or `..\\\\..\\\\.env` escape naive string joins. Always resolve canonical paths and check directory containment with a trailing separator.',
        [
          'Normalize paths with path.resolve(baseDir, userPath)',
          'Verify resolved.startsWith(path.resolve(baseDir) + path.sep)',
          'Exclude .env, .git, node_modules, and private DB files from source ZIP exports',
        ],
        'Checking `resolved.startsWith(baseDir)` WITHOUT `+ path.sep` is a classic bug: `/app/uploads_secret` matches `/app/uploads`!',
        'typescript',
        'src/security/pathConfinement.ts',
        `import path from 'node:path';

export function resolveInsideDir(baseDir: string, relativeTarget: string): string {
  const safeBase = path.resolve(baseDir);
  const resolved = path.resolve(safeBase, relativeTarget);
  if (!resolved.startsWith(safeBase + path.sep)) {
    throw new Error('Path escapes base directory');
  }
  return resolved;
}`,
        [
          {
            q: 'Why append `path.sep` when checking `resolved.startsWith(baseDir + path.sep)`?',
            opts: [
              'Without the separator, sibling directories sharing a prefix (e.g. /data_private vs /data) falsely pass',
              'To convert Windows paths to URLs',
              'To compress the file',
              'To create a new folder',
            ],
            ans: 0,
            exp: 'The trailing separator enforces strict child directory containment.',
          },
          {
            q: 'What files must be excluded when offering a source-code ZIP download?',
            opts: [
              'Secret .env files, private keys, node_modules, and .next/dist build artifacts',
              'README.md',
              'src/App.tsx',
              'package.json',
            ],
            ans: 0,
            exp: 'Exclude environment secrets and heavy build/dependency folders.',
          },
          {
            q: 'Which Node function resolves `..` segments into an absolute canonical path?',
            opts: ['path.extname', 'path.resolve', 'path.basename', 'path.delimiter'],
            ans: 1,
            exp: 'path.resolve normalizes relative jumps cleanly for boundary checks.',
          },
        ]
      ),
      buildLesson(
        'sec',
        6,
        'Server & Infrastructure Security',
        'SSRF Mitigation & Outbound Allow-Lists',
        '33 min',
        'Stop attackers from pivoting backend servers into internal cloud metadata services or private VPCs.',
        'Server-Side Request Forgery happens when a backend fetches a user-supplied URL—such as a webhook or avatar importer—allowing attackers to probe `169.254.169.254` or `127.0.0.1`.',
        [
          'Restrict outbound URL schemes strictly to https: (or http: if required)',
          'Block loopback, link-local metadata (169.254.169.254), and RFC1918 private IPs',
          'Re-validate resolved IP addresses and disable automatic HTTP redirects to private hosts',
        ],
        'Checking hostname strings alone fails against DNS rebinding or IPv6-mapped IPv4 addresses (`[::ffff:127.0.0.1]`).',
        'typescript',
        'src/security/ssrfGuard.ts',
        `const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', '[::1]']);

export function isAllowedPublicUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (BLOCKED_HOSTS.has(host)) return false;
    if (host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('169.254.')) return false;
    return true;
  } catch {
    return false;
  }
}`,
        [
          {
            q: 'Why do SSRF attackers target 169.254.169.254 on cloud instances?',
            opts: [
              'It hosts cloud instance metadata and temporary IAM credentials',
              'It serves Google Fonts',
              'It hosts public npm packages',
              'It resets CSS themes',
            ],
            ans: 0,
            exp: 'Cloud metadata endpoints expose internal identity tokens if reachable via SSRF.',
          },
          {
            q: 'Why disable blind HTTP redirects on outbound user-supplied fetches?',
            opts: [
              'A public URL could 302-redirect the server to http://127.0.0.1/admin',
              'Redirects break UTF-8',
              'HTTP 302 is deprecated',
              'It slows down SQLite',
            ],
            ans: 0,
            exp: 'Redirects bypass initial URL checks unless re-validated per hop.',
          },
          {
            q: 'Which scheme should public webhook URLs be restricted to?',
            opts: ['file://', 'gopher://', 'https://', 'javascript:'],
            ans: 2,
            exp: 'Restricting to https:// blocks local file reads and legacy protocol smuggling.',
          },
        ]
      ),
      buildLesson(
        'sec',
        7,
        'Cryptography & Identity',
        'Symmetric Encryption, HMAC & Key Rotation',
        '36 min',
        'Choose AES-256-GCM for authenticated encryption, HMAC-SHA256 for webhook signatures, and support zero-downtime key rotation.',
        'Never invent custom cryptography or use unauthenticated AES-ECB/CBC without an integrity MAC. Authenticated encryption (AEAD) like AES-256-GCM guarantees both confidentiality and tamper detection.',
        [
          'Use unique random 96-bit nonces/IVs for every AES-GCM encryption',
          'Verify webhook HMAC signatures with crypto.timingSafeEqual',
          'Tag ciphertexts with a keyVersion ID to rotate keys without breaking old data',
        ],
        'String equality (`===`) leaks signature bytes via timing side-channels; always use constant-time comparison.',
        'typescript',
        'src/security/hmacVerify.ts',
        `import crypto from 'node:crypto';

export function verifyWebhookSignature(payload: string, sigHex: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(sigHex, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}`,
        [
          {
            q: 'Why use `crypto.timingSafeEqual` instead of `===` for HMAC verification?',
            opts: [
              'Standard string comparison exits early on the first mismatched byte, leaking timing side-channels',
              '=== cannot compare strings',
              'timingSafeEqual compresses buffers',
              'It hashes passwords faster',
            ],
            ans: 0,
            exp: 'Constant-time comparison takes identical CPU time regardless of mismatch position.',
          },
          {
            q: 'What does AEAD (like AES-256-GCM) provide beyond plain encryption?',
            opts: [
              'Built-in authentication/integrity verification detecting ciphertext tampering',
              'Automatic password resets',
              'SQLite table creation',
              'CSS minification',
            ],
            ans: 0,
            exp: 'AEAD fails cleanly if even a single bit of ciphertext or AAD was modified.',
          },
          {
            q: 'Why include a key ID prefix on stored encrypted blobs?',
            opts: [
              'To rotate to new keys seamlessly while still decrypting older records',
              'To publish the secret key',
              'To shorten base64 strings',
              'To disable IVs',
            ],
            ans: 0,
            exp: 'Key versioning enables seamless cryptographic rotation.',
          },
        ]
      ),
      buildLesson(
        'sec',
        8,
        'Cryptography & Identity',
        'Broken Object Level Authorization (BOLA / IDOR)',
        '31 min',
        'Stop horizontal privilege escalation by scoping every database query to the authenticated user’s identity.',
        'BOLA (OWASP API #1) occurs when `/api/invoices/1042` checks that the caller is logged in, but forgets to check whether invoice 1042 actually belongs to that caller.',
        [
          'Include `AND user_id = ?` inside every SELECT, UPDATE, and DELETE on user-owned records',
          'Use non-enumerable UUIDs where appropriate, but never rely on UUIDs instead of ownership checks',
          'Write automated integration tests attempting cross-user reads and mutations',
        ],
        'Even "unlisted" UUIDs leak in browser histories, referrer headers, and support screenshots—authorization checks are always mandatory.',
        'sql',
        'queries/owned_resource.sql',
        `SELECT id, course_slug, completed_at
FROM lesson_progress
WHERE id = :progressId AND user_id = :authenticatedUserId;`,
        [
          {
            q: 'What is Broken Object Level Authorization (BOLA/IDOR)?',
            opts: [
              'An authenticated user accessing or modifying another user’s resource by changing its ID',
              'A syntax error in JSON',
              'A missing CSS media query',
              'A slow SQLite index',
            ],
            ans: 0,
            exp: 'BOLA happens when authentication passes, but resource ownership is never verified.',
          },
          {
            q: 'Do random UUIDv4 IDs eliminate the need for ownership checks?',
            opts: [
              'No—UUIDs are identifiers, not secrets; server ownership checks remain mandatory',
              'Yes, UUIDs cannot be guessed or leaked',
              'Only on POST routes',
              'Only in SQLite',
            ],
            ans: 0,
            exp: 'Authorization must never rely on obscurity of an identifier.',
          },
          {
            q: 'How do you enforce ownership cleanly in SQL?',
            opts: [
              'Filter by BOTH resource ID and authenticated user_id in the WHERE clause',
              'Fetch all rows and filter in CSS',
              'Disable DELETE endpoints',
              'Trust a userId sent in request body without session comparison',
            ],
            ans: 0,
            exp: 'Scoping queries by authenticated session user_id prevents cross-tenant leaks.',
          },
        ]
      ),
      buildLesson(
        'sec',
        9,
        'Security Operations',
        'Supply Chain & Dependency Auditing',
        '28 min',
        'Lock dependencies, verify transitive packages, and detect vulnerable libraries in CI pipelines.',
        'Modern applications depend on hundreds of transitive npm packages. Unpinned floating ranges or ignored vulnerability advisories expose servers to supply-chain compromise.',
        [
          'Commit lockfiles (`package-lock.json` / `bun.lock`) and install with deterministic flags in CI',
          'Run `npm audit` / `bun audit` regularly and upgrade flagged packages cleanly',
          'Minimize dependency bloat—avoid installing a package for a 10-line helper',
        ],
        'Review install scripts (`postinstall`) when adding unfamiliar packages and prefer actively maintained libraries with strong provenance.',
        'json',
        'package.audit.json',
        `{
  "policy": "fail-on-high-critical",
  "lockfileRequired": true,
  "excludedFromBundle": [".env", "learntech.db"]
}`,
        [
          {
            q: 'Why commit lockfiles to source control?',
            opts: [
              'To ensure identical, reproducible dependency versions across dev, CI, and production',
              'To store user passwords',
              'To speed up CSS animations',
              'To replace TypeScript',
            ],
            ans: 0,
            exp: 'Lockfiles pin exact resolved versions and integrity hashes.',
          },
          {
            q: 'What is a transitive dependency?',
            opts: [
              'A package pulled in indirectly by one of your direct dependencies',
              'A React state hook',
              'An expired JWT',
              'A SQLite view',
            ],
            ans: 0,
            exp: 'Security audits inspect both direct and transitive dependencies.',
          },
          {
            q: 'Why minimize unnecessary npm dependencies?',
            opts: [
              'Smaller attack surface, faster builds, and fewer supply-chain risks',
              'TypeScript forbids > 5 packages',
              'Browsers charge per import',
              'It disables CORS',
            ],
            ans: 0,
            exp: 'Every dependency carries maintenance and security responsibility.',
          },
        ]
      ),
      buildLesson(
        'sec',
        10,
        'Security Operations',
        'Zero-Trust Architecture & Principle of Least Privilege',
        '30 min',
        'Eliminate implicit network trust and scope every service credential, DB role, and admin action narrowly.',
        'Zero-trust assumes the perimeter can be breached. Services authenticate every call, secrets are tightly scoped per environment, and admin actions are explicitly audited.',
        [
          'Never reuse production secrets or database credentials in development/staging',
          'Grant database users only the specific CRUD permissions required (no SUPERUSER for app servers)',
          'Verify admin email/role claims dynamically from authoritative DB records on every request',
        ],
        'Checking the database for current user role guarantees that demoted or revoked accounts lose admin privileges immediately—without waiting for a JWT to expire.',
        'typescript',
        'src/security/adminGuard.ts',
        `export function verifyAdminAccess(dbUser: { email: string; role: string } | undefined): boolean {
  if (!dbUser) return false;
  return dbUser.email.toLowerCase() === 'admin@example.com' && dbUser.role === 'admin';
}`,
        [
          {
            q: 'Why re-verify admin status against the database in addition to the JWT?',
            opts: [
              'So revoked privileges take effect immediately instead of waiting for token expiry',
              'JWTs cannot store strings',
              'Databases require extra clicks',
              'To slow down responses',
            ],
            ans: 0,
            exp: 'DB-backed verification closes the revocation window cleanly.',
          },
          {
            q: 'What does Principle of Least Privilege mean?',
            opts: [
              'Grant each user and service only the minimum permissions needed for its job',
              'Give every service root access',
              'Disable authentication internally',
              'Share one admin password',
            ],
            ans: 0,
            exp: 'Scoped permissions contain blast radius if any component is compromised.',
          },
          {
            q: 'Should staging and production share the same signing secrets?',
            opts: [
              'Never—separate keys isolate blast radius between environments',
              'Yes, it saves time',
              'Only for SQLite',
              'Only on weekends',
            ],
            ans: 0,
            exp: 'Environment isolation prevents a dev leak from compromising production.',
          },
        ]
      ),
      buildLesson(
        'sec',
        11,
        'Security Operations',
        'Incident Response & Security Code Auditing',
        '32 min',
        'Triage vulnerabilities systematically, rotate compromised credentials, and run pre-release security checklists.',
        'When an issue is discovered, disciplined triage isolates the root cause, patches the entry point, rotates exposed tokens, and adds a regression test so the flaw never returns.',
        [
          'Audit auth, SQL parameterization, path confinement, and XSS sinks before every release',
          'Maintain an inventory of secrets so rotation takes minutes, not days',
          'Write negative security tests verifying 401/403 responses for unauthorized callers',
        ],
        'Automated regression tests for authorization boundaries catch accidental middleware removals during future refactors.',
        'typescript',
        'src/security/auditChecklist.ts',
        `export interface SecurityControl {
  control: string;
  verified: boolean;
}

export function allControlsPassing(controls: SecurityControl[]): boolean {
  return controls.length > 0 && controls.every((c) => c.verified);
}`,
        [
          {
            q: 'What should you test in automated authorization integration tests?',
            opts: [
              'Both happy-path 200 responses AND negative 401/403 responses for unauthorized users',
              'Only 200 OK happy paths',
              'Only CSS colors',
              'Only font sizes',
            ],
            ans: 0,
            exp: 'Negative tests catch broken guards if middleware is accidentally removed.',
          },
          {
            q: 'What is the immediate priority if a secret key is accidentally exposed?',
            opts: [
              'Revoke and rotate the secret immediately, then audit access logs',
              'Rename the variable in Git only',
              'Ignore it',
              'Delete the README',
            ],
            ans: 0,
            exp: 'Git history preserves old commits; rotation invalidates the leaked credential.',
          },
          {
            q: 'Why run security checklists before merging features?',
            opts: [
              'Catching flaws before deploy costs a fraction of post-incident remediation',
              'To delay releases arbitrarily',
              'To disable TypeScript',
              'To avoid unit tests',
            ],
            ans: 0,
            exp: 'Shift-left reviews embed security into normal engineering cadence.',
          },
        ]
      ),
    ],
  },
];
