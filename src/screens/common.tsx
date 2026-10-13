import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { PAIRS, PairId, Market, judgeVote, streaks, titleIdx, TITLES, pairName } from '../core';
import type { State } from '../store';
import { T, useTheme } from '../theme';

export function PairPicker({ value, onChange }: { value: PairId; onChange: (p: PairId) => void }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="通貨ペアを選ぶ" onPress={() => setOpen(true)}
        style={{ borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
        <T f="bold" size={14}>{pairName(value)}</T><T size={11} color={c.ink3}>▼</T>
      </Pressable>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: c.scrim, justifyContent: 'center', padding: 32 }} onPress={() => setOpen(false)}>
          <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden' }}>
            {PAIRS.map((p, i) => (
              <Pressable key={p.id} onPress={() => { onChange(p.id); setOpen(false); }}
                style={{ paddingVertical: 14, paddingHorizontal: 18, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, flexDirection: 'row', justifyContent: 'space-between' }}>
                <T f={p.id === value ? 'bold' : 'body'} size={15} color={p.id === value ? c.teal : c.ink}>{p.name}</T>
                {p.id === value ? <T f="bold" color={c.teal}>✓</T> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export function judgedVotes(m: Market, st: State) {
  const last = m.N - 1;
  return Object.values(st.votes).map(v => judgeVote(m, v, last)).filter(Boolean).sort((a, b) => (a!.base < b!.base ? 1 : -1)) as NonNullable<ReturnType<typeof judgeVote>>[];
}
export function points(m: Market, st: State) {
  return st.quiz.filter(v => v.out === 'win').length + judgedVotes(m, st).filter(v => v.out === 'win').length;
}

export function RankBar({ m, st }: { m: Market; st: State }) {
  const { c } = useTheme();
  const p = points(m, st), i = titleIdx(p), nx = TITLES[i + 1];
  const pct = nx ? Math.min(100, ((p - TITLES[i][0]) / (nx[0] - TITLES[i][0])) * 100) : 100;
  const mx = Math.max(streaks(st.quiz).max, streaks(judgedVotes(m, st).slice().reverse()).max);
  return (
    <View style={{ marginHorizontal: 20, marginTop: 2, marginBottom: 6, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 5 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <T f="bold" size={10.5} lh={16} color={c.coin}>称号</T>
        <T f="disp" size={16} lh={26} numberOfLines={1} style={{ flex: 1 }}>{TITLES[i][1]}</T>
        <T f="numb" size={15} lh={24} color={c.coin}>{p.toLocaleString()}</T>
        <T size={11} lh={24} color={c.ink3} style={{ marginLeft: -6 }}>p</T>
      </View>
      <View style={{ height: 5, borderRadius: 5, backgroundColor: c.line, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: c.coin }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <T size={10.5} color={c.ink3}>{nx ? `次の称号「${nx[1]}」まで ${nx[0] - p}p` : '最高の称号に到達しました'}</T>
        <T size={10.5} color={c.ink3}>最大連続正解 <T f="numb" size={10.5} color={c.ink2}>{mx}</T></T>
      </View>
    </View>
  );
}
