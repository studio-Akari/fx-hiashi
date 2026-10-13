import { Pressable, StyleProp, TextInput, View, ViewStyle } from 'react-native';
import type { Dir, Out } from './core';
import { F, T, useTheme } from './theme';

export function Panel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return <View style={[{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 18, padding: 15, gap: 10 }, style]}>{children}</View>;
}
export function H3({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  return <T f="bold" size={13} color={c.ink2}>{children}</T>;
}
export function Sub({ children, style }: { children: React.ReactNode; style?: any }) {
  const { c } = useTheme();
  return <T size={11.5} color={c.ink3} style={style}>{children}</T>;
}
export function Primary({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
      style={({ pressed }) => ({ backgroundColor: c.teal, borderRadius: 14, paddingVertical: 13, alignItems: 'center', opacity: disabled ? 0.4 : pressed ? 0.85 : 1 })}>
      <T f="bold" size={15} color={c.onPrimary}>{label}</T>
    </Pressable>
  );
}
export function Secondary({ label, onPress, color }: { label: string; onPress: () => void; color?: string }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => ({ borderWidth: 1.5, borderColor: color ?? c.ink, borderRadius: 14, paddingVertical: 11, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
      <T f="bold" size={14} color={color ?? c.ink}>{label}</T>
    </Pressable>
  );
}
export function Chip({ kind, label }: { kind: 'open' | 'closed' | 'done' | Out | 'pend'; label: string }) {
  const { c } = useTheme();
  const m: Record<string, [string, string]> = {
    open: [c.tealSoft, c.teal], closed: [c.line, c.ink2], pend: [c.line, c.ink2], done: [c.coinSoft, c.coin],
    win: [c.upSoft, c.up], lose: [c.downSoft, c.down], draw: [c.line, c.ink2],
  };
  const [bg, fg] = m[kind];
  return <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 }}><T f="bold" size={11} color={fg}>{label}</T></View>;
}
export function DirPick({ value, onChange, disabled, sub }: { value: Dir | null; onChange: (d: Dir) => void; disabled?: boolean; sub: string }) {
  const { c } = useTheme();
  const B = ({ d }: { d: Dir }) => {
    const on = value === d, col = d === 'up' ? c.up : c.down;
    return (
      <Pressable accessibilityRole="button" accessibilityState={{ selected: on, disabled }} disabled={disabled} onPress={() => onChange(d)}
        style={{ flex: 1, borderWidth: 1.5, borderColor: on ? col : c.line, backgroundColor: on ? col : c.surface, borderRadius: 14, paddingVertical: 12, alignItems: 'center', opacity: disabled ? 0.4 : 1 }}>
        <T f="bold" size={17} color={on ? c.surface : col}>{d === 'up' ? '▲ 上がる' : '▼ 下がる'}</T>
        <T size={11} color={on ? c.surface : c.ink3}>{sub}</T>
      </Pressable>
    );
  };
  return <View style={{ flexDirection: 'row', gap: 10 }}><B d="up" /><B d="down" /></View>;
}
export function Memo({ value, onChange, disabled, placeholder }: { value: string; onChange: (s: string) => void; disabled?: boolean; placeholder: string }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <T f="bold" size={14}>なぜそちらを選んだか（任意）</T>
      <TextInput value={value} onChangeText={onChange} editable={!disabled} multiline maxLength={500} placeholder={placeholder} placeholderTextColor={c.ink3}
        style={{ minHeight: 72, borderWidth: 1, borderColor: c.line, borderRadius: 12, backgroundColor: c.screen, paddingHorizontal: 12, paddingVertical: 10, fontFamily: F.body, fontSize: 14, color: c.ink, textAlignVertical: 'top', opacity: disabled ? 0.6 : 1 }} />
    </View>
  );
}
export function Stat({ label, value, unit, note }: { label: string; value: string; unit?: string; note: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.screen, borderRadius: 12, padding: 10, minWidth: 0 }}>
      <T f="bold" size={11} color={c.ink3} numberOfLines={1}>{label}</T>
      <T f="numb" size={20} lh={26} numberOfLines={1}>{value}{unit ? <T size={12} color={c.ink3}>{unit}</T> : null}</T>
      <T size={11} color={c.ink3} numberOfLines={1}>{note}</T>
    </View>
  );
}
export function Seg<K extends string>({ items, value, onChange }: { items: [K, string][]; value: K; onChange: (k: K) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4, backgroundColor: c.line, borderRadius: 12, padding: 3 }}>
      {items.map(([k, l]) => {
        const on = k === value;
        return (
          <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(k)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center', backgroundColor: on ? c.surface : 'transparent' }}>
            <T f={on ? 'bold' : 'body'} size={13} color={on ? c.ink : c.ink2}>{l}</T>
          </Pressable>
        );
      })}
    </View>
  );
}
export function Pills<K extends string>({ items, value, onChange }: { items: [K, string][]; value: K; onChange: (k: K) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {items.map(([k, l]) => {
        const on = k === value;
        return (
          <Pressable key={k} onPress={() => onChange(k)} accessibilityState={{ selected: on }}
            style={{ borderWidth: 1, borderColor: on ? c.teal : c.line, backgroundColor: on ? c.tealSoft : c.surface, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4 }}>
            <T f={on ? 'bold' : 'body'} size={12} color={on ? c.teal : c.ink2}>{l}</T>
          </Pressable>
        );
      })}
    </View>
  );
}
