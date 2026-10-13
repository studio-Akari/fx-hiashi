// データと判定の中身（画面に依存しない部分）

export type Ecb = { latest: string; d: string[]; usd: number[]; jpy: number[]; gbp: number[]; aud: number[] };
export type Dir = 'up' | 'down';
export type Out = 'win' | 'lose' | 'draw';
export type PairId = 'USDJPY' | 'EURJPY' | 'GBPJPY' | 'AUDJPY' | 'EURUSD' | 'GBPUSD';

export const PAIRS: { id: PairId; name: string }[] = [
  { id: 'USDJPY', name: 'USD/JPY' },
  { id: 'EURJPY', name: 'EUR/JPY' },
  { id: 'GBPJPY', name: 'GBP/JPY' },
  { id: 'AUDJPY', name: 'AUD/JPY' },
  { id: 'EURUSD', name: 'EUR/USD' },
  { id: 'GBPUSD', name: 'GBP/USD' },
];
export const pairName = (p: PairId) => PAIRS.find(x => x.id === p)!.name;
const isJ = (p: PairId) => p.endsWith('JPY');
export const decOf = (p: PairId) => (isJ(p) ? 3 : 4);
export const fv = (v: number, p: PairId) => v.toFixed(decOf(p));
export function fdiff(d: number, p: PairId) {
  const s = d > 0 ? '+' : d < 0 ? '−' : '±';
  const a = Math.abs(d);
  return isJ(p) ? s + a.toFixed(3) + '円' : s + (a * 10000).toFixed(1) + 'pips';
}
// ECBの値は丸めがあるので、表示桁で同じなら「同値」
export const same = (a: number, b: number, p: PairId) => a.toFixed(decOf(p)) === b.toFixed(decOf(p));

export class Market {
  ecb: Ecb;
  N: number;
  idx: Record<string, number> = {};
  qStart: number;
  private cache: Partial<Record<PairId, number[]>> = {};
  constructor(ecb: Ecb) {
    this.ecb = ecb;
    this.N = ecb.d.length;
    ecb.d.forEach((d, i) => (this.idx[d] = i));
    this.qStart = Math.max(0, ecb.d.findIndex(d => d >= '20160101')); // 過去問は2016年以降
  }
  ser(p: PairId): number[] {
    if (!this.cache[p]) {
      const e = this.ecb;
      const f: Record<PairId, (i: number) => number> = {
        USDJPY: i => e.jpy[i] / e.usd[i],
        EURJPY: i => e.jpy[i],
        GBPJPY: i => e.jpy[i] / e.gbp[i],
        AUDJPY: i => e.jpy[i] / e.aud[i],
        EURUSD: i => e.usd[i],
        GBPUSD: i => e.usd[i] / e.gbp[i],
      };
      this.cache[p] = e.d.map((_, i) => f[p](i));
    }
    return this.cache[p]!;
  }
}

/* ---------- 日付と時刻 ---------- */
const WD = '日月火水木金土';
export const ymd = (s: string) => [+s.slice(0, 4), +s.slice(4, 6), +s.slice(6, 8)];
export const dateMs = (s: string) => { const [y, m, d] = ymd(s); return Date.UTC(y, m - 1, d); };
export function lab(s: string, full = false) {
  const [y, m, d] = ymd(s);
  const w = WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return (full ? y + '/' : '') + m + '/' + d + '（' + w + '）';
}
export const slash = (s: string) => { const [y, m, d] = ymd(s); return `${y}/${m}/${d}`; };
function lastSun(y: number, m: number) {
  const d = new Date(Date.UTC(y, m + 1, 0));
  return Date.UTC(y, m, d.getUTCDate() - d.getUTCDay(), 1);
}
function cest(ms: number) { const y = new Date(ms).getUTCFullYear(); return ms >= lastSun(y, 2) && ms < lastSun(y, 9); }
// ECBの公表は中欧時間16:00ごろ（日本時間23:00／冬24:00）。その日の値の公表時刻
export function pubTime(s: string) { const t = dateMs(s); return t + (cest(t + 12 * 3600e3) ? 14 : 15) * 3600e3; }
export function nextWeekday(s: string) {
  let t = dateMs(s);
  do { t += 86400e3; } while ([0, 6].includes(new Date(t).getUTCDay()));
  const d = new Date(t);
  return d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0');
}
export function jst(ms: number) {
  const d = new Date(ms + 9 * 3600e3);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
export function left(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}時間${m}分` : `${m}分`;
}

/* ---------- 記録 ---------- */
export type Vote = { pair: PairId; base: string; dir: Dir; memo: string; at: number };
export type QuizRec = Vote & { out: Out; diff: number; date: string };
export type Judged = Vote & { out: Out; diff: number; date: string; val: number };

export function judgeVote(m: Market, v: Vote, last: number): Judged | null {
  const b = m.idx[v.base];
  if (b === undefined || b + 1 > last) return null;
  const s = m.ser(v.pair), a = s[b], c = s[b + 1];
  const out: Out = same(a, c, v.pair) ? 'draw' : (c > a) === (v.dir === 'up') ? 'win' : 'lose';
  return { ...v, out, diff: c - a, date: m.ecb.d[b + 1], val: c };
}
export function rate(list: { out: string }[]) {
  const j = list.filter(x => x.out === 'win' || x.out === 'lose');
  const w = j.filter(x => x.out === 'win').length;
  return { n: j.length, w, r: j.length ? (w / j.length) * 100 : null as number | null };
}
// 古い順の記録から連続正解を数える（同値は数えず、途切れさせない）
export function streaks(list: { out: string }[]) {
  let cur = 0, max = 0;
  list.forEach(v => { if (v.out === 'win') { cur++; if (cur > max) max = cur; } else if (v.out === 'lose') cur = 0; });
  return { cur, max };
}

/* ---------- 称号 ---------- */
export const TITLES: [number, string][] = [
  [0, 'はじめの一本'], [1, 'ファーストエントリー'], [10, 'チャートウォッチャー'], [50, 'トレンドハンター'],
  [100, 'ローソク足マイスター'], [200, '波動の読み手'], [300, '相場の目利き'], [400, 'チャートの職人'],
  [500, '相場観の達人'], [600, '為替の策士'], [700, '千里眼'], [800, '相場の賢者'], [900, '伝説の目利き'], [1000, '相場の神'],
];
export function titleIdx(p: number) { let i = 0; TITLES.forEach((t, j) => { if (p >= t[0]) i = j; }); return i; }
