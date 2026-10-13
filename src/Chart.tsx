import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SText } from 'react-native-svg';
import { decOf, PairId, slash } from './core';
import { F, useTheme } from './theme';

type Props = {
  vals: number[]; dates: string[]; pair: PairId; height?: number;
  // 過去問用：右側に「答え」の欄を空けておく（何営業日分か）
  future?: number;
  reveal?: { vals: number[]; dates: string[]; up: boolean } | null;
};
export function Chart({ vals, dates, pair, height = 170, future = 0, reveal }: Props) {
  const { c } = useTheme();
  const [W, setW] = useState(0);
  // 回答前は問題の範囲だけで縦軸を決める（答えが縦軸から読み取れないように）
  const all = reveal ? vals.concat(reveal.vals) : vals;
  let lo = Math.min(...all), hi = Math.max(...all);
  const pad = (hi - lo) * 0.1 || Math.abs(hi) * 0.002;
  lo -= pad; hi += pad;
  const L = 2, R = 54, T = 8, B = 20, pw = Math.max(1, W - L - R), ph = height - T - B;
  const pastW = future ? pw * 0.76 : pw;
  const bi = vals.length - 1;
  const xp = (i: number) => L + (pastW * i) / Math.max(1, bi);
  // 答えの日（j=1）は欄の35%の位置に置き、問題の日との間をはっきり空ける。2日目以降は残りに均等に並べる
  const zone = pw - pastW;
  const xf = (j: number) => L + pastW + zone * (future <= 1 ? 0.5 : 0.35 + (0.65 * (j - 1)) / (future - 1)); // j = 1..future
  const y = (v: number) => T + ph * (1 - (v - lo) / (hi - lo));
  const line = vals.map((v, i) => `${i ? 'L' : 'M'}${xp(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = line + `L${xp(bi).toFixed(1)},${T + ph}L${xp(0).toFixed(1)},${T + ph}Z`;
  const rv = reveal ? `M${xp(bi)},${y(vals[bi])}` + reveal.vals.map((v, j) => `L${xf(j + 1)},${y(v)}`).join('') : '';
  const lastLabel = reveal && reveal.dates.length ? reveal.dates[reveal.dates.length - 1] : dates[dates.length - 1];
  return (
    <View style={{ height }} onLayout={e => setW(e.nativeEvent.layout.width)}>
      {W > 0 && (
        <Svg width={W} height={height}>
          <Defs>
            <LinearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={c.teal} stopOpacity={0.2} />
              <Stop offset="1" stopColor={c.teal} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {future > 0 && (
            <>
              <Rect x={L + pastW} y={T} width={pw - pastW} height={ph} fill={c.line} opacity={0.35} />
              {Array.from({ length: future }, (_, k) => (
                <Line key={'d' + k} x1={xf(k + 1)} x2={xf(k + 1)} y1={T} y2={T + ph} stroke={c.ink3} strokeWidth={1} opacity={0.25} />
              ))}
              {!reveal && (
                <SText x={L + pastW + (pw - pastW) / 2} y={T + ph / 2 + 6} fontSize={18} fill={c.ink3} fontFamily={F.numb} textAnchor="middle">?</SText>
              )}
            </>
          )}
          {[0, 1, 2, 3].map(k => {
            const yy = y(lo + ((hi - lo) * k) / 3);
            return <Line key={'l' + k} x1={L} x2={L + pw} y1={yy} y2={yy} stroke={c.line} strokeWidth={1} />;
          })}
          {[0, 1, 2, 3].map(k => {
            const v = lo + ((hi - lo) * k) / 3;
            return <SText key={k} x={L + pw + 5} y={y(v) + 3.5} fontSize={10} fill={c.ink3} fontFamily={F.num}>{v.toFixed(decOf(pair))}</SText>;
          })}
          <SText x={L} y={T + ph + 15} fontSize={10} fill={c.ink3} fontFamily={F.num}>{slash(dates[0])}</SText>
          <SText x={future && !reveal ? L + pastW : L + pw} y={T + ph + 15} fontSize={10} fill={c.ink3} fontFamily={F.num} textAnchor="end">{slash(lastLabel)}</SText>
          <Path d={area} fill="url(#g)" />
          <Path d={line} stroke={c.teal} strokeWidth={1.6} fill="none" />
          {reveal && reveal.vals.length > 0 && (
            <>
              <Path d={rv} stroke={c.coin} strokeWidth={2} fill="none" />
              <Circle cx={xf(1)} cy={y(reveal.vals[0])} r={7} fill={reveal.up ? c.up : c.down} stroke={c.surface} strokeWidth={2} />
            </>
          )}
          <Circle cx={xp(bi)} cy={y(vals[bi])} r={3.5} fill={c.teal} stroke={c.surface} strokeWidth={2} />
        </Svg>
      )}
    </View>
  );
}
