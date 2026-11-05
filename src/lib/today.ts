import { EXPRESSIONS, Expression } from "../data/expressions";

// 날짜 키 예: "2026-10-20"
// TODO(추가-01, P2; ISSUE-09 연관): toISOString은 UTC 날짜지만 pickToday는 기기 현지
// 일자를 사용한다. 한국 시각 자정~오전 9시 전에는 저장일이 현지 날짜의 전날일 수 있다.
// 학습 시간대·달력 날짜 규칙을 통일하고 한국 오전 저장도 같은 학습일인지 검증한다.
export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

// TODO(ISSUE-08, P2): 월의 일자만 사용해 월 경계에서 콘텐츠 순환이 끊긴다.
// 현재 표현 5개 기준으로도 31일과 다음 달 1일은 둘 다 인덱스 1이다.
// 기준일부터 경과한 달력 일수 또는 날짜별 콘텐츠 매핑을 검토하고 빈 배열 정책도 정한다.
// ISSUE-02: 이 함수 자체는 날짜 변경 이벤트를 감지하지 않으므로 호출 시점 갱신이 별도로 필요하다.
export function pickToday(now: Date = new Date()): Expression {
  const day = now.getDate();
  return EXPRESSIONS[day % EXPRESSIONS.length];
}
