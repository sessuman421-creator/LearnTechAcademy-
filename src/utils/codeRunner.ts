import type { PracticeProblem } from '../types/academy.ts';

export interface RunResult {
  logs: string[];
  error: string | null;
  passedTests: number;
  totalTests: number;
  testDetails: { label: string; passed: boolean; actual: string; expected: string }[];
  allPassed: boolean;
}

function stableSerialize(val: unknown): string {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number' || typeof val === 'string') return String(val);
  if (Array.isArray(val)) {
    return `[${val.map((v) => (typeof v === 'string' ? JSON.stringify(v) : stableSerialize(v))).join(',')}]`;
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>);
    return `{${entries
      .map(([k, v]) => `${JSON.stringify(k)}:${typeof v === 'string' ? JSON.stringify(v) : stableSerialize(v)}`)
      .join(',')}}`;
  }
  return String(val);
}

function pySerialize(val: unknown): string {
  if (val === null || val === undefined) return 'None';
  if (typeof val === 'boolean') return val ? 'True' : 'False';
  if (typeof val === 'number' || typeof val === 'string') return String(val);
  if (Array.isArray(val)) {
    return `[${val.map((v) => (typeof v === 'string' ? JSON.stringify(v) : pySerialize(v))).join(',')}]`;
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>);
    return `{${entries
      .map(([k, v]) => `${JSON.stringify(k)}:${typeof v === 'string' ? JSON.stringify(v) : pySerialize(v)}`)
      .join(',')}}`;
  }
  return String(val);
}

// Lightweight safe browser-side Python-3 subset transpiler to JS for the 10 Python labs & custom scripts
function transpilePythonLine(expr: string): string {
  // Replace Python string/list slices, keywords, and common methods cleanly
  let out = expr;

  // Protect string literals temporarily
  const strings: string[] = [];
  out = out.replace(/(["'])(?:\\.|(?!\1).)*\1/g, (m) => {
    const idx = strings.length;
    strings.push(m);
    return `__STR_${idx}__`;
  });

  // Replace Python booleans & operators
  out = out
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\s+in\b/g, '__NOT_IN__')
    .replace(/\bnot\s+([a-zA-Z_]\w*)/g, '!__pyTruthy($1)')
    .replace(/\bnot\b/g, '!')
    .replace(/==/g, '===')
    .replace(/!=/g, '!==')
    .replace(/(\([^()]+\)|[a-zA-Z0-9_.\[\]]+)\s*\/\/\s*(\([^()]+\)|[a-zA-Z0-9_.\[\]]+)/g, 'Math.floor(($1)/($2))')
    .replace(/\b(\w+)\s+__NOT_IN__\s+([a-zA-Z_]\w*)/g, '!__pyIn($1, $2)')
    .replace(/\b(\w+)\s+in\s+([a-zA-Z_]\w*)/g, '__pyIn($1, $2)');

  // Python builtins & methods
  out = out
    .replace(/\blen\(([^)]+)\)/g, '__pyLen($1)')
    .replace(/\bstr\(([^)]+)\)/g, 'String($1)')
    .replace(/\bint\(([^)]+)\)/g, 'parseInt($1, 10)')
    .replace(/\bsorted\(([^)]+)\)/g, '__pySorted($1)')
    .replace(/\brange\(([^)]+)\)/g, '__pyRange($1)')
    .replace(/\benumerate\(([^)]+)\)/g, '__pyEnum($1)')
    .replace(/\.append\(/g, '.push(')
    .replace(/\.lower\(\)/g, '.toLowerCase()')
    .replace(/\.upper\(\)/g, '.toUpperCase()')
    .replace(/\.strip\(\)/g, '.trim()')
    .replace(/\.split\(\)/g, '.trim().split(/\\s+/).filter(Boolean)')
    .replace(/\.replace\(/g, '.replaceAll(')
    .replace(/(\w+)\.get\(([^,]+),\s*([^)]+)\)/g, '__pyGet($1, $2, $3)')
    .replace(/(\w+)\.join\(([^)]+)\)/g, '($2).join($1)')
    .replace(/(__STR_\d+__)\.join\(([^)]+)\)/g, '($2).join($1)');

  // Slicing: x[::-1], x[1:], x[:], x[0][:]
  out = out.replace(/(\w+)\[::-1\]/g, '__pyReverse($1)');
  out = out.replace(/([a-zA-Z_]\w*(?:\[\d+\])*)\[(\d+):\]/g, '$1.slice($2)');
  out = out.replace(/([a-zA-Z_]\w*(?:\[\d+\])*)\[:\]/g, '$1.slice()');
  out = out.replace(/(\w+)\[(-?\d+)\]/g, (_, arr, idx) =>
    Number(idx) < 0 ? `${arr}[${arr}.length + (${idx})]` : `${arr}[${idx}]`
  );

  // Restore strings
  out = out.replace(/__STR_(\d+)__/g, (_, i) => strings[Number(i)]);
  return out;
}

