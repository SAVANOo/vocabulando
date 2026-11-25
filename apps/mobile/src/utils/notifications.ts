import * as Notifications from "expo-notifications";

export async function scheduleDailyWordReminder(hour = 9): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      finalStatus = req.status;
    }
    if (finalStatus !== "granted") return false;

    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Vocabulando • Palavra do Dia",
        body: "Reserve 1 minuto hoje para expandir seu repertório com 3 palavras.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
    return true;
  } catch {
    return false;
  }
}
