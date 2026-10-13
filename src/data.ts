// レートデータの読み込み：アプリ同梱分 → 端末に保存した分 → 毎日更新される公開ファイルの順に、新しいものを使う
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Ecb } from './core';

export const DATA_URL = 'https://studio-akari.github.io/fx-hiashi/ecb.json';
const CACHE_KEY = 'fxhiashi.ecb';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bundled: Ecb = require('../ecb.json');

const valid = (e: any): e is Ecb =>
  e && Array.isArray(e.d) && e.d.length > 1000 && ['usd', 'jpy', 'gbp', 'aud'].every(k => Array.isArray(e[k]) && e[k].length === e.d.length);
const newer = (a: Ecb, b: Ecb) => (b.d[b.d.length - 1] > a.d[a.d.length - 1] ? b : a);

export async function loadLocal(): Promise<Ecb> {
  try {
    const s = await AsyncStorage.getItem(CACHE_KEY);
    if (s) { const e = JSON.parse(s); if (valid(e)) return newer(bundled, e); }
  } catch {}
  return bundled;
}

// 取得できなかったときは null（今あるデータのまま動く）
export async function fetchRemote(current: Ecb): Promise<Ecb | null> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 15000);
    const r = await fetch(DATA_URL + '?t=' + Math.floor(Date.now() / 600000), { signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    const e = await r.json();
    if (!valid(e)) return null;
    const n = newer(current, e);
    if (n === current) return null;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(e)).catch(() => {});
    return n;
  } catch {
    return null;
  }
}
