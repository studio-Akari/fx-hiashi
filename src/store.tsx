// 記録と設定（端末の中だけに保存）
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Dir, PairId, QuizRec, Vote } from './core';

export type QuizCur = { pair: PairId; t: string; Y: number; answered: QuizRec | null; dir: Dir | null; memo: string };
export type State = {
  pair: PairId;
  tDays: number; tRec: number; qDays: number; qRec: number;
  votes: Record<string, Vote>;
  quiz: QuizRec[];
  quizCur: QuizCur | null;
  quizDone: number;
  seen: Record<string, 1>;
  lastTitle?: number;
  notifId?: string | null;
};
export const DEFAULTS: State = {
  pair: 'USDJPY', tDays: 60, tRec: 20, qDays: 60, qRec: 20,
  votes: {}, quiz: [], quizCur: null, quizDone: 0, seen: {}, notifId: null,
};
const KEY = 'fxhiashi.v1';

type Ctx = { st: State; set: (f: (s: State) => State) => void; ready: boolean; replace: (s: State) => void };
const C = createContext<Ctx>(null as any);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [st, setSt] = useState<State>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(s => { if (s) setSt({ ...DEFAULTS, ...JSON.parse(s) }); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  const persist = (s: State) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {}); }, 150);
  };
  const set = useCallback((f: (s: State) => State) => {
    setSt(prev => { const n = f(prev); persist(n); return n; });
  }, []);
  const replace = useCallback((s: State) => { setSt(s); persist(s); }, []);
  return <C.Provider value={{ st, set, ready, replace }}>{children}</C.Provider>;
}
export const useStore = () => useContext(C);

/* ---------- 引き継ぎコード ---------- */
// 記録と設定をまとめて文字列にする（機種変更用）
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function utf8(s: string) { return unescape(encodeURIComponent(s)); }
function fromUtf8(s: string) { return decodeURIComponent(escape(s)); }
function b64(s: string) {
  let o = '';
  for (let i = 0; i < s.length; i += 3) {
    const a = s.charCodeAt(i), b = s.charCodeAt(i + 1), c = s.charCodeAt(i + 2);
    const n = (a << 16) | ((b || 0) << 8) | (c || 0);
    o += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (isNaN(b) ? '=' : B64[(n >> 6) & 63]) + (isNaN(c) ? '=' : B64[n & 63]);
  }
  return o;
}
function unb64(s: string) {
  s = s.replace(/[^A-Za-z0-9+/]/g, '');
  let o = '';
  for (let i = 0; i < s.length; i += 4) {
    const n = (B64.indexOf(s[i]) << 18) | (B64.indexOf(s[i + 1]) << 12) | ((B64.indexOf(s[i + 2]) & 63) << 6) | (B64.indexOf(s[i + 3]) & 63);
    o += String.fromCharCode((n >> 16) & 255);
    if (s[i + 2] !== undefined) o += String.fromCharCode((n >> 8) & 255);
    if (s[i + 3] !== undefined) o += String.fromCharCode(n & 255);
  }
  return o;
}
export function exportCode(st: State) { return 'FXH1:' + b64(utf8(JSON.stringify({ ...st, notifId: null }))); }
export function importCode(code: string): State | null {
  try {
    const t = code.trim();
    if (!t.startsWith('FXH1:')) return null;
    const o = JSON.parse(fromUtf8(unb64(t.slice(5))));
    if (!o || !Array.isArray(o.quiz) || typeof o.votes !== 'object') return null;
    return { ...DEFAULTS, ...o, notifId: null };
  } catch {
    return null;
  }
}