function compilePythonToJs(source: string): string {
  const rawLines = source.replace(/\r\n/g, '\n').split('\n');
  const lines: { indent: number; text: string }[] = [];

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = raw.search(/\S/);
    lines.push({ indent, text: trimmed });
  }

  const jsLines: string[] = [];
  const indentStack: number[] = [0];
  const declaredPerScope: Set<string>[] = [new Set()];

  const closeScopesTo = (targetIndent: number) => {
    while (indentStack.length > 1 && targetIndent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      declaredPerScope.pop();
      jsLines.push('}');
    }
  };

  for (const { indent, text } of lines) {
    closeScopesTo(indent);
    const currentScope = declaredPerScope[declaredPerScope.length - 1];

    if (text === 'pass') {
      continue;
    }

    if (text.startsWith('def ')) {
      const m = /^def\s+(\w+)\(([^)]*)\)\s*:$/.exec(text);
      if (!m) throw new Error(`SyntaxError: Invalid function definition "${text}"`);
      const [, fnName, params] = m;
      jsLines.push(`function ${fnName}(${params}) {`);
      indentStack.push(indent + 4);
      const fnScope = new Set<string>(
        params
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
      );
      declaredPerScope.push(fnScope);
      continue;
    }

    if (text.startsWith('if ') && text.endsWith(':')) {
      const cond = transpilePythonLine(text.slice(3, -1).trim());
      jsLines.push(`if (__pyTruthy(${cond})) {`);
      indentStack.push(indent + 4);
      declaredPerScope.push(new Set(currentScope));
      continue;
    }

    if (text.startsWith('elif ') && text.endsWith(':')) {
      const cond = transpilePythonLine(text.slice(5, -1).trim());
      jsLines.push(`else if (__pyTruthy(${cond})) {`);
      indentStack.push(indent + 4);
      declaredPerScope.push(new Set(currentScope));
      continue;
    }

    if (text === 'else:') {
      jsLines.push(`else {`);
      indentStack.push(indent + 4);
      declaredPerScope.push(new Set(currentScope));
      continue;
    }

    if (text.startsWith('while ') && text.endsWith(':')) {
      const cond = transpilePythonLine(text.slice(6, -1).trim());
      jsLines.push(`while (__pyTruthy(${cond})) {`);
      indentStack.push(indent + 4);
      declaredPerScope.push(new Set(currentScope));
      continue;
    }

    if (text.startsWith('for ') && text.endsWith(':')) {
      const m = /^for\s+([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)?)\s+in\s+(.+):$/.exec(text);
      if (!m) throw new Error(`SyntaxError: Invalid for-loop "${text}"`);
      const target = m[1].includes(',') ? `[${m[1]}]` : m[1];
      const iterExpr = transpilePythonLine(m[2].trim());
      jsLines.push(`for (const ${target} of ${iterExpr}) {`);
      indentStack.push(indent + 4);
      const loopScope = new Set(currentScope);
      m[1]
        .split(',')
        .map((v) => v.trim())
        .forEach((v) => loopScope.add(v));
      declaredPerScope.push(loopScope);
      continue;
    }

    if (text.startsWith('return ')) {
      jsLines.push(`return ${transpilePythonLine(text.slice(7).trim())};`);
      continue;
    }
    if (text === 'return') {
      jsLines.push('return null;');
      continue;
    }

    // Simple assignment: var = expr
    const assignMatch = /^([a-zA-Z_]\w*)\s*=\s*(?!=)(.+)$/.exec(text);
    if (assignMatch) {
      const [, varName, rhs] = assignMatch;
      const compiledRhs = transpilePythonLine(rhs);
      if (!currentScope.has(varName)) {
        currentScope.add(varName);
        jsLines.push(`let ${varName} = ${compiledRhs};`);
      } else {
        jsLines.push(`${varName} = ${compiledRhs};`);
      }
      continue;
    }

    // Index/dict assignment or expression
    jsLines.push(`${transpilePythonLine(text)};`);
  }

  closeScopesTo(0);
  return jsLines.join('\n');
}

function buildPythonHelpers() {
  return {
    __pyTruthy: (v: unknown) => {
      if (Array.isArray(v)) return v.length > 0;
      if (v && typeof v === 'object') return Object.keys(v).length > 0;
      return Boolean(v);
    },
    __pyIn: (item: unknown, container: unknown) => {
      if (typeof container === 'string') return container.includes(String(item));
      if (Array.isArray(container)) return container.includes(item);
      if (container && typeof container === 'object') {
        return Object.prototype.hasOwnProperty.call(container, String(item));
      }
      return false;
    },
    __pyLen: (v: unknown) => {
      if (typeof v === 'string' || Array.isArray(v)) return v.length;
      if (v && typeof v === 'object') return Object.keys(v).length;
      return 0;
    },
    __pySorted: (arr: unknown[]) => {
      return [...arr].sort((a, b) => {
        if (Array.isArray(a) && Array.isArray(b)) {
          return Number(a[0]) - Number(b[0]) || Number(a[1]) - Number(b[1]);
        }
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        return String(a).localeCompare(String(b));
      });
    },
    __pyRange: (a: number, b?: number, step = 1) => {
      const start = b === undefined ? 0 : a;
      const end = b === undefined ? a : b;
      const res: number[] = [];
      for (let i = start; step > 0 ? i < end : i > end; i += step) res.push(i);
      return res;
    },
    __pyEnum: (arr: unknown[]) => arr.map((v, i) => [i, v]),
    __pyGet: (obj: Record<string, unknown>, k: string | number, fallback: unknown) =>
      Object.prototype.hasOwnProperty.call(obj, String(k)) ? obj[String(k)] : fallback,
    __pyReverse: (v: string | unknown[]) =>
      typeof v === 'string' ? v.split('').reverse().join('') : [...v].reverse(),
  };
}

