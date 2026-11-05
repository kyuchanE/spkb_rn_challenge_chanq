import * as Notifications from "expo-notifications";

// TODO(ISSUE-07, P1 가능·환경 확인): 현재 Expo ~58.0.23 / expo-notifications ~58.1.8이며
// 아래 TIME_INTERVAL type은 이미 명시되어 있다. "type 누락"은 현재 미해결 이슈가 아니다.
// 남은 검토: Android 채널·권한 흐름, 포그라운드 표시 핸들러, app.json의 config plugin 및
// 실제 빌드/플랫폼별 표시 동작. src/app/_layout.tsx의 초기화 메모와 함께 확인한다.
// 현재는 로컬 예약 알림이므로 이 요구사항만으로 서버 푸시/토큰 도입이 필수인 것은 아니다.
// 참고: https://docs.expo.dev/versions/v58.0.0/sdk/notifications/
export async function scheduleNextDayReminder(): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    throw new Error("notification permission denied");
  }
  // TODO(ISSUE-05, P1): 저장할 때마다 예약하지만 반환된 예약 ID를 보관하지 않아
  // 기존 예약을 취소/교체하지 못하고 다음 날 같은 안내가 여러 번 올 수 있다.
  // 하루 한 번 또는 문장별 알림인지 정책을 정하고 날짜/문장별 ID를 관리한다.
  // 초기 정책 후보: 다음 날 알림 하나에서 복습할 문장들을 보여주고 해당 날짜 예약을 갱신.
  // 검증 기준: 같은 복습 단위로 여러 번 저장해도 알림이 중복되지 않아야 한다.
  // TODO(ISSUE-11, P2): content에 sentenceId/reviewDateKey 등 대상 정보가 없고 현재
  // 호출 인자에도 대상이 없다. 단일 홈 진입만으로 충분한지 정책을 정한 뒤 필요하면
  // 연결 데이터를 넣고 루트에서 알림 응답으로 이동한다(실행 중/완전 종료 진입 모두 검증).
  await Notifications.scheduleNotificationAsync({
    content: { title: "스피커블", body: "어제 만든 문장, 오늘 한 번 더 말해 볼까요?" },
    // TODO(ISSUE-06, P1·요구사항에 따라 조정): 24시간 후는 다음 날 아침이 아니다.
    // "매일 아침"이 고정 알림 시각 요구사항인지 확인하고, 확정되면 선택한 시간대의
    // 다음 날 오전을 달력 기준으로 계산한다. 해외 사용자의 DST/시간대 변경도 고려한다.
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 * 60 * 24 },
  });
}
