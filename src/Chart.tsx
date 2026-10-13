import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SText } from 'react-native-svg';
import { decOf, PairId, slash } from './core';
import { F, useTheme } from './theme';

type Props = {
  vals: number[]; dates: string[]; pair: PairId; height?: number;
  reveal?: { vals: number[]; dates: string[]; up: boolean } | null;
};
export function Chart({ vals, dates, pair, height = 170, reveal }: Props) {
  const { c } = useTheme();
  const [W, setW] = useState(0);
  const all = reveal ? vals.concat(reveal.vals) : vals;
  let lo = Math.min(...all), hi = Math.max(...all);
  const pad = (hi - lo) * 0.1 || Math.abs(hi) * 0.002;
  lo -= pad; hi += pad;
  const L = 2, R = 54, T = 8, B = 20, pw = Math.max(1, W - L - R), ph = height - T - B, n = all.length;
  const x = (i: number) => L + (pw * i) / Math.max(1, n - 1);
  const y = (v: number) => T + ph * (1 - (v - lo) / (hi - lo));
  const bi = vals.length - 1;
  const line = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = line + `L${x(bi).toFixed(1)},${T + ph}L${x(0).toFixed(1)},${T + ph}Z`;
  const rv = reveal ? `M${x(bi)},${y(vals[bi])}` + reveal.vals.map((v, j) => `L${x(bi + 1 + j)},${y(v)}`).join('') : '';
  const dl = reveal ? dates.concat(reveal.dates) : dates;
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
          {[0, 1, 2, 3].map(k => {
            const v = lo + ((hi - lo) * k) / 3, yy = y(v);
            return (
              <SText key={k} x={L + pw + 5} y={yy + 3.5} fontSize={10} fill={c.ink3} fontFamily={F.num}>{v.toFixed(decOf(pair))}</SText>
            );
          })}
          {[0, 1, 2, 3].map(k => {
            const yy = y(lo + ((hi - lo) * k) / 3);
            return <Line key={'l' + k} x1={L} x2={L + pw} y1={yy} y2={yy} stroke={c.line} strokeWidth={1} />;
          })}
          <SText x={L} y={T + ph + 15} fontSize={10} fill={c.ink3} fontFamily={F.num}>{slash(dl[0])}</SText>
          <SText x={L + pw} y={T + ph + 15} fontSize={10} fill={c.ink3} fontFamily={F.num} textAnchor="end">{slash(dl[dl.length - 1])}</SText>
          <Path d={area} fill="url(#g)" />
          <Path d={line} stroke={c.teal} strokeWidth={1.6} fill="none" />
          {reveal && (
            <>
              <Line x1={x(bi)} x2={x(bi)} y1={T} y2={T + ph} stroke={c.ink3} strokeWidth={1} strokeDasharray="3,3" />
              <Path d={rv} stroke={c.coin} strokeWidth={2} fill="none" />
              <Circle cx={x(bi + 1)} cy={y(reveal.vals[0])} r={7} fill={reveal.up ? c.up : c.down} stroke={c.surface} strokeWidth={2} />
            </>
          )}
          <Circle cx={x(bi)} cy={y(vals[bi])} r={3.5} fill={c.teal} stroke={c.surface} strokeWidth={2} />
        </Svg>
      )}
    </View>
  );
}
