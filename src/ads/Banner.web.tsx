import { View } from 'react-native';
import { T, useTheme } from '../theme';
// ブラウザで確かめる用の見本
export function Banner() {
  const { c } = useTheme();
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.surface, alignItems: 'center', paddingVertical: 3 }}>
      <View style={{ width: 320, maxWidth: '100%', height: 50, borderWidth: 1, borderStyle: 'dashed', borderColor: c.ink3, borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
        <T size={12} color={c.ink3}>広告バナー 320×50（見本）</T>
      </View>
    </View>
  );
}
