import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { fdiff, judgeVote, lab, Market, pairName, rate } from '../core';
import { useStore } from '../store';
import { T, useTheme } from '../theme';
import { Chip, H3, Panel, Pills, Sub } from '../ui';

// FX口座の紹介リンク（アフィリエイト）。提携が決まったら入れる。空欄の間は「見本」表示
const AFFILIATE_URL = '';

export function Log({ m }: { m: Market }) {
  const { c } = useTheme();
  const { st } = useStore();
  const [kind, setKind] = useState<'all' | 'quiz' | 'today'>('quiz');
  const [res, setRes] = useState<'all' | 'win' | 'lose' | 'memo'>('all');
  const last = m.N - 1;
  type Row = { kind: 'today' | 'quiz'; pair: any; base: string; dir: 'up' | 'down'; memo: string; at: number; out: string; diff?: number; date?: string };
  const rows: Row[] = [];
  Object.values(st.votes).forEach(v => { const j = judgeVote(m, v, last); rows.push(j ? { kind: 'today', ...j } : { kind: 'today', ...v, out: 'pend' }); });
  st.quiz.forEach(v => rows.push({ kind: 'quiz', ...v }));
  let list = rows.sort((a, b) => (b.at || 0) - (a.at || 0));
  if (kind !== 'all') list = list.filter(v => v.kind === kind);
  if (res === 'win' || res === 'lose') list = list.filter(v => v.out === res);
  if (res === 'memo') list = list.filter(v => v.memo);
  const r = rate(list);
  const L = { win: '的中', lose: '外れ', draw: '同値', pend: '判定待ち' } as Record<string, string>;
  return (
    <View style={{ gap: 12 }}>
      <Pills items={[['all', 'すべて'], ['quiz', '過去問'], ['today', '今日の予想']]} value={kind} onChange={setKind} />
      <Pills items={[['all', '結果すべて'], ['win', '的中'], ['lose', '外れ'], ['memo', 'メモあり']]} value={res} onChange={setRes} />
      {list.length ? <Sub>{list.length}件{r.n ? ` ／ 的中率 ${r.r!.toFixed(1)}%（${r.w}/${r.n}）` : ''}</Sub> : null}
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, overflow: 'hidden' }}>
        {!list.length ? <View style={{ padding: 16, alignItems: 'center' }}><Sub>該当する記録はまだありません。</Sub></View> : null}
        {list.slice(0, 200).map((v, i) => (
          <View key={v.kind + v.base + v.at + i} style={{ paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: v.dir === 'up' ? c.upSoft : c.downSoft }}>
                <T f="bold" size={13} color={v.dir === 'up' ? c.up : c.down}>{v.dir === 'up' ? '▲' : '▼'}</T>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T f="bold" size={13} numberOfLines={1}>{pairName(v.pair)}　{lab(v.base, true)}</T>
                <T size={11} color={c.ink3}>{v.kind === 'today' ? '今日の予想' : '過去問'}{v.out === 'pend' ? ' ／ 判定待ち' : ` ／ ${lab(v.date!)}で判定`}</T>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Chip kind={v.out as any} label={L[v.out]} />
                {v.out !== 'pend' ? <T f="num" size={11} color={(v.diff ?? 0) > 0 ? c.up : (v.diff ?? 0) < 0 ? c.down : c.ink3}>{fdiff(v.diff ?? 0, v.pair)}</T> : null}
              </View>
            </View>
            {v.memo ? <T size={12} color={c.ink2} style={{ marginLeft: 40 }}>{v.memo}</T> : null}
          </View>
        ))}
      </View>
      <Panel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <H3>予想を実際の相場で試す</H3>
              <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: 4, paddingHorizontal: 6 }}><T f="bold" size={10} color={c.ink3}>{AFFILIATE_URL ? 'PR' : 'PR・見本'}</T></View>
            </View>
            <Sub>{AFFILIATE_URL ? 'FX口座の紹介ページが開きます。' : 'FX口座の紹介枠（アフィリエイト）。提携先が決まったらリンクを入れます。'}</Sub>
          </View>
          <Pressable disabled={!AFFILIATE_URL} onPress={() => Linking.openURL(AFFILIATE_URL)}
            style={{ borderWidth: 1, borderColor: c.teal, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, opacity: AFFILIATE_URL ? 1 : 0.5 }}>
            <T f="bold" size={12} color={c.teal}>見てみる</T>
          </Pressable>
        </View>
      </Panel>
    </View>
  );
}
