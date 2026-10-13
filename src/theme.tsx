import { createContext, useContext } from 'react';
import { Text, TextProps, useColorScheme } from 'react-native';

// かちみ～ると同じ色の組み合わせ
const light = {
  ground: '#E9EEE8', screen: '#F6F8F4', surface: '#FFFFFF', ink: '#17222A', ink2: '#55636B', ink3: '#8A979C',
  line: '#D6DED7', coin: '#C98A06', coinSoft: '#F7E6B8', teal: '#1B756D', tealSoft: '#D5EBE7', test: '#B04A7A',
  up: '#1B756D', upSoft: '#D5EBE7', down: '#C4553F', downSoft: '#F6DDD7', onPrimary: '#FFFFFF', scrim: 'rgba(10,16,18,0.45)',
};
const dark: typeof light = {
  ground: '#0B1113', screen: '#121B1E', surface: '#1A2629', ink: '#E8EFEB', ink2: '#A9B7B3', ink3: '#71807D',
  line: '#2A3A3D', coin: '#F0B43A', coinSoft: '#3A2F14', teal: '#57BDB1', tealSoft: '#16312E', test: '#E07AAB',
  up: '#57BDB1', upSoft: '#16312E', down: '#E8806A', downSoft: '#3A1F19', onPrimary: '#0B1113', scrim: 'rgba(0,0,0,0.55)',
};
export type Colors = typeof light;
export const F = {
  disp: 'MPLUSRounded1c_800ExtraBold',
  body: 'ZenKakuGothicNew_400Regular',
  bold: 'ZenKakuGothicNew_700Bold',
  num: 'IBMPlexMono_500Medium',
  numb: 'IBMPlexMono_600SemiBold',
};
const Ctx = createContext<{ c: Colors; dark: boolean }>({ c: light, dark: false });
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDark = useColorScheme() === 'dark';
  return <Ctx.Provider value={{ c: isDark ? dark : light, dark: isDark }}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);

type TP = TextProps & { size?: number; color?: string; f?: keyof typeof F; lh?: number };
export function T({ size = 14, color, f = 'body', lh, style, ...p }: TP) {
  const { c } = useTheme();
  return <Text {...p} style={[{ fontFamily: F[f], fontSize: size, color: color ?? c.ink, lineHeight: lh ?? Math.round(size * 1.55) }, style]} />;
}
