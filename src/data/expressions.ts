import type { ExpressionPattern } from "../lib/expression-matcher";

/**
 * 콘텐츠의 표시 정보와 검사 규칙을 함께 관리한다.
 * ExpressionPattern을 공유하므로 검사기와 데이터의 type/pattern 계약이 일치한다.
 * type-only import이므로 콘텐츠 모듈을 읽을 때 검사기를 실행하지 않는다.
 */
export type Expression = ExpressionPattern & {
  /** 저장된 학습 결과가 참조하는 식별자. 표시 문구를 바꿔도 기존 id는 유지한다. */
  id: string;
  /** 학습자에게 보여 줄 제목. … 또는 A/B 같은 자리 표시자를 포함할 수 있다. */
  expression: string;
  meaning: string;
  /** 이 예문은 같은 항목의 검사 규칙을 반드시 통과해야 한다(npm test에서 검증). */
  example: string;
};

/**
 * 콘텐츠 추가 규칙:
 * - CONTIGUOUS: 고정 단어만 작성한다. "Can I get…?"의 검사 패턴은 "Can I get"이다.
 * - GAPPED: 가변 구간을 %로 작성한다. A/B는 표시 문자열에만 쓰고 패턴에는 넣지 않는다.
 * - 각 %는 최소 1개, 최대 5개 단어를 허용하며 마지막 %도 예외가 아니다.
 * - 대소문자/구두점 정규화, 부분 일치 등 판정 정책은 expression-matcher.ts에 정의한다.
 * - 새 표현마다 실제 예문과 경계/실패 사례를 테스트에 추가해 콘텐츠 설정 오류를 막는다.
 *
 * 이 배열에는 기존 세 표현을 보존하고 불연속 표현 두 개를 추가했다.
 * 배열 길이/순서를 바꾸면 현재 pickToday의 선택 결과도 바뀐다(ISSUE-08 참고).
 */
export const EXPRESSIONS: Expression[] = [
  {
    id: "can-i-get",
    expression: "Can I get…?",
    meaning: "~ 주시겠어요? (주문할 때)",
    example: "Can I get an iced latte to go, please?",
    type: "CONTIGUOUS",
    pattern: "Can I get",
  },
  {
    id: "running-late",
    expression: "I'm running late.",
    meaning: "늦을 것 같아요.",
    example: "Sorry, I'm running late. I'll be there in ten minutes.",
    type: "CONTIGUOUS",
    pattern: "I'm running late",
  },
  {
    id: "do-you-mind-if",
    expression: "Do you mind if…?",
    meaning: "~해도 될까요?",
    example: "Do you mind if I sit here?",
    type: "CONTIGUOUS",
    pattern: "Do you mind if",
  },
  {
    id: "between-a-and-b",
    expression: "between A and B",
    meaning: "~사이",
    example: "Arrive between 9 and 10 o'clock.",
    type: "GAPPED",
    pattern: "between % and %",
  },
  {
    id: "take-a-into-account",
    expression: "take A into account",
    meaning: "~고려하다",
    example: "The study did not take income into account.",
    type: "GAPPED",
    pattern: "take % into account",
  },
];
