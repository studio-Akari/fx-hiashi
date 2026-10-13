import { useEffect } from 'react';
import { View } from 'react-native';
import { Chart } from '../Chart';
import { fdiff, fv, lab, Market, rate, same, streaks } from '../core';
import { QuizCur, State, useStore } from '../store';
import { T, useTheme } from '../theme';
import { DirPick, H3, Memo, Panel, Primary, Stat, Sub } from '../ui';
import { PairPicker } from './common';

function makeQuiz(m: Market, st: State): QuizCur {
  const p = st.pair, s = m.ser(p), Y = Math.max(10, Math.min(500, st.qDays | 0 || 60));
  const first = m.qStart + Y - 1, last = m.N - 2;
  let t = first, g = 0;
  do { t = first + Math.floor(Math.random() * (last - first)); g++; } while (same(s[t], s[t + 1], p) && g < 50);
  return { pair: p, t: m.ecb.d[t], Y, answered: null, dir: null, memo: '' };
}

export function Quiz({ m, onAnswered, onNext }: { m: Market; onAnswered: () => void; onNext: (go: () => void) => void }) {
  const { c } = useTheme();
  const { st, set } = useStore();
  const q = st.quizCur;
  const valid = q && q.pair === st.pair && m.idx[q.t] !== undefined && (q.answered || m.idx[q.t] >= m.qStart + q.Y - 1);
  useEffect(() => { if (!valid) set(s => ({ ...s, quizCur: makeQuiz(m, s) })); }, [valid]);
  if (!q || !valid) return null;

  const p = q.pair, s = m.ser(p), D = m.ecb.d, t = m.idx[q.t], from = Math.max(0, t - q.Y + 1);
  const a = q.answered;
  const d = s[t] - s[t - 1];
  const up = s[t + 1] > s[t];
  const n5 = Math.min(m.N - 1, t + 5);
  const list = st.quiz.slice().reverse();
  const rc = Math.max(5, st.qRec | 0 || 20);
  const all = rate(list), rec = rate(list.slice(0, rc)), sk = streaks(st.quiz);
  const upd = (patch: Partial<QuizCur>) => set(s0 => ({ ...s0, quizCur: { ...s0.quizCur!, ...patch } }));

  const answer = () => {
    if (!q.dir || a) return;
    const rec = { pair: p, base: q.t, dir: q.dir, memo: q.memo.trim(), out: (up === (q.dir === 'up') ? 'win' : 'lose') as 'win' | 'lose', diff: s[t + 1] - s[t], date: D[t + 1], at: Date.now() };
    set(s0 => ({ ...s0, quiz: [...s0.quiz, rec], quizDone: (s0.quizDone || 0) + 1, quizCur: { ...s0.quizCur!, answered: rec } }));
    onAnswered();
  };
  const next = () => onNext(() => set(s0 => ({ ...s0, quizCur: makeQuiz(m, s0) })));

  return (
    <View style={{ gap: 12 }}>
      <Panel>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <PairPicker value={st.pair} onChange={pp => set(s0 => ({ ...s0, pair: pp }))} />
          <Sub>第{st.quiz.length + (a ? 0 : 1)}問</Sub>
        </View>
        <Sub>{lab(D[from], true)} 〜 {lab(D[t], true)}（{t - from + 1}営業日）</Sub>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <T f="numb" size={36} lh={44}>{fv(s[t], p)}</T>
          <T f="numb" size={13} color={d > 0 ? c.up : d < 0 ? c.down : c.ink2}>前日比 {fdiff(d, p)}</T>
        </View>
        <Chart vals={s.slice(from, t + 1)} dates={D.slice(from, t + 1)} pair={p}
          reveal={a ? { vals: s.slice(t + 1, n5 + 1), dates: D.slice(t + 1, n5 + 1), up } : null} />
        <Sub>{a ? `大きな${up ? '緑' : '赤'}の●が答え（${up ? '上がった' : '下がった'}）。黄色の線はその後5営業日の推移です。` : '右端が問題の日です。'}</Sub>
      </Panel>

      {!a ? (
        <Panel>
          <H3>{lab(D[t], true)}の翌営業日、レートは上がる？下がる？</H3>
          <DirPick value={q.dir} onChange={dir => upd({ dir })} sub="翌営業日" />
          <Memo value={q.memo} onChange={memo => upd({ memo })} placeholder="例：3日連続で下げた後の反発" />
          <Primary label="回答する" onPress={answer} disabled={!q.dir} />
        </Panel>
      ) : (
        <Panel>
          <View style={{ backgroundColor: a.out === 'win' ? c.upSoft : c.downSoft, borderRadius: 14, padding: 12, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T f="bold">{lab(D[t + 1], true)}</T>
              <T f="disp" size={20} color={a.out === 'win' ? c.up : c.down}>{a.out === 'win' ? '的中' : '外れ'}</T>
            </View>
            <Sub>{a.dir === 'up' ? '▲ 上がる' : '▼ 下がる'}と回答 ／ {fv(s[t], p)} → {fv(s[t + 1], p)}（{fdiff(s[t + 1] - s[t], p)}）</Sub>
            <Sub>5営業日後（{lab(D[n5])}）：{fv(s[n5], p)}（{fdiff(s[n5] - s[t], p)}）</Sub>
            {a.memo ? <T size={13} color={c.ink2}>メモ：{a.memo}</T> : null}
          </View>
          <Primary label="次の問題へ" onPress={next} />
        </Panel>
      )}

      <Panel>
        <H3>過去問の成績</H3>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Stat label="総合" value={all.r == null ? '—' : all.r.toFixed(1)} unit={all.r == null ? '' : '%'} note={all.n ? `${all.w} / ${all.n}回` : 'まだ記録がありません'} />
          <Stat label={`直近${rc}問`} value={rec.r == null ? '—' : rec.r.toFixed(1)} unit={rec.r == null ? '' : '%'} note={rec.n ? `${rec.w} / ${rec.n}回` : 'まだ記録がありません'} />
          <Stat label="最大連続正解" value={String(sk.max)} note={`いま ${sk.cur} 連続`} />
        </View>
      </Panel>
    </View>
  );
}