export function executePracticeCode(problem: PracticeProblem, code: string): RunResult {
  if (problem.language === 'html') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(code, 'text/html');
    const checks = problem.domChecks ?? [];
    const details = checks.map((chk) => {
      const found = doc.querySelectorAll(chk.selector).length;
      const needed = chk.minCount ?? 1;
      const passed = found >= needed;
      return {
        label: chk.description,
        passed,
        actual: `${found} matched`,
        expected: `>= ${needed} matched`,
      };
    });
    const passedTests = details.filter((d) => d.passed).length;
    return {
      logs: ['Rendered HTML & CSS in isolated preview frame.'],
      error: null,
      passedTests,
      totalTests: details.length,
      testDetails: details,
      allPassed: details.length > 0 && passedTests === details.length,
    };
  }

  if (problem.language === 'javascript') {
    const logs: string[] = [];
    const sandboxConsole = {
      log: (...args: unknown[]) => logs.push(args.map((a) => stableSerialize(a)).join(' ')),
      warn: (...args: unknown[]) => logs.push('WARN: ' + args.map(String).join(' ')),
      error: (...args: unknown[]) => logs.push('ERR: ' + args.map(String).join(' ')),
    };

    try {
      const testCalls = problem.testCases
        .map((t, i) => `try { __results[${i}] = { ok: true, val: (${t.inputExpr}) }; } catch(e) { __results[${i}] = { ok: false, err: e.message }; }`)
        .join('\n');

      const runner = new Function(
        'console',
        `
        "use strict";
        ${code}
        const __results = [];
        ${testCalls}
        return __results;
        `
      );
      const results = runner(sandboxConsole) as { ok: boolean; val?: unknown; err?: string }[];
      const testDetails = problem.testCases.map((tc, idx) => {
        const res = results[idx];
        const actual = res?.ok ? stableSerialize(res.val) : `Error: ${res?.err ?? 'unknown'}`;
        const passed = Boolean(res?.ok && actual === tc.expectedOutput);
        return { label: tc.label, passed, actual, expected: tc.expectedOutput };
      });
      const passedTests = testDetails.filter((t) => t.passed).length;
      return {
        logs,
        error: null,
        passedTests,
        totalTests: testDetails.length,
        testDetails,
        allPassed: testDetails.length > 0 && passedTests === testDetails.length,
      };
    } catch (err) {
      return {
        logs,
        error: err instanceof Error ? err.message : String(err),
        passedTests: 0,
        totalTests: problem.testCases.length,
        testDetails: [],
        allPassed: false,
      };
    }
  }

  // Python runner
  const logs: string[] = [];
  const helpers = buildPythonHelpers();
  const print = (...args: unknown[]) => logs.push(args.map((a) => pySerialize(a)).join(' '));
  const max = (...args: unknown[]) => Math.max(...(args as number[]));
  const min = (...args: unknown[]) => Math.min(...(args as number[]));
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const abs = Math.abs;

  try {
    const compiledUser = compilePythonToJs(code);
    const testEvalJs = problem.testCases
      .map((tc, i) => {
        const exprJs = transpilePythonLine(tc.inputExpr ?? 'None');
        return `try { __results[${i}] = { ok: true, val: (${exprJs}) }; } catch(e) { __results[${i}] = { ok: false, err: e.message }; }`;
      })
      .join('\n');

    const fn = new Function(
      'print',
      'max',
      'min',
      'sum',
      'abs',
      ...Object.keys(helpers),
      `
      "use strict";
      ${compiledUser}
      const __results = [];
      ${testEvalJs}
      return __results;
      `
    );

    const results = fn(
      print,
      max,
      min,
      sum,
      abs,
      ...Object.values(helpers)
    ) as { ok: boolean; val?: unknown; err?: string }[];

    const testDetails = problem.testCases.map((tc, idx) => {
      const res = results[idx];
      const actual = res?.ok ? pySerialize(res.val) : `Error: ${res?.err ?? 'unknown'}`;
      const passed = Boolean(res?.ok && actual === tc.expectedOutput);
      return { label: tc.label, passed, actual, expected: tc.expectedOutput };
    });

    const passedTests = testDetails.filter((t) => t.passed).length;
    return {
      logs,
      error: null,
      passedTests,
      totalTests: testDetails.length,
      testDetails,
      allPassed: testDetails.length > 0 && passedTests === testDetails.length,
    };
  } catch (err) {
    return {
      logs,
      error: err instanceof Error ? err.message : String(err),
      passedTests: 0,
      totalTests: problem.testCases.length,
      testDetails: [],
      allPassed: false,
    };
  }
}
