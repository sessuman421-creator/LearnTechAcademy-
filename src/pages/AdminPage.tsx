import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Archive,
  Check,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { COURSES } from '../data/courses.ts';
import { apiFetch, useAuth } from '../context/AuthContext.tsx';
import type { AdminStatsResponse, AdminUserRecord, SubscriptionPlan } from '../types/academy.ts';
import { CURRENCY_CONFIG } from '../utils/access.ts';

export function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [approvingUserId, setApprovingUserId] = useState<number | null>(null);

  // Per-user access editor modal state
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan>('free');
  const [editProApproved, setEditProApproved] = useState(false);
  const [editCourses, setEditCourses] = useState<string[]>([]);
  const [editNote, setEditNote] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  const isAuthorizedAdmin = !authLoading && Boolean(user && user.role === 'admin');

  const loadStats = useCallback(async () => {
    if (!isAuthorizedAdmin) return;
    setDataLoading(true);
    try {
      const res = await apiFetch('/api/admin/stats');
      if (!res.ok) {
        let serverMsg = `Unable to load admin telemetry (${res.status}).`;
        try {
          const payload = (await res.json()) as { error?: string };
          if (payload?.error) serverMsg = payload.error;
        } catch {
          // ignore JSON parse failure
        }
        throw new Error(serverMsg);
      }
      const data = (await res.json()) as AdminStatsResponse;
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin data.');
    } finally {
      setDataLoading(false);
    }
  }, [isAuthorizedAdmin]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const filteredUsers = useMemo(() => {
    if (!stats) return [];
    const q = search.trim().toLowerCase();
    if (!q) return stats.users;
    return stats.users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.plan.toLowerCase().includes(q) ||
        u.coursesEnrolled.some((c) => c.toLowerCase().includes(q))
    );
  }, [stats, search]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="h-48 animate-pulse rounded-2xl bg-stone-200/70" />
      </div>
    );
  }

  if (!isAuthorizedAdmin) {
    return <Navigate to={user ? '/dashboard' : '/'} replace />;
  }

  const triggerDownload = async (endpoint: string, filename: string, key: string) => {
    try {
      setDownloading(key);
      setError(null);
      const res = await apiFetch(endpoint);
      if (!res.ok) {
        throw new Error(`Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setDownloading(null);
    }
  };

  const openUserAccessModal = (record: AdminUserRecord) => {
    setEditingUser(record);
    setEditPlan(record.plan);
    setEditProApproved(record.proApproved);
    setEditCourses(record.approvedCourses);
    setEditNote('');
  };

  const toggleEditCourse = (slug: string) => {
    setEditCourses((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSaveUserAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingUser(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch(`/api/admin/users/${editingUser.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          plan: editPlan,
          proApproved: editProApproved,
          approvedCourses: editCourses,
          adminNote: editNote.trim() || undefined,
        }),
      });
      const data = (await res.json()) as AdminStatsResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user access.');
      }
      setStats(data);
      setNotice(`Updated subscription & Pro course access for ${editingUser.email}.`);
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update access.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleReviewPayment = async (requestId: number, decision: 'approved' | 'rejected') => {
    setReviewingId(requestId);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch(`/api/admin/payments/${requestId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          adminNote:
            decision === 'approved'
              ? 'Telecel payment verified & confirmed by admin.'
              : 'Payment reference could not be verified.',
        }),
      });
      const data = (await res.json()) as AdminStatsResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Failed to review payment request.');
      }
      setStats(data);
      setNotice(
        decision === 'approved'
          ? 'Payment approved & confirmed in database — Pro access and resources are now unlocked for this learner.'
          : 'Payment request marked as rejected.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review payment.');
    } finally {
      setReviewingId(null);
    }
  };

  const handleQuickApprove = async (record: AdminUserRecord) => {
    setApprovingUserId(record.id);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch(`/api/admin/users/${record.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          plan: record.plan === 'team' ? 'team' : 'pro',
          proApproved: true,
          approvedCourses: record.approvedCourses,
          adminNote: 'Approved by admin',
        }),
      });
      const data = (await res.json()) as AdminStatsResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve user.');
      }
      setStats(data);
      setNotice(`Approved ${record.email} — Pro access and resources are now unlocked.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve user.');
    } finally {
      setApprovingUserId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header & Export Toolbar */}
      <div className="flex flex-col gap-5 border-b border-[#E6E3DC] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700">
            <ShieldCheck className="h-4 w-4" />
            <span>Protected Admin Console</span>
          </div>
          <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-stone-900">
            Academy Operations, Payments & Exports
          </h1>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={downloading !== null}
            onClick={() => triggerDownload('/api/admin/export-csv', 'learntech-users.csv', 'csv')}
            className="btn-secondary inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-sky-700" />
            {downloading === 'csv' ? 'Exporting...' : 'Download CSV'}
          </button>

          <button
            type="button"
            disabled={downloading !== null}
            onClick={() => triggerDownload('/api/admin/export-excel', 'learntech-users.xlsx', 'excel')}
            className="btn-secondary inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
            {downloading === 'excel' ? 'Exporting...' : 'Download Excel'}
          </button>

          <button
            type="button"
            disabled={downloading !== null}
            onClick={() => triggerDownload('/api/admin/export-db', 'learntech-academy.db', 'db')}
            className="btn-secondary inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            <Database className="h-3.5 w-3.5 text-stone-700" />
            {downloading === 'db' ? 'Exporting...' : 'Export Database'}
          </button>

          <button
            type="button"
            disabled={downloading !== null}
            onClick={() => triggerDownload('/api/admin/export-zip', 'learntech-academy-source.zip', 'zip')}
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            <Archive className="h-3.5 w-3.5" />
            {downloading === 'zip' ? 'Packaging ZIP...' : 'Download Source ZIP'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          {notice}
        </div>
      )}

      {dataLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-2xl bg-stone-200/70" />
          ))}
        </div>
      ) : !stats ? (
        <div className="mt-8 rounded-2xl surface-card p-8 text-center">
          <p className="font-display text-base font-semibold text-stone-900">
            Could not load admin telemetry
          </p>
          <p className="mt-1.5 text-sm text-stone-500">
            {error || 'Your admin session may need to be refreshed.'}
          </p>
          <button
            type="button"
            onClick={() => void loadStats()}
            className="btn-primary mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry Loading Admin Data
          </button>
        </div>
      ) : (
        <>
          {/* Divider-Separated KPI Row */}
          <div className="mt-6 grid grid-cols-2 divide-y divide-stone-100 overflow-hidden rounded-2xl surface-card lg:grid-cols-5 lg:divide-y-0 lg:divide-x">
            <div className="p-5">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Total Users</span>
                <Users className="h-4 w-4 text-sky-700" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-stone-900 tabular-nums">
                {stats.totalUsers.toLocaleString()}
              </p>
            </div>
            <div className="p-5">
              <span className="text-xs text-stone-500">Pro Approved</span>
              <p className="mt-2 font-display text-3xl font-bold text-emerald-700 tabular-nums">
                {stats.approvedProUsers.toLocaleString()}
              </p>
            </div>
            <div className="p-5">
              <span className="text-xs text-stone-500">Pending Payments</span>
              <p className="mt-2 font-display text-3xl font-bold text-amber-700 tabular-nums">
                {stats.pendingPayments.toLocaleString()}
              </p>
            </div>
            <div className="p-5">
              <span className="text-xs text-stone-500">Active Today</span>
              <p className="mt-2 font-display text-3xl font-bold text-stone-900 tabular-nums">
                {stats.activeToday.toLocaleString()}
              </p>
            </div>
            <div className="p-5">
              <span className="text-xs text-stone-500">Cumulative Learner XP</span>
              <p className="mt-2 font-display text-3xl font-bold text-stone-900 tabular-nums">
                {stats.totalXp.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Telecel Payment Verification Queue */}
          <section className="mt-6 overflow-hidden rounded-2xl surface-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-5 py-3.5">
              <div>
                <h2 className="font-display text-sm font-semibold text-stone-900">
                  Telecel Payment Confirmation Queue (0500717586)
                </h2>
                <p className="text-xs text-stone-500">
                  Verify WhatsApp (0204704510) or in-app Telecel confirmations and approve paid users to unlock Pro & Pro courses
                </p>
              </div>
              <span className="font-mono text-xs text-stone-500 tabular-nums">
                {stats.pendingPayments} pending · {stats.paymentRequests.length} total
              </span>
            </div>

            {stats.paymentRequests.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-stone-500">
                No payment confirmation requests submitted yet. You can also approve any learner directly in the Users Directory below.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-stone-100 text-xs font-medium text-stone-500">
                      <th className="px-5 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Plan & Amount</th>
                      <th className="px-4 py-3 font-medium">Telecel Reference</th>
                      <th className="px-4 py-3 font-medium">Channel</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {stats.paymentRequests.map((pr) => (
                      <tr key={pr.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-mono text-xs font-medium text-stone-900">{pr.userEmail}</p>
                          <p className="text-xs text-stone-500">{pr.userName}</p>
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <span className="font-semibold text-stone-900 capitalize">{pr.planRequested}</span>
                          <span className="mx-1.5 text-stone-300">·</span>
                          <span className="font-mono font-semibold text-stone-900">
                            {CURRENCY_CONFIG[pr.currency].symbol}
                            {pr.amount} ({pr.currency})
                          </span>
                          {pr.requestedCourses.length > 0 && (
                            <p className="mt-0.5 text-[11px] text-stone-500 truncate max-w-[200px]">
                              Courses: {pr.requestedCourses.join(', ')}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-stone-800">{pr.paymentReference}</td>
                        <td className="px-4 py-3.5 text-xs capitalize text-stone-600">{pr.confirmationChannel}</td>
                        <td className="px-4 py-3.5 text-xs">
                          <span
                            className={`font-semibold capitalize ${
                              pr.status === 'approved'
                                ? 'text-emerald-700'
                                : pr.status === 'rejected'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {pr.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {pr.status === 'pending' ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                disabled={reviewingId === pr.id}
                                onClick={() => handleReviewPayment(pr.id, 'approved')}
                                className="btn-primary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Confirm
                              </button>
                              <button
                                type="button"
                                disabled={reviewingId === pr.id}
                                onClick={() => handleReviewPayment(pr.id, 'rejected')}
                                className="btn-secondary inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-50 cursor-pointer"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono text-[11px] text-stone-400">
                              {pr.reviewedAt ? pr.reviewedAt.slice(0, 10) : 'Reviewed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Rounded Pill Filter Bar */}
          <div className="mt-6">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by email, name, plan, or course..."
                aria-label="Filter registered users"
                className="w-full rounded-full border border-[#E6E3DC] bg-white py-3 pl-11 pr-4 text-sm text-stone-900 placeholder:text-stone-400 shadow-[0_1px_2px_rgba(24,24,27,0.03)] focus:border-stone-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Searchable Directory Card */}
          <section className="mt-4 overflow-hidden rounded-2xl surface-card">
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
              <h2 className="font-display text-sm font-semibold text-stone-900">Signed-In Users & Approvals</h2>
              <p className="text-xs text-stone-500 tabular-nums">
                {filteredUsers.length} of {stats.users.length} signed-in user{stats.users.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-stone-100 text-xs font-medium text-stone-500">
                    <th className="px-5 py-3.5 font-medium">User Email</th>
                    <th className="px-4 py-3.5 font-medium">Status</th>
                    <th className="px-4 py-3.5 font-medium">Last Sign-In</th>
                    <th className="px-4 py-3.5 font-medium">Courses Enrolled</th>
                    <th className="px-4 py-3.5 text-right font-medium">XP</th>
                    <th className="px-5 py-3.5 text-right font-medium">Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-mono text-sm font-medium text-stone-900 whitespace-nowrap">
                          {u.email}
                        </p>
                        <p className="mt-0.5 text-xs text-stone-500 whitespace-nowrap">
                          {u.name}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-xs whitespace-nowrap">
                        <p className={`font-semibold capitalize ${u.proApproved ? 'text-emerald-700' : 'text-stone-700'}`}>
                          {u.proApproved ? `${u.plan} · Approved` : 'Free · Pending'}
                        </p>
                        {u.approvedCourses.length > 0 && (
                          <p className="mt-0.5 text-[11px] text-sky-700">
                            +{u.approvedCourses.length} Pro course{u.approvedCourses.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-stone-500 tabular-nums whitespace-nowrap">
                        {(u.lastSignedIn || u.dateJoined).slice(0, 10)}
                      </td>
                      <td className="px-4 py-4 text-xs text-stone-600 max-w-xs truncate">
                        {u.coursesEnrolled.length > 0 ? u.coursesEnrolled.join(', ') : 'None'}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm font-medium text-stone-900 tabular-nums">
                        {u.xp.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          {!u.proApproved ? (
                            <button
                              type="button"
                              disabled={approvingUserId === u.id}
                              onClick={() => handleQuickApprove(u)}
                              className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {approvingUserId === u.id ? 'Approving...' : 'Approve'}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              <Check className="h-3.5 w-3.5" />
                              Approved
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => openUserAccessModal(u)}
                            className="btn-secondary inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5 text-sky-700" />
                            Courses
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm text-stone-500">
                        {stats.users.length === 0
                          ? 'No users have signed in yet. When a user creates an account or signs in, their email and Approve button will appear here.'
                          : `No users match "${search}".`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Charts */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="rounded-2xl surface-card p-6 lg:col-span-7">
              <h2 className="font-display text-base font-semibold text-stone-900">
                Users Joined Per Day (Last 14 Days)
              </h2>
              <p className="mt-1 text-xs text-stone-500">Daily account registrations in SQLite</p>
              <div className="mt-4 h-[260px] w-full min-w-0">
                <ResponsiveContainer width="100%" height={260} minWidth={0}>
                  <AreaChart data={stats.usersPerDay}>
                    <defs>
                      <linearGradient id="joinGradientLight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#18181b" stopOpacity={0.16} />
                        <stop offset="100%" stopColor="#18181b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edeae3" />
                    <XAxis dataKey="label" stroke="#71717a" fontSize={11} />
                    <YAxis allowDecimals={false} stroke="#71717a" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e6e3dc',
                        borderRadius: '12px',
                        color: '#18181b',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Users Joined"
                      stroke="#18181b"
                      strokeWidth={2}
                      fill="url(#joinGradientLight)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl surface-card p-6 lg:col-span-5">
              <h2 className="font-display text-base font-semibold text-stone-900">
                Enrollments by Track
              </h2>
              <p className="mt-1 text-xs text-stone-500">Distribution across engineering categories</p>
              <div className="mt-4 h-[260px] w-full min-w-0">
                <ResponsiveContainer width="100%" height={260} minWidth={0}>
                  <BarChart data={stats.categoryBreakdown} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edeae3" />
                    <XAxis type="number" allowDecimals={false} stroke="#71717a" fontSize={11} />
                    <YAxis type="category" dataKey="category" width={115} stroke="#52525b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e6e3dc',
                        borderRadius: '12px',
                        color: '#18181b',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="enrollments" name="Enrollments" fill="#18181b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Admin-Only User Access & Pro Course Grant Modal */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="manage-access-title"
        >
          <form
            onSubmit={handleSaveUserAccess}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E6E3DC] bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <p className="text-xs font-semibold text-sky-700">Admin Database Approval</p>
                <h2 id="manage-access-title" className="mt-1 font-display text-lg font-bold text-stone-900">
                  {editingUser.name}
                </h2>
                <p className="font-mono text-xs text-stone-500">{editingUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-900 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <label className="block text-xs font-medium text-stone-700">Subscription Tier</label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {(['free', 'pro', 'team'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => {
                        setEditPlan(tier);
                        if (tier !== 'free') setEditProApproved(true);
                      }}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold capitalize cursor-pointer ${
                        editPlan === tier
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-[#E6E3DC] bg-white text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-[#E6E3DC] bg-[#FAF9F6] p-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editProApproved}
                  onChange={(e) => setEditProApproved(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 accent-stone-900"
                />
                <div className="text-xs">
                  <p className="font-semibold text-stone-900">Confirm & Approve Full Pro Access</p>
                  <p className="mt-0.5 text-stone-500">
                    Unlocks all 88 lessons, 30 coding labs + solutions, Pro Resource Vault, and Pro AI modes.
                  </p>
                </div>
              </label>

              <div>
                <p className="text-xs font-medium text-stone-700">
                  Or Grant Specific Pro Courses in Database (even on Free tier)
                </p>
                <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {COURSES.map((c) => {
                    const checked = editCourses.includes(c.slug);
                    return (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => toggleEditCourse(c.slug)}
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

              <div>
                <label htmlFor="admin-note-input" className="block text-xs font-medium text-stone-700">
                  Confirmation Note (optional)
                </label>
                <input
                  id="admin-note-input"
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="e.g. Telecel payment confirmed via WhatsApp"
                  className="mt-1.5 w-full rounded-xl border border-[#E6E3DC] bg-[#FAF9F6] px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="btn-secondary rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingUser}
                className="btn-primary rounded-xl px-5 py-2 text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {savingUser ? 'Saving...' : 'Confirm & Save Approval'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
