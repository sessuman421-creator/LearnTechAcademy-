import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="my-2.5 overflow-hidden rounded-xl border border-[#E6E3DC] bg-[#FAF9F6]">
      <div className="flex items-center justify-between border-b border-[#E6E3DC] bg-[#F3F1EC] px-3 py-1.5 text-[11px] text-stone-600">
        <span className="font-mono font-medium lowercase">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium text-stone-700 hover:bg-white hover:text-stone-900 transition-colors cursor-pointer"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto bg-white p-3 font-mono text-xs leading-relaxed text-stone-900">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInline(text: string, isUser: boolean): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={`c-${keyIdx++}`}
          className={`rounded-md px-1.5 py-0.5 font-mono text-[12px] ${
            isUser
              ? 'bg-white/15 text-white'
              : 'border border-[#E6E3DC] bg-[#F3F1EC] text-stone-900'
          }`}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={`b-${keyIdx++}`} className={isUser ? 'font-semibold text-white' : 'font-semibold text-stone-900'}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(
        <em key={`i-${keyIdx++}`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        if (href.startsWith('/')) {
          nodes.push(
            <Link
              key={`l-${keyIdx++}`}
              to={href}
              className={`font-medium underline underline-offset-2 ${
                isUser ? 'text-sky-200 hover:text-white' : 'text-sky-700 hover:text-sky-900'
              }`}
            >
              {label}
            </Link>
          );
        } else if (href.startsWith('https://') || href.startsWith('http://')) {
          nodes.push(
            <a
              key={`a-${keyIdx++}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-medium underline underline-offset-2 ${
                isUser ? 'text-sky-200 hover:text-white' : 'text-sky-700 hover:text-sky-900'
              }`}
            >
              {label}
            </a>
          );
        } else {
          nodes.push(label);
        }
      } else {
        nodes.push(token);
      }
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderMarkdownProse(blockText: string, isUser: boolean): React.ReactNode {
  const lines = blockText.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      elements.push(<hr key={`hr-${i}`} className="my-3 border-[#E6E3DC]" />);
      i++;
      continue;
    }

    // Headings (#, ##, ###, ####)
    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const sizeClass =
        level === 1
          ? 'text-base font-bold mt-3 mb-1.5'
          : level === 2
          ? 'text-[15px] font-bold mt-3 mb-1.5'
          : 'text-sm font-semibold mt-2.5 mb-1';
      elements.push(
        <h3
          key={`h-${i}`}
          className={`font-display ${sizeClass} ${isUser ? 'text-white' : 'text-stone-900'}`}
        >
          {renderInline(content, isUser)}
        </h3>
      );
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <blockquote
          key={`q-${i}`}
          className="my-2 rounded-xl border border-[#E6E3DC] bg-[#FAF9F6] px-3.5 py-2.5 text-[13px] text-stone-700"
        >
          {quoteLines.map((ql, idx) => (
            <p key={idx} className={idx > 0 ? 'mt-1' : ''}>
              {renderInline(ql, isUser)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Unordered list (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-2 list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, isUser)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list (1. 2. 3.)
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-2 list-decimal space-y-1.5 pl-5 text-[13.5px] leading-relaxed">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, isUser)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph (consume consecutive prose lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,4}\s+|[-*]\s+|\d+\.\s+|>\s+|---|\*\*\*)/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    elements.push(
      <p key={`p-${i}`} className="my-1.5 text-[13.5px] leading-[1.6]">
        {renderInline(paraLines.join(' '), isUser)}
      </p>
    );
  }

  return elements;
}

interface MarkdownMessageProps {
  text: string;
  isUser?: boolean;
  isStreaming?: boolean;
}

export function MarkdownMessage({ text, isUser = false, isStreaming = false }: MarkdownMessageProps) {
  // Split into fenced code blocks (supports both closed and still-streaming unclosed trailing blocks)
  const segments: { type: 'text' | 'code'; content: string; lang?: string }[] = [];
  const fenceRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ type: 'text', content: text.slice(lastIdx, match.index) });
    }
    segments.push({
      type: 'code',
      lang: match[1] || 'code',
      content: match[2].replace(/\n$/, ''),
    });
    lastIdx = fenceRegex.lastIndex;
  }

  const remainder = text.slice(lastIdx);
  if (remainder) {
    const openFenceMatch = /^([\s\S]*?)```([a-zA-Z0-9_-]*)\n?([\s\S]*)$/.exec(remainder);
    if (openFenceMatch) {
      if (openFenceMatch[1]) {
        segments.push({ type: 'text', content: openFenceMatch[1] });
      }
      segments.push({
        type: 'code',
        lang: openFenceMatch[2] || 'code',
        content: openFenceMatch[3],
      });
    } else {
      segments.push({ type: 'text', content: remainder });
    }
  }

  return (
    <div className={isUser ? 'text-white' : 'text-stone-800'}>
      {segments.map((seg, idx) =>
        seg.type === 'code' ? (
          <CodeBlock key={`cb-${idx}`} language={seg.lang || 'code'} code={seg.content} />
        ) : (
          <div key={`tx-${idx}`}>{renderMarkdownProse(seg.content, isUser)}</div>
        )
      )}
      {isStreaming && (
        <span
          aria-hidden="true"
          className="ml-1 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse rounded-xs bg-stone-500"
        />
      )}
    </div>
  );
}
