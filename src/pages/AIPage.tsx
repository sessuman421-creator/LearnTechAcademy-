import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Lock,
  MessageSquareCode,
  RotateCcw,
  Send,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { apiFetch, useAuth } from '../context/AuthContext.tsx';
import { MarkdownMessage } from '../components/MarkdownMessage.tsx';
import { UpgradeModal } from '../components/UpgradeModal.tsx';
import { hasFullProAccess } from '../utils/access.ts';

type MentorMode = 'general' | 'debug' | 'lesson' | 'architecture' | 'interview';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Welcome to the **LearnTech AI Mentor** workspace. Ask me to walk through a lesson concept, debug your code step-by-step, review system architecture, or recommend what to study next based on your progress.',
};

const MODES: { id: MentorMode; label: string; description: string; proOnly?: boolean }[] = [
  { id: 'general', label: 'General Mentor', description: 'Course Q&A and next-step guidance' },
  { id: 'debug', label: 'Debug Code', description: 'Trace edge cases & fix errors' },
  { id: 'lesson', label: 'Lesson Coach', description: 'Concept breakdowns & checks' },
  { id: 'architecture', label: 'Architecture Review', description: 'Pro: Scalability & API design', proOnly: true },
  { id: 'interview', label: 'Mock Interview', description: 'Pro: Timed technical Q&A', proOnly: true },
];

