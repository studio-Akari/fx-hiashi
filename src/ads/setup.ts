// 起動時：同意の確認（ヨーロッパ向け）→ iPhoneの追跡許可 → 広告の準備
import { Platform } from 'react-native';
import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

let started: Promise<boolean> | null = null;
export function startAds(): Promise<boolean> {
  if (!started) {
    started = (async () => {
      try { await AdsConsent.gatherConsent(); } catch {}
      if (Platform.OS === 'ios') { try { await requestTrackingPermissionsAsync(); } catch {} }
      let ok = true;
      try { ok = (await AdsConsent.getConsentInfo()).canRequestAds; } catch {}
      if (!ok) return false;
      try { await mobileAds().initialize(); } catch {}
      return true;
    })();
  }
  return started;
}
