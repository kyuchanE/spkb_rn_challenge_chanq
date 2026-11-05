import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, Alert, FlatList } from "react-native";
import { pickToday } from "../src/lib/today";
import { loadSentences, saveSentence, getYesterdaySentence, Sentence } from "../src/lib/storage";
import { scheduleNextDayReminder } from "../src/lib/reminder";

// 구조 메모(미구현): TodayScreen → useTodayLearning → SentenceRepository / ReminderScheduler.
// 화면은 입력·표시를 담당하고 표현 검증·학습일·복습 대상 선택은 순수 함수로 유지한다.
// 저장과 알림의 인터페이스를 분리해 플랫폼 차이 및 단계별 실패를 독립적으로 검증한다.
export default function TodayScreen() {
  // TODO(ISSUE-02, P1): 렌더링 중 날짜 계산만 하므로 백그라운드에서 다음 날 복귀해도
  // 갱신이 보장되지 않는다. 다른 렌더로 표현만 바뀌고 복습 state는 이전 값일 수도 있다.
  // 앱 활성화·화면 포커스·자정 경계에서 같은 학습일 기준으로 표현/목록/복습을 갱신하고,
  // 작성 중 초안은 연결된 표현을 보존하거나 전환을 안내한다. ISSUE-09와 함께 검토한다.
  const today = pickToday();
  const [text, setText] = useState("");
  const [list, setList] = useState<Sentence[]>([]);
  const [yesterday, setYesterday] = useState<Sentence>();

  // TODO(ISSUE-04, P1): 최초 비동기 조회의 실패 처리가 없어 빈 목록과 조회 실패를
  // 구분할 수 없다. 실패 상태·안내·재시도를 제공하고 두 조회의 일관성도 검토한다.
  // ISSUE-02: 빈 의존성 배열의 effect는 재활성화 시 다시 실행되지 않는다.
  useEffect(() => {
    loadSentences().then(setList);
    getYesterdaySentence().then(setYesterday);
  }, []);

  // TODO(ISSUE-03, P1): 저장 중 재진입 방지가 없어 연속 클릭으로 중복 저장과
  // read-modify-write 경쟁이 발생할 수 있다. 즉시 재진입 잠금과 저장 버튼 비활성화를
  // 검토하고 저장소 계층에서도 쓰기를 직렬화한다(src/lib/storage.ts 참고).
  async function onSave() {
    if (!text.includes(today.expression)) {
      Alert.alert("오늘의 표현을 넣어서 만들어 주세요");
      return;
    }
    // TODO(ISSUE-01, P1): 권한 거절/예약 실패가 throw되면 문장 저장까지 도달하지 않는다.
    // 반대로 예약 후 저장만 실패하면 학습 데이터 없는 알림이 남는다.
    // 방향: 검증 → 저장 → 저장 성공 반영 → 알림 예약/갱신, 알림 실패는 별도 안내.
    // 저장 성공과 알림 성공을 분리하고 필요하면 알림 예약 대기 상태와 재진입 재시도를 둔다.
    // 검증 기준: 알림 권한을 거절해도 문장은 저장되어야 한다(현재는 미충족).
    await scheduleNextDayReminder();
    await saveSentence(today.id, text);
    // TODO(ISSUE-09, P2): text/today는 이 이벤트 핸들러의 렌더 시점 스냅샷이다.
    // await 중 새로 편집한 입력도 아래 초기화로 지워질 수 있으며, 저장소에서 나중에
    // 계산한 날짜가 자정을 넘어 기존 표현의 학습일과 어긋날 수 있다.
    // 문장·표현·학습일을 하나의 제출 데이터로 확정하고 작성/제출 기준일 및 초안 정책을 정한다.
    setText("");
    // TODO(ISSUE-04, P1): 여기서 재조회가 실패해도 앞선 저장은 이미 성공했을 수 있다.
    // 현재 onSave에는 단계별 오류 안내가 없어 재시도로 중복 생성될 수 있다.
    // saveSentence가 저장한 Sentence를 반환해 성공 결과를 반영하고, 저장/알림/화면 갱신
    // 실패를 구분한다. 저장 성공 뒤 후속 실패에도 저장 결과가 정확히 안내되는지 검증한다.
    setList(await loadSentences());
  }

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text>어제 만든 문장: {yesterday?.text}</Text>
      <Text style={{ fontSize: 24 }}>{today.expression}</Text>
      <Text>{today.meaning}</Text>
      <TextInput value={text} onChangeText={setText} placeholder={today.example} />
      <Button title="저장" onPress={onSave} />
      <FlatList data={list} keyExtractor={(s) => s.id} renderItem={({ item }) => <Text>{item.text}</Text>} />
    </View>
  );
}
