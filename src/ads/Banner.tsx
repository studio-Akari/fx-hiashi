import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTheme } from '../theme';
import { BANNER_ID } from './ids';
import { startAds } from './setup';

export function Banner() {
  const { c } = useTheme();
  const [ok, setOk] = useState(false);
  useEffect(() => { startAds().then(setOk); }, []);
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.surface, alignItems: 'center', minHeight: 50 }}>
      {ok && BANNER_ID ? <BannerAd unitId={BANNER_ID} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} /> : null}
    </View>
  );
}
