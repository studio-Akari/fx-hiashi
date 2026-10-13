// 「結果が出ました」の通知（端末の中だけで予約。サーバーは使わない）
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function scheduleResult(at: number, body: string, prevId?: string | null): Promise<string | null> {
  try {
    if (prevId) await Notifications.cancelScheduledNotificationAsync(prevId).catch(() => {});
    const p = await Notifications.getPermissionsAsync();
    let ok = p.granted;
    if (!ok && p.canAskAgain) ok = (await Notifications.requestPermissionsAsync()).granted;
    if (!ok || at <= Date.now()) return null;
    return await Notifications.scheduleNotificationAsync({
      content: { title: '今日の予想の結果が出ました', body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
    });
  } catch {
    return null;
  }
}
