// 広告ユニットID（AdMobでこのアプリを登録したら、空欄に本番のIDを入れる）
import { Platform } from 'react-native';
const REAL = {
  ios: { banner: 'ca-app-pub-5799580988110189/3752101140', inter: 'ca-app-pub-5799580988110189/1125937803' },
  android: { banner: '', inter: '' },
};
// テスト版（preview）と開発中は、Googleのテスト広告を出す
export const TEST_MODE = __DEV__ || process.env.EXPO_PUBLIC_TEST === '1';
const GOOGLE_TEST = {
  ios: { banner: 'ca-app-pub-3940256099942544/2435281174', inter: 'ca-app-pub-3940256099942544/4411468910' },
  android: { banner: 'ca-app-pub-3940256099942544/9214589741', inter: 'ca-app-pub-3940256099942544/1033173712' },
};
function pick(kind: 'banner' | 'inter'): string | null {
  const os = Platform.OS === 'ios' ? 'ios' : 'android';
  if (TEST_MODE) return GOOGLE_TEST[os][kind];
  return REAL[os][kind] || null;
}
export const BANNER_ID = pick('banner');
export const INTER_ID = pick('inter');