export function AIPage() {
  const { user, editorContext, setEditorContext } = useAuth();
  const [mode, setMode] = useState<MentorMode>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isPro = hasFullProAccess(user);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingId]);

  const stopGeneration = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSending(false);
    setStreamingId(null);
  };

  const handleCopyReply = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1600);
    } catch {
      setCopiedId(null);
    }
  };

  const handleSelectMode = (nextMode: MentorMode, proOnly?: boolean) => {
    if (proOnly && !isPro) {
      setUpgradeOpen(true);
      return;
    }
    setMode(nextMode);
  };

  const sendPrompt = async (promptText: string, baseMessages?: ChatMessage[]) => {
    const trimmed = promptText.trim();
    if (!trimmed || sending) return;

    const sourceMessages = baseMessages ?? messages;
    const priorHistory = sourceMessages
      .filter((m) => m.id !== 'welcome')
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text }));

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages([...sourceMessages, userMsg]);
    setInput('');
    setSending(true);
    setStreamingId(null);

    const controller = new AbortController();
    abortRef.current = controller;
    const assistantId = `a-${Date.now()}`;

    try {
      const res = await apiFetch('/api/ai/chat?stream=1', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Accept: 'text/event-stream, application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          context: {
            pathname: editorContext.pathname || '/ai',
            courseSlug: editorContext.courseSlug,
            courseTitle: editorContext.courseTitle,
            lessonId: editorContext.lessonId,
            lessonTitle: editorContext.lessonTitle,
            editorCode: editorContext.code,
            editorLanguage: editorContext.language,
            mode,
          },
          history: priorHistory,
        }),
      });

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';
        let streamError: string | null = null;
        let createdBubble = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;
            try {
              const payload = JSON.parse(jsonStr) as { delta?: string; error?: string; done?: boolean };
              if (payload.error) {
                streamError = payload.error;
              } else if (payload.delta) {
                accumulated += payload.delta;
                if (!createdBubble) {
                  createdBubble = true;
                  setStreamingId(assistantId);
                  setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', text: accumulated }]);
                } else {
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantId ? { ...m, text: accumulated } : m))
                  );
                }
              }
            } catch {
              // ignore malformed SSE chunk
            }
          }
        }

        if (streamError) {
          if (createdBubble) {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, text: `${accumulated}\n\n${streamError}`.trim() } : m))
            );
          } else {
            setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', text: streamError! }]);
          }
        } else if (!createdBubble) {
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: 'assistant', text: 'AI Mentor returned an empty response. Please try again.' },
          ]);
        }
        return;
      }

      const rawText = await res.text();
      let data: { reply?: string; error?: string } = {};
      try {
        data = JSON.parse(rawText) as { reply?: string; error?: string };
      } catch {
        data = { error: rawText ? rawText.slice(0, 180) : `HTTP ${res.status}` };
      }

      if (!res.ok || !data.reply) {
        setMessages((prev) => [
          ...prev,
          { id: `e-${Date.now()}`, role: 'assistant', text: data.error || `Unable to reach AI Mentor (${res.status}).` },
        ]);
      } else {
        setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', text: data.reply! }]);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const detail = err instanceof Error && err.message ? ` (${err.message})` : '';
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: 'assistant', text: `Connection error${detail}. Please try again in a moment.` },
      ]);
    } finally {
      abortRef.current = null;
      setSending(false);
      setStreamingId(null);
    }
  };

  const handleRegenerate = () => {
    if (sending) return;
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;
    const actualUserIdx = messages.length - 1 - lastUserIdx;
    const promptToRetry = messages[actualUserIdx].text;
    const trimmedBeforeUser = messages.slice(0, actualUserIdx);
    void sendPrompt(promptToRetry, trimmedBeforeUser);
  };

  const handleClear = () => {
    if (sending) stopGeneration();
    setMessages([WELCOME_MESSAGE]);
  };

  const quickPrompts =
    mode === 'debug'
      ? ['Find edge cases in my active code', 'Why is my function failing test cases?', 'Optimize time complexity']
      : mode === 'lesson'
      ? ['Summarize the key concept simply', 'Quiz me with 2 short questions', 'Show a minimal real-world example']
      : mode === 'architecture'
      ? ['Review my API security & scaling', 'Design an idempotent payment schema', 'How to cut database P95 latency?']
      : mode === 'interview'
      ? ['Start a 15-minute Python coding interview', 'Ask me a backend system design question', 'Give me a JavaScript async debugging prompt']
      : ['Suggest my next lesson based on progress', 'Explain what I was just working on', 'Compare REST vs GraphQL trade-offs'];

  const lastMessage = messages[messages.length - 1];
  const canRegenerate = !sending && messages.some((m) => m.role === 'user');
  const hasContext = Boolean(editorContext.code || editorContext.lessonTitle || editorContext.courseTitle);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={editorContext.pathname && editorContext.pathname !== '/ai' ? editorContext.pathname : '/courses'}
            className="btn-secondary inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
              Engineering AI Mentor
            </h1>
            <p className="text-xs text-stone-500">
              Dedicated workspace for code walkthroughs, debugging, and personalized study plans
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isPro && (
            <button
              type="button"
              onClick={() => setUpgradeOpen(true)}
              className="btn-secondary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5 text-sky-700" />
              Unlock Pro Mentor Modes
            </button>
          )}
          {messages.length > 1 && (
            <button
              type="button"
              onClick={handleClear}
              className="btn-secondary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear Chat
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Sidebar: Mentor Modes & Active Context */}
        <aside className="space-y-4 lg:col-span-4 xl:col-span-3">
          <div className="rounded-2xl surface-card p-4">
            <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-stone-500">
              Mentor Mode
            </h2>
            <div className="mt-3 space-y-1.5">
              {MODES.map((m) => {
                const locked = Boolean(m.proOnly && !isPro);
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMode(m.id, m.proOnly)}
                    className={`flex w-full items-start justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-[#E6E3DC] bg-[#FAF9F6] text-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">{m.label}</p>
                      <p className={`mt-0.5 text-[11px] ${active ? 'text-stone-300' : 'text-stone-500'}`}>
                        {m.description}
                      </p>
                    </div>
                    {locked && <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl surface-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-stone-500">
                Attached Context
              </h2>
              {hasContext && (
                <button
                  type="button"
                  onClick={() => setEditorContext({})}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-stone-900 cursor-pointer"
                >
                  <X className="h-3 w-3" /> Detach
                </button>
              )}
            </div>

            {hasContext ? (
              <div className="mt-3 space-y-2 text-xs">
                {editorContext.courseTitle && (
                  <p className="font-semibold text-stone-900">{editorContext.courseTitle}</p>
                )}
                {editorContext.lessonTitle && (
                  <p className="text-stone-600">{editorContext.lessonTitle}</p>
                )}
                {editorContext.code && (
                  <div className="rounded-xl border border-[#E6E3DC] bg-[#FAF9F6] p-2.5">
                    <div className="mb-1 flex items-center gap-1.5 font-mono text-[11px] text-sky-700">
                      <Code2 className="h-3.5 w-3.5" />
                      <span>{editorContext.language || 'code'} snippet attached</span>
                    </div>
                    <pre className="max-h-28 overflow-hidden font-mono text-[11px] text-stone-700">
                      {editorContext.code.slice(0, 240)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-2.5 text-xs leading-relaxed text-stone-500">
                Open any lesson or coding problem first to automatically attach your code or topic here, or ask any engineering question directly.
              </p>
            )}
          </div>
        </aside>

        {/* Main Chat Workspace */}
        <section
          aria-label="AI Mentor Conversation"
          className="flex h-[calc(100vh-14rem)] min-h-[520px] flex-col overflow-hidden rounded-2xl surface-card lg:col-span-8 xl:col-span-9"
        >
          <div className="flex items-center justify-between border-b border-stone-100 bg-white px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#F7F5F0] text-stone-900">
                <MessageSquareCode className="h-4 w-4" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-stone-900">
                  {MODES.find((m) => m.id === mode)?.label}
                </p>
                <p className="text-xs text-stone-500">
                  {user ? `Signed in as ${user.name} · ${user.xp.toLocaleString()} XP` : 'Guest session'}
                </p>
              </div>
            </div>
            <span className="font-mono text-[11px] text-stone-400">
              {isPro ? 'Pro Unlocked' : 'Standard Access'}
            </span>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto bg-[#FAF9F6] px-5 py-5">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isActivelyStreaming = streamingId === msg.id;
              const isLatestAssistant = !isUser && msg.id === lastMessage?.id && msg.id !== 'welcome';

              if (isUser) {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[82%] rounded-2xl bg-stone-900 px-4 py-3 text-white">
                      <MarkdownMessage text={msg.text} isUser />
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex flex-col items-start gap-1.5">
                  <div className="w-full rounded-2xl border border-[#E6E3DC] bg-white px-5 py-4 text-stone-800">
                    <MarkdownMessage text={msg.text} isStreaming={isActivelyStreaming} />
                  </div>
                  {!isActivelyStreaming && msg.id !== 'welcome' && (
                    <div className="flex items-center gap-2 pl-1">
                      <button
                        type="button"
                        onClick={() => handleCopyReply(msg.id, msg.text)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-stone-500 hover:bg-white hover:text-stone-900 transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      {isLatestAssistant && canRegenerate && (
                        <button
                          type="button"
                          onClick={handleRegenerate}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-stone-500 hover:bg-white hover:text-stone-900 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Regenerate</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {sending && !streamingId && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-[#E6E3DC] bg-white px-4 py-3 text-xs text-stone-500">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-stone-100 bg-white px-4 py-3.5">
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {quickPrompts.map((qa) => (
                <button
                  key={qa}
                  type="button"
                  disabled={sending}
                  onClick={() => sendPrompt(qa)}
                  className="rounded-lg border border-[#E6E3DC] bg-[#F7F5F0] px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-300 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {qa}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendPrompt(input);
              }}
              className="flex items-center gap-2.5"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a technical question, paste an error, or request code review..."
                className="flex-1 rounded-full border border-[#E6E3DC] bg-[#FAF9F6] px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
              />
              {sending ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="btn-secondary inline-flex h-10 w-10 items-center justify-center rounded-full cursor-pointer shrink-0"
                  aria-label="Stop generating"
                  title="Stop generating"
                >
                  <Square className="h-3.5 w-3.5 fill-stone-900 text-stone-900" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="btn-primary inline-flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-40 cursor-pointer shrink-0"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>
        </section>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        initialPlan="pro"
      />
    </div>
  );
}
