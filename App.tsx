import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Pressable, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MPLUSRounded1c_800ExtraBold } from '@expo-google-fonts/m-plus-rounded-1c/800ExtraBold';
import { ZenKakuGothicNew_400Regular } from '@expo-google-fonts/zen-kaku-gothic-new/400Regular';
import { ZenKakuGothicNew_700Bold } from '@expo-google-fonts/zen-kaku-gothic-new/700Bold';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono/600SemiBold';
import { Banner } from './src/ads/Banner';
import { preloadInter, showInter } from './src/ads/inter';
import { Ecb, Market, TITLES, titleIdx } from './src/core';
import { fetchRemote, loadLocal } from './src/data';
import { points, RankBar } from './src/screens/common';
import { Log } from './src/screens/Log';
import { Quiz } from './src/screens/Quiz';
import { Settings } from './src/screens/Settings';
import { Today } from './src/screens/Today';
import { StoreProvider, useStore } from './src/store';
import { T, ThemeProvider, useTheme } from './src/theme';
import { Seg } from './src/ui';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fonts] = useFonts({ MPLUSRounded1c_800ExtraBold, ZenKakuGothicNew_400Regular, ZenKakuGothicNew_700Bold, IBMPlexMono_500Medium, IBMPlexMono_600SemiBold });
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StoreProvider>
          {fonts ? <Main /> : null}
        </StoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

type View_ = 'quiz' | 'today' | 'log';

function Main() {
  const { c, dark } = useTheme();
  const ins = useSafeAreaInsets();
  const { st, set, ready } = useStore();
  const [ecb, setEcb] = useState<Ecb | null>(null);
  const [view, setView] = useState<View_>('quiz');
  const [settings, setSettings] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mockAd, setMockAd] = useState<null | { n: number; done: () => void }>(null);
  const scroll = useRef<ScrollView>(null);
  const ecbRef = useRef<Ecb | null>(null);
  ecbRef.current = ecb;
  const tt = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((s: string) => {
    setMsg(s);
    if (tt.current) clearTimeout(tt.current);
    tt.current = setTimeout(() => setMsg(null), 2800);
  }, []);

  // データ：まず手元の分で起動し、裏で最新を取りにいく
  useEffect(() => {
    let alive = true;
    loadLocal().then(e => {
      if (!alive) return;
      setEcb(e);
      SplashScreen.hideAsync().catch(() => {});
      fetchRemote(e).then(n => { if (n && alive) setEcb(n); });
    });
    const sub = AppState.addEventListener('change', s => {
      const cur = ecbRef.current;
      if (s === 'active' && cur) fetchRemote(cur).then(n => { if (n) setEcb(n); });
    });
    preloadInter();
    return () => { alive = false; sub.remove(); };
  }, []);
  const m = useMemo(() => (ecb ? new Market(ecb) : null), [ecb]);

  // 称号が上がったら知らせる
  useEffect(() => {
    if (!m || !ready) return;
    const i = titleIdx(points(m, st));
    if (st.lastTitle === undefined || i < st.lastTitle) { set(s => ({ ...s, lastTitle: i })); return; }
    if (i > st.lastTitle) { set(s => ({ ...s, lastTitle: i })); toast(`称号「${TITLES[i][1]}」を獲得しました！`); }
  }, [m, ready, st.quiz.length, st.seen, st.votes]);

  const onNext = (go: () => void) => {
    const done = () => { go(); scroll.current?.scrollTo({ y: 0, animated: false }); };
    if (st.quizDone > 0 && st.quizDone % 5 === 0) {
      if (Platform.OS === 'web') setMockAd({ n: 3, done }); else showInter(done);
    } else done();
  };
  useEffect(() => {
    if (!mockAd || mockAd.n <= 0) return;
    const t = setTimeout(() => setMockAd(a => (a ? { ...a, n: a.n - 1 } : a)), 1000);
    return () => clearTimeout(t);
  }, [mockAd]);

  if (!m || !ready) return <View style={{ flex: 1, backgroundColor: c.screen }} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.screen }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={{ paddingTop: ins.top + 10, paddingLeft: 20, paddingRight: 16, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T f="disp" size={18}>FX日足<T f="disp" size={18} color={c.coin}>過去問</T></T>
        <Pressable onPress={() => setSettings(true)} accessibilityLabel="設定"
          style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
          <T size={20} color={c.ink}>⚙</T>
        </Pressable>
      </View>
      <RankBar m={m} st={st} />
      <View style={{ marginHorizontal: 20, marginBottom: 8 }}>
        <Seg items={[['quiz', '過去問'], ['today', '今日の予想'], ['log', '記録']]} value={view}
          onChange={v => { setView(v); scroll.current?.scrollTo({ y: 0, animated: false }); }} />
      </View>
      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20, gap: 12 }} keyboardShouldPersistTaps="handled">
        {view === 'quiz' && <Quiz m={m} onAnswered={() => scroll.current?.scrollTo({ y: 0, animated: true })} onNext={onNext} />}
        {view === 'today' && <Today m={m} toast={toast} onResultSeen={() => {}} />}
        {view === 'log' && <Log m={m} />}
        <T size={10.5} color={c.ink3} style={{ textAlign: 'center', paddingHorizontal: 8 }}>
          為替レート：欧州中央銀行（ECB）参照レート（1日1回、中欧時間14:10ごろの値）。ユーロ以外の通貨ペアはECBのレートから計算した値です。本アプリは投資助言を行うものではありません。
        </T>
      </ScrollView>
      <View style={{ paddingBottom: ins.bottom, backgroundColor: c.surface }}><Banner /></View>

      <Settings m={m} visible={settings} onClose={() => setSettings(false)} toast={toast} />

      {msg ? (
        <Pressable onPress={() => setMsg(null)} style={{ position: 'absolute', left: 16, right: 16, top: ins.top + 60, backgroundColor: c.ink, borderRadius: 14, padding: 13 }}>
          <T f="bold" size={13.5} color={c.screen}>{msg}</T>
        </Pressable>
      ) : null}

      {mockAd ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
          <T size={11} color={c.screen}>ADVERTISEMENT</T>
          <View style={{ width: 260, height: 340, borderWidth: 1, borderStyle: 'dashed', borderColor: c.screen, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
            <T color={c.screen}>全画面広告（見本）</T><T size={12} color={c.screen}>5問ごとに表示</T>
          </View>
          <Pressable disabled={mockAd.n > 0} onPress={() => { const d = mockAd.done; setMockAd(null); d(); }}
            style={{ borderWidth: 1, borderColor: c.screen, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8, opacity: mockAd.n > 0 ? 0.4 : 1 }}>
            <T color={c.screen}>{mockAd.n > 0 ? `閉じる（${mockAd.n}）` : '閉じる'}</T>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
