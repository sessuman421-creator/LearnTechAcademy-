export type CourseCategory =
  | 'App Development'
  | 'AI Engineering'
  | 'Backend Engineering'
  | 'Cyber Security'
  | 'Data Science'
  | 'UI/UX Design'
  | 'Cloud Engineering'
  | 'Frontend Development';

export type SubscriptionPlan = 'free' | 'pro' | 'team';
export type CurrencyCode = 'GHS' | 'NGN';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  number: number;
  title: string;
  moduleTitle: string;
  duration: string;
  xpReward: number;
  summary: string;
  notes: {
    heading: string;
    body: string;
    keyPoints?: string[];
  }[];
  codeExample: {
    language: string;
    filename: string;
    code: string;
  };
  quiz: QuizQuestion[];
}

export interface Course {
  slug: string;
  title: string;
  subtitle: string;
  category: CourseCategory;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  instructor: string;
  instructorRole: string;
  coverImage: string;
  accentFrom: string;
  accentTo: string;
  rating: number;
  studentsCount: number;
  outcomes: string[];
  lessons: Lesson[];
}

export type PracticeLanguage = 'python' | 'javascript' | 'html';

export interface PracticeTestCase {
  label: string;
  inputExpr?: string;
  expectedOutput: string;
}

export interface PracticeProblem {
  id: string;
  number: number;
  title: string;
  language: PracticeLanguage;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xp: number;
  category: string;
  description: string;
  starterCode: string;
  solutionCode: string;
  hints: string[];
  testCases: PracticeTestCase[];
  entryFunction?: string;
  domChecks?: { selector: string; description: string; minCount?: number }[];
}

export interface PaymentRequestRecord {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  planRequested: SubscriptionPlan;
  currency: CurrencyCode;
  amount: number;
  paymentNetwork: string;
  paymentReference: string;
  confirmationChannel: 'email' | 'whatsapp';
  requestedCourses: string[];
  status: PaymentStatus;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface ProResourceItem {
  id: string;
  title: string;
  category: string;
  format: string;
  summary: string;
  content: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'student';
  plan: SubscriptionPlan;
  proApproved: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  approvedCourses: string[];
  paymentRequests: PaymentRequestRecord[];
  xp: number;
  streak: number;
  dateJoined: string;
  enrolledCourses: string[];
  completedLessons: { courseSlug: string; lessonId: string; completedAt: string; quizScore: number }[];
  completedProblems: { problemId: string; language: string; xpAwarded: number; completedAt: string }[];
}

export interface AdminUserRecord {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'student';
  plan: SubscriptionPlan;
  proApproved: boolean;
  approvedAt: string | null;
  approvedCourses: string[];
  xp: number;
  streak: number;
  dateJoined: string;
  lastSignedIn: string | null;
  coursesEnrolled: string[];
  lessonsCompletedCount: number;
  problemsSolvedCount: number;
}

export interface AdminStatsResponse {
  totalUsers: number;
  activeToday: number;
  totalCompletions: number;
  totalXp: number;
  approvedProUsers: number;
  pendingPayments: number;
  usersPerDay: { date: string; label: string; count: number }[];
  categoryBreakdown: { category: string; enrollments: number }[];
  users: AdminUserRecord[];
  paymentRequests: PaymentRequestRecord[];
}
