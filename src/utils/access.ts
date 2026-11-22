import type { CurrencyCode, SubscriptionPlan, UserProfile } from '../types/academy.ts';

export const PAYMENT_INFO = {
  receiverName: 'LearnTech Academy Admin',
  network: 'Telecel Network',
  telecelNumber: '0500717586',
  whatsappNumber: '0204704510',
  whatsappLink: 'https://wa.me/233204704510',
} as const;

export const CURRENCY_CONFIG: Record<CurrencyCode, { code: CurrencyCode; symbol: string; label: string }> = {
  GHS: { code: 'GHS', symbol: 'GH₵', label: 'Ghana Cedis (GH₵)' },
  NGN: { code: 'NGN', symbol: '₦', label: 'Nigerian Naira (₦)' },
};

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  free: 0,
  pro: 29,
  team: 99,
};

export function formatPlanPrice(plan: SubscriptionPlan, currency: CurrencyCode): string {
  const symbol = CURRENCY_CONFIG[currency].symbol;
  return `${symbol}${PLAN_PRICES[plan]}`;
}

export function hasFullProAccess(user: Pick<UserProfile, 'role' | 'proApproved' | 'plan'> | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'admin' || (user.proApproved && (user.plan === 'pro' || user.plan === 'team'));
}

export function canAccessCourseLesson(
  user: Pick<UserProfile, 'role' | 'proApproved' | 'plan' | 'approvedCourses'> | null | undefined,
  courseSlug: string,
  lessonNumber: number
): boolean {
  if (lessonNumber <= 3) return true;
  if (!user) return false;
  if (hasFullProAccess(user)) return true;
  return user.approvedCourses.includes(courseSlug);
}

export function canAccessPracticeProblem(
  user: Pick<UserProfile, 'role' | 'proApproved' | 'plan'> | null | undefined,
  problemId: string
): boolean {
  const numPart = Number(problemId.split('-')[1] || 0);
  if (numPart > 0 && numPart <= 5) return true;
  return hasFullProAccess(user);
}
