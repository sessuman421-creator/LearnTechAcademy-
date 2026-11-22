import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Lightbulb,
  Lock,
  Play,
  RotateCcw,
  Terminal,
  XCircle,
} from 'lucide-react';
import { PRACTICE_PROBLEMS } from '../data/problems.ts';
import { executePracticeCode, type RunResult } from '../utils/codeRunner.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { UpgradeModal } from '../components/UpgradeModal.tsx';
import { PAYMENT_INFO, canAccessPracticeProblem, hasFullProAccess } from '../utils/access.ts';
import type { PracticeLanguage } from '../types/academy.ts';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

const LANG_LABELS: Record<'all' | PracticeLanguage, string> = {
  all: 'All (30)',
  python: 'Python (10)',
  javascript: 'JavaScript (10)',
  html: 'HTML / CSS (10)',
};

export function PracticePage() {
  const { user, completePractice, setEditorContext } = useAuth();
  const [langFilter, setLangFilter] = useState<'all' | PracticeLanguage>('all');
  const [selectedId, setSelectedId] = useState<string>(PRACTICE_PROBLEMS[0].id);
  const [codeByProblem, setCodeByProblem] = useState<Record<string, string>>({});
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [xpBanner, setXpBanner] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const filteredProblems = useMemo(() => {
    if (langFilter === 'all') return PRACTICE_PROBLEMS;
    return PRACTICE_PROBLEMS.filter((p) => p.language === langFilter);
  }, [langFilter]);

  const activeProblem = useMemo(
    () => PRACTICE_PROBLEMS.find((p) => p.id === selectedId) ?? PRACTICE_PROBLEMS[0],
    [selectedId]
  );

  const isProblemUnlocked = canAccessPracticeProblem(user, activeProblem.id);
  const isFullPro = hasFullProAccess(user);
  const activeCode = codeByProblem[activeProblem.id] ?? activeProblem.starterCode;
  const solvedSet = useMemo(
    () => new Set(user?.completedProblems.map((p) => p.problemId) ?? []),
    [user]
  );

  useEffect(() => {
    if (isProblemUnlocked) {
      setEditorContext({
        code: activeCode,
        language: activeProblem.language === 'html' ? 'html' : activeProblem.language,
        lessonTitle: `Coding Practice Lab — ${activeProblem.number}. ${activeProblem.title}`,
        pathname: '/practice',
      });
    }
  }, [activeCode, activeProblem.language, activeProblem.number, activeProblem.title, isProblemUnlocked, setEditorContext]);

  const selectProblem = (id: string) => {
    setSelectedId(id);
    setRunResult(null);
    setShowHints(false);
    setShowSolution(false);
    setXpBanner(null);
  };

  const handleCodeChange = (val: string | undefined) => {
    setCodeByProblem((prev) => ({
      ...prev,
      [activeProblem.id]: val ?? '',
    }));
  };

  const handleReset = () => {
    setCodeByProblem((prev) => ({
      ...prev,
      [activeProblem.id]: activeProblem.starterCode,
    }));
    setRunResult(null);
    setXpBanner(null);
  };

  const handleLoadSolution = () => {
    if (!isFullPro) {
      setUpgradeOpen(true);
      return;
    }
    setCodeByProblem((prev) => ({
      ...prev,
      [activeProblem.id]: activeProblem.solutionCode,
    }));
    setShowSolution(true);
  };

  const handleToggleSolution = () => {
    if (!isFullPro) {
      setUpgradeOpen(true);
      return;
    }
    setShowSolution((prev) => !prev);
  };

  const handleRun = async () => {
    if (!isProblemUnlocked) {
      setUpgradeOpen(true);
      return;
    }
    const result = executePracticeCode(activeProblem, activeCode);
    setRunResult(result);
    setXpBanner(null);

    if (result.allPassed) {
      if (user) {
        const already = solvedSet.has(activeProblem.id);
        const res = await completePractice(activeProblem.id);
        if (!res.ok) {
          setXpBanner(res.error || 'Upgrade to Pro to earn XP on advanced problems.');
          return;
        }
        setXpBanner(
          already
            ? 'All checks passed! (Challenge already credited)'
            : `All checks passed! +${activeProblem.xp} XP awarded.`
        );
      } else {
        setXpBanner('All checks passed! Sign in to save XP to your profile.');
      }
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header & Language Switcher */}
      <div className="flex flex-col gap-4 border-b border-[#E6E3DC] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            Coding Practice Lab
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">
            30 interactive challenges across Python, JavaScript, and HTML/CSS inside Monaco Editor (15 free · 30 + solutions with Pro).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#E6E3DC] bg-white p-1">
          {(['all', 'python', 'javascript', 'html'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                setLangFilter(lang);
                const first =
                  lang === 'all'
                    ? PRACTICE_PROBLEMS[0]
                    : PRACTICE_PROBLEMS.find((p) => p.language === lang);
                if (first) selectProblem(first.id);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                langFilter === lang ? 'bg-stone-900 text-white font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {LANG_LABELS[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Problem List + Prompt */}
        <div className="space-y-4 lg:col-span-4">
          <div className="overflow-hidden rounded-2xl surface-card">
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 text-xs text-stone-500 tabular-nums">
              <span className="font-semibold text-stone-900">Challenges</span>
              <span>
                {solvedSet.size}/{PRACTICE_PROBLEMS.length} Solved
              </span>
            </div>
            <div className="max-h-[260px] divide-y divide-stone-100 overflow-y-auto">
              {filteredProblems.map((prob) => {
                const active = prob.id === activeProblem.id;
                const solved = solvedSet.has(prob.id);
                const unlocked = canAccessPracticeProblem(user, prob.id);
                return (
                  <button
                    key={prob.id}
                    type="button"
                    onClick={() => selectProblem(prob.id)}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                      active
                        ? 'bg-stone-900 text-white font-semibold'
                        : 'text-stone-700 hover:bg-[#FAF9F6] hover:text-stone-900'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {solved ? (
                        <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-white' : 'text-emerald-600'}`} />
                      ) : !unlocked ? (
                        <Lock className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-stone-300' : 'text-stone-400'}`} />
                      ) : (
                        <span className="w-4 text-center font-mono tabular-nums opacity-70">{prob.number}</span>
                      )}
                      <span className="truncate">{prob.title}</span>
                    </span>
                    <span className="shrink-0 font-mono tabular-nums opacity-80">
                      {!unlocked ? 'Pro' : `+${prob.xp}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl surface-card p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-stone-500 tabular-nums">
                <span className="font-semibold uppercase text-sky-700">{activeProblem.language}</span>
                <span className="text-stone-300">·</span>
                <span>{activeProblem.difficulty}</span>
                <span className="text-stone-300">·</span>
                <span>+{activeProblem.xp} XP</span>
              </div>
              <h2 className="mt-1.5 font-display text-lg font-semibold text-stone-900">
                {activeProblem.number}. {activeProblem.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{activeProblem.description}</p>
            </div>

            {isProblemUnlocked && (
              <>
                <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowHints((prev) => !prev)}
                    className="btn-secondary inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium cursor-pointer"
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                    {showHints ? 'Hide Hints' : 'Hints'}
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleSolution}
                    className="btn-secondary inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium cursor-pointer"
                  >
                    {isFullPro ? (
                      <Eye className="h-3.5 w-3.5 text-sky-700" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-stone-500" />
                    )}
                    {showSolution ? 'Hide Solution' : isFullPro ? 'View Solution' : 'Solution (Pro)'}
                  </button>
                </div>

                {showHints && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1.5">
                    {activeProblem.hints.map((h, i) => (
                      <p key={i}>
                        {i + 1}. {h}
                      </p>
                    ))}
                  </div>
                )}

                {showSolution && isFullPro && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-stone-500">Reference Solution</span>
                      <button
                        type="button"
                        onClick={handleLoadSolution}
                        className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                      >
                        Load into Editor
                      </button>
                    </div>
                    <pre className="max-h-48 overflow-auto rounded-xl border border-[#E6E3DC] bg-[#FAF9F6] p-3 font-mono text-xs text-stone-900">
                      <code>{activeProblem.solutionCode}</code>
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Monaco Editor + Output Panel (or Pro Gate) */}
        <div className="space-y-4 lg:col-span-8">
          {!isProblemUnlocked ? (
            <div className="rounded-2xl surface-card p-10 text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E6E3DC] bg-[#FAF9F6] text-sky-700">
                <Lock className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-xl font-bold text-stone-900">
                Pro Practice Challenge Locked
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-stone-600">
                Challenges 1–5 per language (15 total) are free. Challenges 6–10 across Python, JavaScript, and HTML/CSS plus all Reference Solutions unlock after paying <strong className="text-stone-900">GH₵29 or ₦29</strong> via {PAYMENT_INFO.network} (<strong className="font-mono">{PAYMENT_INFO.telecelNumber}</strong>) and receiving admin approval.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setUpgradeOpen(true)}
                  className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer"
                >
                  Pay via Telecel & Unlock All 30
                </button>
                <button
                  type="button"
                  onClick={() => selectProblem(PRACTICE_PROBLEMS[0].id)}
                  className="btn-secondary rounded-xl px-5 py-2.5 text-sm font-semibold cursor-pointer"
                >
                  Try Free Challenges
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl surface-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-[#FAF9F6] px-4 py-2.5">
                  <span className="font-mono text-xs font-medium text-stone-800">
                    {activeProblem.id}.{activeProblem.language === 'python' ? 'py' : activeProblem.language === 'javascript' ? 'js' : 'html'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="btn-secondary inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </button>
                    <button
                      type="button"
                      onClick={handleRun}
                      className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5" /> Run & Test
                    </button>
                  </div>
                </div>

                <div className="h-[380px] w-full">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center bg-white font-mono text-xs text-stone-500">
                        Loading Monaco Editor...
                      </div>
                    }
                  >
                    <MonacoEditor
                      height="380px"
                      language={activeProblem.language}
                      value={activeCode}
                      onChange={handleCodeChange}
                      theme="light"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: 'JetBrains Mono, monospace',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 12, bottom: 12 },
                        tabSize: activeProblem.language === 'python' ? 4 : 2,
                      }}
                    />
                  </Suspense>
                </div>
              </div>

              {activeProblem.language === 'html' && (
                <div className="overflow-hidden rounded-2xl surface-card">
                  <div className="border-b border-stone-100 bg-[#FAF9F6] px-4 py-2 text-xs font-medium text-stone-500">
                    Live Sandboxed HTML / CSS Preview
                  </div>
                  <iframe
                    title="HTML CSS Live Preview"
                    sandbox="allow-scripts"
                    srcDoc={activeCode}
                    className="h-[220px] w-full bg-white"
                  />
                </div>
              )}

              {/* Output & Test Results */}
              <div className="rounded-2xl surface-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                    <Terminal className="h-4 w-4 text-sky-700" />
                    <span>Output & Test Cases</span>
                  </div>
                  {runResult && (
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        runResult.allPassed ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {runResult.passedTests} / {runResult.totalTests} Checks Passed
                    </span>
                  )}
                </div>

                {xpBanner && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-900">
                    {xpBanner}
                  </div>
                )}

                {!runResult ? (
                  <p className="mt-3 text-xs text-stone-500">
                    Click <strong className="text-stone-800">Run & Test</strong> to execute your code and validate test assertions.
                  </p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {runResult.error && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 font-mono text-xs text-rose-900">
                        {runResult.error}
                      </div>
                    )}

                    {runResult.logs.length > 0 && (
                      <div className="rounded-xl border border-[#E6E3DC] bg-[#FAF9F6] p-3 font-mono text-xs text-stone-800 space-y-1">
                        {runResult.logs.map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    )}

                    {runResult.testDetails.length > 0 && (
                      <div className="space-y-2">
                        {runResult.testDetails.map((t, i) => (
                          <div
                            key={i}
                            className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
                              t.passed
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                                : 'border-rose-200 bg-rose-50 text-rose-950'
                            }`}
                          >
                            <span className="flex items-center gap-2 font-medium">
                              {t.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-rose-600" />
                              )}
                              {t.label}
                            </span>
                            <span className="font-mono text-[11px] opacity-90">
                              Got: {t.actual} | Expected: {t.expected}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        initialPlan="pro"
      />
    </div>
  );
}
