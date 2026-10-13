import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Chart } from '../Chart';
import { Dir, fdiff, fv, jst, lab, left, Market, nextWeekday, pairName, pubTime, rate, streaks } from '../core';
import { scheduleResult } from '../notify';
import { useStore } from '../store';
import { T, useTheme } from '../theme';
import { Chip, DirPick, H3, Memo, Panel, Primary, Secondary, Stat, Sub } from '../ui';
import { judgedVotes, PairPicker } from './common';

export function Today({ m, toast, onResultSeen }: { m: Market; toast: (s: string) => void; onResultSeen: () => void }) {
  const { c } = useTheme();
  const { st, set } = useStore();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(iv); }, []);

  const p = st.pair, s = m.ser(p), D = m.ecb.d, L = m.N - 1;
  const days = Math.max(10, Math.min(500, st.tDays | 0 || 60)), from = Math.max(0, L - days + 1);
  const d = s[L] - s[L - 1];
  const target = nextWeekday(D[L]), dl = pubTime(target), open = now < dl;
  const key = p + '|' + D[L], mine = st.votes[key];

  const [dir, setDir] = useState<Dir | null>(mine?.dir ?? null);
  const [memo, setMemo] = useState(mine?.memo ?? '');
  useEffect(() => { setDir(st.votes[key]?.dir ?? null); setMemo(st.votes[key]?.memo ?? ''); }, [key]);

  const changed = !mine || mine.dir !== dir || (mine.memo || '') !== memo.trim();
  const submit = async () => {
    if (!open || !dir) return;
    const v = { pair: p, base: D[L], dir, memo: memo.trim(), at: Date.now() };
    set(s0 => ({ ...s0, votes: { ...s0.votes, [key]: v } }));
    toast(mine ? '投票を変更しました' : `投票しました。結果は${lab(target)}のレート公表（${jst(dl)}ごろ）で出ます`);
    // データは公表の30〜40分後に更新されるので、その後に通知する
    const id = await scheduleResult(dl + 45 * 60e3, `${lab(target)}の結果を確認しましょう`, st.notifId);
    set(s0 => ({ ...s0, notifId: id }));
  };

  const J = judgedVotes(m, st);
  const unseen = J.filter(v => !st.seen[v.pair + '|' + v.base]).slice(0, 3);
  const rc = Math.max(5, st.tRec | 0 || 20);
  const all = rate(J), rec = rate(J.slice(0, rc)), sk = streaks(J.slice().reverse());

  return (
    <View style={{ gap: 12 }}>
      {unseen.map(v => {
        const sv = m.ser(v.pair);
        return (
          <View key={v.pair + v.base} style={{ backgroundColor: v.out === 'win' ? c.upSoft : v.out === 'lose' ? c.downSoft : c.line, borderRadius: 14, padding: 12, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T f="bold">{pairName(v.pair)}　{lab(v.date)}の結果</T>
              <T f="disp" size={20} color={v.out === 'win' ? c.up : v.out === 'lose' ? c.down : c.ink2}>{({ win: '的中', lose: '外れ', draw: '同値' } as const)[v.out]}</T>
            </View>
            <Sub>{v.dir === 'up' ? '▲ 上がる' : '▼ 下がる'}と予想 ／ {fv(sv[m.idx[v.base]], v.pair)} → {fv(v.val, v.pair)}（{fdiff(v.diff, v.pair)}）</Sub>
            {v.memo ? <T size={13} color={c.ink2}>メモ：{v.memo}</T> : null}
            <View style={{ marginTop: 6 }}>
              <Secondary label="確認した" onPress={() => { set(s0 => ({ ...s0, seen: { ...s0.seen, [v.pair + '|' + v.base]: 1 } })); onResultSeen(); }} />
            </View>
          </View>
        );
      })}

      <Panel>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <PairPicker value={p} onChange={pp => set(s0 => ({ ...s0, pair: pp }))} />
          <Sub>{lab(D[L], true)}の値</Sub>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <T f="numb" size={36} lh={44}>{fv(s[L], p)}</T>
          <T f="numb" size={13} color={d > 0 ? c.up : d < 0 ? c.down : c.ink2}>前日比 {fdiff(d, p)}</T>
        </View>
        <Chart vals={s.slice(from, L + 1)} dates={D.slice(from, L + 1)} pair={p} />
        <Sub>直近{L - from + 1}営業日。{jst(pubTime(D[L]))}ごろに公表された値まで表示しています。</Sub>
      </Panel>

      <Panel>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1 }}><H3>{lab(target)}のレートは、{lab(D[L])}より上がる？下がる？</H3></View>
          {open ? <Chip kind={mine ? 'done' : 'open'} label={mine ? '投票済み' : '受付中'} /> : <Chip kind="closed" label="公表待ち" />}
        </View>
        <Sub>{open
          ? `いつでも投票・変更できます。締切は${lab(target)}のレート公表（${jst(dl)}ごろ、あと${left(dl - now)}）で、その時点で結果が出ます。`
          : `${lab(target)}のレート公表を待っています。公表されると結果が出て、すぐ次の予想を受け付けます。`}</Sub>
        <DirPick value={dir} onChange={setDir} disabled={!open} sub={lab(target)} />
        <Memo value={memo} onChange={setMemo} disabled={!open} placeholder="例：200日線を上抜けた。来週は日銀会合" />
        <Primary label={mine ? '投票を変更する' : '投票する'} onPress={submit} disabled={!open || !dir || !changed} />
      </Panel>

      <Panel>
        <H3>今日の予想の成績</H3>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Stat label="総合" value={all.r == null ? '—' : all.r.toFixed(1)} unit={all.r == null ? '' : '%'} note={all.n ? `${all.w} / ${all.n}回` : 'まだ記録がありません'} />
          <Stat label={`直近${rc}日`} value={rec.r == null ? '—' : rec.r.toFixed(1)} unit={rec.r == null ? '' : '%'} note={rec.n ? `${rec.w} / ${rec.n}回` : 'まだ記録がありません'} />
          <Stat label="最大連続正解" value={String(sk.max)} note={`いま ${sk.cur} 連続`} />
        </View>
      </Panel>
    </View>
  );
}
