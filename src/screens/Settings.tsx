import { useState } from 'react';
import { Modal, Pressable, ScrollView, Share, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TEST_MODE } from '../ads/ids';
import { lab, Market } from '../core';
import { DEFAULTS, exportCode, importCode, State, useStore } from '../store';
import { F, T, useTheme } from '../theme';
import { Primary, Secondary, Sub } from '../ui';

const FIELDS: [keyof State, string, string, number, number][] = [
  ['qDays', '過去問：チャートの表示日数', '日', 10, 500],
  ['qRec', '過去問：「直近」の集計問題数', '問', 5, 500],
  ['tDays', '今日の予想：チャートの表示日数', '日', 10, 500],
  ['tRec', '今日の予想：「直近」の集計日数', '日', 5, 365],
];

export function Settings({ m, visible, onClose, toast }: { m: Market; visible: boolean; onClose: () => void; toast: (s: string) => void }) {
  const { c } = useTheme();
  const ins = useSafeAreaInsets();
  const { st, set, replace } = useStore();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [code, setCode] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);
  const shown = (k: keyof State) => vals[k as string] ?? String(st[k]);
  const close = () => {
    set(s0 => {
      const n = { ...s0 } as any;
      FIELDS.forEach(([k, , , lo, hi]) => { const v = Math.round(Number(vals[k as string])); if (v) n[k] = Math.max(lo, Math.min(hi, v)); });
      return n;
    });
    setVals({}); setConfirmWipe(false); onClose();
  };
  const share = () => { Share.share({ message: exportCode(st) }).catch(() => {}); };
  const restore = () => {
    const s = importCode(code);
    if (!s) { toast('引き継ぎコードを読み取れませんでした。コピーした文字をすべて貼り付けてください'); return; }
    replace(s); setCode(''); toast('記録を引き継ぎました'); onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: c.scrim }}>
        <Pressable style={{ flex: 0.12 }} onPress={close} accessibilityLabel="閉じる" />
        <View style={{ flex: 0.88, backgroundColor: c.screen, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: ins.bottom }}>
          <View style={{ width: 40, height: 5, borderRadius: 5, backgroundColor: c.line, alignSelf: 'center', marginTop: 8 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <T f="bold" size={17} style={{ flex: 1 }}>設定</T>
            <Pressable onPress={close} accessibilityLabel="閉じる" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}><T size={20}>✕</T></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
            {FIELDS.map(([k, label, u]) => (
              <View key={k as string} style={{ gap: 6 }}>
                <T f="bold" size={14}>{label}</T>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 12, paddingHorizontal: 12 }}>
                  <TextInput value={shown(k)} onChangeText={t => setVals(v => ({ ...v, [k]: t.replace(/[^0-9]/g, '') }))} keyboardType="number-pad"
                    style={{ flex: 1, fontFamily: F.num, fontSize: 16, color: c.ink, paddingVertical: 11 }} />
                  <T size={13} color={c.ink2}>{u}</T>
                </View>
              </View>
            ))}
            <Sub>過去問の表示日数は、次の問題から反映されます。</Sub>

            <View style={{ gap: 8 }}>
              <T f="bold" size={12} color={c.ink3} style={{ letterSpacing: 1 }}>機種変更（引き継ぎコード）</T>
              <Sub>記録はこの端末の中だけに保存されています。機種変更のときは、前の端末で「コードを書き出す」を押してメモなどに保存し、新しい端末で貼り付けてください。</Sub>
              <Secondary label="コードを書き出す" onPress={share} />
              <TextInput value={code} onChangeText={setCode} placeholder="ここに引き継ぎコードを貼り付け" placeholderTextColor={c.ink3} multiline
                style={{ minHeight: 60, borderWidth: 1, borderColor: c.line, borderRadius: 12, backgroundColor: c.surface, padding: 10, fontFamily: F.num, fontSize: 12, color: c.ink }} />
              <Primary label="このコードで引き継ぐ" onPress={restore} disabled={!code.trim()} />
            </View>

            <View style={{ gap: 4 }}>
              <T f="bold" size={12} color={c.ink3} style={{ letterSpacing: 1 }}>データについて</T>
              <Sub>為替レートは欧州中央銀行（ECB）の参照レートです（1日1回、中欧時間14:10ごろの値）。ユーロ以外の通貨ペアはECBのレートから計算した値です。ECBはこのレートを無料で公開しています。</Sub>
              <Sub>過去問の出題範囲：{lab(m.ecb.d[m.qStart], true)} 〜 {lab(m.ecb.d[m.N - 1], true)}（{(m.N - m.qStart).toLocaleString()}営業日）</Sub>
              <Sub>本アプリは練習用で、取引機能はありません。投資助言を行うものではありません。</Sub>
            </View>

            {TEST_MODE ? (
              <View style={{ gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.test, borderRadius: 12, padding: 12 }}>
                <T f="bold" size={12} color={c.test}>TEST ONLY（本番には入りません）</T>
                <Secondary color={c.test} label="（TEST）過去問の正解を10件追加する" onPress={() => {
                  set(s0 => ({ ...s0, quiz: [...s0.quiz, ...Array.from({ length: 10 }, (_, k) => ({ pair: s0.pair, base: m.ecb.d[m.qStart + k], dir: 'up' as const, memo: '（TEST）', out: 'win' as const, diff: 0, date: m.ecb.d[m.qStart + k + 1], at: Date.now() }))] }));
                  toast('正解を10件追加しました');
                }} />
                <Secondary color={c.test} label={confirmWipe ? '（TEST）もう一度押すと全部消えます' : '（TEST）すべての記録を消す'} onPress={() => {
                  if (!confirmWipe) { setConfirmWipe(true); return; }
                  replace({ ...DEFAULTS, pair: st.pair }); setConfirmWipe(false); toast('すべての記録を消しました');
                }} />
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
