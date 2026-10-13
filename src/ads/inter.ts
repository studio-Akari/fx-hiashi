// 5問ごとの全画面広告。読み込めていなければ出さずに先へ進む
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import { INTER_ID } from './ids';
import { startAds } from './setup';

let ad: InterstitialAd | null = null;
let loaded = false;
function prepare() {
  if (!INTER_ID) return;
  ad = InterstitialAd.createForAdRequest(INTER_ID);
  loaded = false;
  ad.addAdEventListener(AdEventType.LOADED, () => { loaded = true; });
  ad.addAdEventListener(AdEventType.ERROR, () => { loaded = false; });
  ad.load();
}
export function preloadInter() { startAds().then(ok => { if (ok && !ad) prepare(); }); }
export function showInter(done: () => void) {
  if (!ad || !loaded) { done(); if (!ad) preloadInter(); return; }
  const cur = ad;
  const off = cur.addAdEventListener(AdEventType.CLOSED, () => { off(); done(); prepare(); });
  cur.show().catch(() => { off(); done(); prepare(); });
}
