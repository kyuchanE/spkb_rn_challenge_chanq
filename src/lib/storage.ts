import AsyncStorage from "@react-native-async-storage/async-storage";
import { todayKey } from "./today";

const KEY = "sentences";

export type Sentence = { id: string; expressionId: string; text: string; dateKey: string };

// TODO(ISSUE-10, P2): TypeScript 타입만으로 영속 데이터 구조는 보장되지 않는다.
// JSON 파싱, 배열 여부, Sentence 필드 구조, 저장소 접근 실패를 구분하고 스키마 버전과
// 마이그레이션/복구 정책을 둔다. 오류를 무조건 []로 숨기면 다음 쓰기에서 기존 데이터를
// 빈 목록 기반으로 덮어쓸 수 있으므로 무조건적인 빈 목록 대체는 피한다.
export async function loadSentences(): Promise<Sentence[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

// TODO(ISSUE-03, P1): 읽기→추가→전체 쓰기는 원자적이지 않다. 두 호출이 같은 [X]를
// 읽고 각각 [X,A], [X,B]를 쓰면 A가 유실될 수 있다. 화면 잠금 외에 저장소 쓰기도
// 직렬화하고 중복 제출 정책을 둔다. 동시 저장 시 유실·중복이 없는지 검증한다.
// TODO(ISSUE-04, P1): void 대신 저장된 Sentence 반환을 검토해 호출자가 저장 성공과
// 이후 알림/재조회 실패를 구분하고 전체 목록 재조회 없이 성공 결과를 반영할 수 있게 한다.
export async function saveSentence(expressionId: string, text: string): Promise<void> {
  const list = await loadSentences();
  // ISSUE-03: Date.now() ID는 같은 밀리초에 충돌하고 기기 시간 변경에도 영향받는다.
  // 고유 ID와 생성 시각을 별도로 다룬다.
  // TODO(ISSUE-09, P2): dateKey를 실제 쓰기 시점에 생성하므로 권한 대기/자정 경계에서
  // 제출한 표현의 학습일과 달라질 수 있다. 호출자가 확정한 학습일을 전달받는 방향을 검토한다.
  list.push({ id: String(Date.now()), expressionId, text, dateKey: todayKey() });
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

// TODO(추가-02, P2; ISSUE-02 연관): 현재는 날짜 필터 없이 마지막 항목을 반환한다.
// 오늘/며칠 전 문장도 "어제 문장"으로 표시될 수 있다. 공통 학습일 규칙으로 어제의
// dateKey를 계산해 복습 대상을 선택하고, 대상이 없는 상태와 조회 실패도 구분한다.
// 검증 기준: 오늘 문장과 며칠 전 문장이 어제 문장으로 표시되지 않아야 한다.
export async function getYesterdaySentence(): Promise<Sentence | undefined> {
  const list = await loadSentences();
  return list[list.length - 1];
}
