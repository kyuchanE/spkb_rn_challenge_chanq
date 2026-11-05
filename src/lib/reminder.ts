import * as Notifications from "expo-notifications";

export async function scheduleNextDayReminder(): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    throw new Error("notification permission denied");
  }
  await Notifications.scheduleNotificationAsync({
    content: { title: "스피커블", body: "어제 만든 문장, 오늘 한 번 더 말해 볼까요?" },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 * 60 * 24 },
  });
}
