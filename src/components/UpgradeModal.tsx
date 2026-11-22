import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCircle2, Copy, MessageCircle, Phone, X } from 'lucide-react';
import { COURSES } from '../data/courses.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { CurrencyCode, SubscriptionPlan } from '../types/academy.ts';
import { CURRENCY_CONFIG, PAYMENT_INFO, formatPlanPrice } from '../utils/access.ts';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  initialPlan?: SubscriptionPlan;
  initialCurrency?: CurrencyCode;
  initialCourseSlug?: string;
}

export function UpgradeModal({
  open,
  onClose,
  initialPlan = 'pro',
  initialCurrency = 'GHS',
  initialCourseSlug,
}: UpgradeModalProps) {
  const { user, submitPayment } = useAuth();
  const [plan, setPlan] = useState<'pro' | 'team'>(initialPlan === 'team' ? 'team' : 'pro');
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency);
  const [paymentReference, setPaymentReference] = useState('');
  const [confirmationChannel, setConfirmationChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [selectedCourses, setSelectedCourses] = useState<string[]>(
    initialCourseSlug ? [initialCourseSlug] : []
  );
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  if (!open) return null;

  const formattedPrice = formatPlanPrice(plan, currency);

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_INFO.telecelNumber);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 1600);
    } catch {
      setCopiedPhone(false);
    }
  };

  const toggleCourse = (slug: string) => {
    setSelectedCourses((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmittedMsg(null);
    setSubmitting(true);
    const res = await submitPayment({
      planRequested: plan,
      currency,
      paymentReference,
      confirmationChannel,
      requestedCourses: selectedCourses,
    });
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || 'Could not submit payment confirmation.');
      return;
    }

    setPaymentReference('');
    setSubmittedMsg(
      'Payment confirmation recorded! Send your Telecel receipt via WhatsApp (0204704510) if needed. Your Pro access and resources will unlock immediately once approved by the admin.'
    );
  };

  const whatsappText = encodeURIComponent(
    `Hello Admin, I just paid ${formattedPrice} (${currency}) via Telecel (${PAYMENT_INFO.telecelNumber}) for LearnTech Academy ${
      plan === 'team' ? 'Team Cohort' : 'Pro Engineer'
    }. Account email: ${user?.email || ''}${paymentReference ? ` | Ref: ${paymentReference}` : ''}`
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#E6E3DC] bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <p className="text-xs font-semibold text-sky-700">Telecel Mobile Payment & Admin Verification</p>
            <h2 id="upgrade-modal-title" className="mt-1 font-display text-xl font-bold text-stone-900">
              Upgrade to Pro Engineer
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upgrade dialog"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-900 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Currency & Plan Selection */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-stone-600">Select Plan</label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 rounded-xl border border-[#E6E3DC] bg-[#FAF9F6] p-1">
              {(['pro', 'team'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    plan === p ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {p === 'pro' ? 'Pro Engineer' : 'Team Cohort'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600">Currency</label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 rounded-xl border border-[#E6E3DC] bg-[#FAF9F6] p-1">
              {(['GHS', 'NGN'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    currency === code ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {CURRENCY_CONFIG[code].symbol} ({code})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Telecel Receiver Instructions */}
        <div className="mt-5 rounded-2xl border border-[#E6E3DC] bg-[#FAF9F6] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-stone-500">Amount Due (Paid directly to Admin)</p>
              <p className="mt-0.5 font-display text-2xl font-bold text-stone-900 tabular-nums">
                {formattedPrice}{' '}
                <span className="text-xs font-normal text-stone-500">
                  {plan === 'team' ? 'per 5 seats / mo' : 'per month'}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyNumber}
              className="btn-secondary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer"
            >
              {copiedPhone ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedPhone ? 'Copied Number' : 'Copy Telecel'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-[#E6E3DC] pt-3 text-xs text-stone-700 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-sky-700 shrink-0" />
              <div>
                <p className="text-[11px] text-stone-500">{PAYMENT_INFO.network}</p>
                <p className="font-mono font-semibold text-stone-900">{PAYMENT_INFO.telecelNumber}</p>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-stone-500">Receiver Account</p>
              <p className="font-semibold text-stone-900">{PAYMENT_INFO.receiverName}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-[#E6E3DC] pt-3">
            <a
              href={`${PAYMENT_INFO.whatsappLink}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-emerald-800"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Confirm via WhatsApp ({PAYMENT_INFO.whatsappNumber})
            </a>
          </div>
        </div>

        {!user ? (
          <div className="mt-5 rounded-xl border border-[#E6E3DC] bg-[#FAF9F6] p-4 text-center">
            <p className="text-sm text-stone-700">
              Sign in or create a LearnTech Academy account first so we can link your Telecel payment approval to your profile.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link to="/signin" onClick={onClose} className="btn-secondary rounded-xl px-4 py-2 text-xs font-semibold">
                Sign In
              </Link>
              <Link to="/signup" onClick={onClose} className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold">
                Create Account
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="payment-ref" className="block text-xs font-medium text-stone-700">
                Telecel Transaction ID / Sender Reference
              </label>
              <input
                id="payment-ref"
                type="text"
                required
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. TXN-9482105 or sender mobile number"
                className="mt-1.5 w-full rounded-xl border border-[#E6E3DC] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700">Confirmation Method</label>
              <div className="mt-1.5 flex gap-2">
                {(['whatsapp', 'email'] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setConfirmationChannel(ch)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium cursor-pointer ${
                      confirmationChannel === ch
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-[#E6E3DC] bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    {ch === 'whatsapp'
                      ? `WhatsApp (${PAYMENT_INFO.whatsappNumber})`
                      : 'In-App Admin Portal'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-stone-700">
                Priority Pro Courses (optional — admin can unlock all Pro or specific courses)
              </p>
              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {COURSES.map((c) => {
                  const checked = selectedCourses.includes(c.slug);
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => toggleCourse(c.slug)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                        checked
                          ? 'border-stone-900 bg-[#FAF9F6] font-semibold text-stone-900'
                          : 'border-[#E6E3DC] bg-white text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <span
                        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                          checked ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300'
                        }`}
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <span className="truncate">{c.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800" role="alert">
                {error}
              </div>
            )}

            {submittedMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs text-emerald-900" role="status">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{submittedMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary rounded-xl px-5 py-2 text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Payment Confirmation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
