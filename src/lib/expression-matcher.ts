/**
 * 화면·저장소·알림에 의존하지 않는 표현 사용 여부 검사기.
 * 동일 입력에 동일 결과를 반환하며 문장이나 표현 데이터를 변경하지 않는다.
 *
 * 콘텐츠 작성자는 화면 표시용 expression("Can I get…?")과 검사 전용 pattern
 * ("Can I get")을 구분해야 한다. 표시용 생략 기호를 검사 규칙으로 해석하지 않는다.
 * 정책 및 사용 예시: docs/expression-matching.md
 * 변경 시 확인할 회귀 사례: tests/expression-matcher.test.mjs
 */

/** 검사에 필요한 최소 정보만 받아 여러 화면과 콘텐츠에서 재사용한다. */
export type ExpressionPattern = {
  /** CONTIGUOUS: 고정 단어의 연속 일치. GAPPED: %로 표시한 가변 구간 포함. */
  type: "CONTIGUOUS" | "GAPPED";
  /** 고정 단어와 선택적으로 %를 포함하는 규칙. % 이외의 별도 패턴 문법은 없다. */
  pattern: string;
};

/**
 * 각 %가 소비하는 단어 수의 범위. 문장 전체 길이나 전체 gap의 합계 제한이 아니다.
 * 기본값은 최소 1개, 최대 5개이며 경계값도 허용한다.
 * 예: { minGapTokens: 2, maxGapTokens: 2 }는 각 gap을 정확히 두 단어로 제한한다.
 */
export type GapOptions = {
  minGapTokens?: number;
  maxGapTokens?: number;
};

/**
 * 입력 문장과 패턴에 같은 정규화를 적용해 표기 차이로 인한 불일치를 줄인다.
 * 1. NFKC: 전각 영문 등 호환 문자를 정규화한다(예: Ｃａｎ → Can).
 * 2. 곡선형/변형 아포스트로피를 '로 통일한다(예: I’m → I'm).
 * 3. 소문자로 통일한다. 공백과 구두점 처리는 다음 tokenize 단계에서 수행한다.
 *
 * 철자 교정, 축약형 확장(I'm ↔ I am), 활용형 변환(take ↔ took)은 하지 않는다.
 */
function normalize(value: string): string {
  return value.normalize("NFKC").replace(/[\u2018\u2019\u02bc]/g, "'").toLowerCase();
}

/**
 * 단순 split(" ") 대신 "문자/숫자로 이루어진 단어"를 추출한다.
 * - \p{L}/\p{N}: Unicode 문자/숫자. 대소문자는 normalize에서 처리한다.
 * - 단어 내부의 '는 유지하므로 "I'm", "o'clock"은 각각 하나의 토큰이다.
 * - 공백 여러 개, 탭, 개행, 구두점, 하이픈은 단어 사이 경계가 된다.
 * - 빈 문자열이나 구두점만 있는 입력은 []이다.
 *
 * 예: "Sorry, I’m running late!" → ["sorry", "i'm", "running", "late"].
 * 완전한 토큰을 비교하므로 get이 getting이나 forget의 일부에 일치하지 않는다.
 *
 * 운영상 한계: 문장부호도 경계로만 취급해 "Can. I get"도 "Can I get"과 일치한다.
 * 문장/절 경계를 넘지 않게 하거나 언어별 형태소를 분석하려면 별도 정책이 필요하다.
 */
function tokenize(value: string): string[] {
  return normalize(value).match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu) ?? [];
}

/**
 * 문장 안에 주어진 표현 패턴이 한 번이라도 등장하면 true를 반환한다.
 *
 * 일치 규칙:
 * - CONTIGUOUS: 고정 단어의 순서와 인접 관계가 모두 같아야 한다.
 * - GAPPED: 각 %가 범위 안의 단어를 소비한다. 앞/중간/끝 및 여러 %를 지원한다.
 * - 문장 전체 일치가 아닌 부분 일치이므로 일치 구간 앞뒤의 추가 단어는 허용한다.
 * - "between % and %"의 마지막 %도 최소 한 단어가 필요하다. 뒤에 여섯 단어가
 *   있더라도 그중 앞의 1~5개만 일치하면 true이며, 나머지 단어를 거절하지 않는다.
 * - 문법·의미의 정확성이나 활용형까지 보장하지 않으므로 정답 판정 범위를 과장하지 않는다.
 *
 * 동적 계획법(DP)을 사용하는 이유:
 * gap 길이를 하나로 확정하면 뒤쪽 고정 단어가 맞지 않을 때 유효한 다른 경로를 놓친다.
 * 여기서는 각 패턴 토큰을 처리한 뒤 도달 가능한 문장 위치를 모두 유지한다.
 * 서로 다른 경로가 같은 위치에 도달하면 boolean 하나로 합쳐 중복 탐색을 줄인다.
 *
 * 비용: 문장 토큰 수 N, 패턴 토큰 수 M, 최대 gap G에 대해 O(N × M × G) 시간.
 * DP 작업 공간은 O(N), 입력/패턴 토큰 배열까지 포함한 보조 공간은 O(N + M)이다.
 * gap 수에 따른 지수적 백트래킹은 없지만 긴 입력·패턴·큰 G에는 비용이 증가한다.
 * 서비스 입력 길이와 콘텐츠 패턴 크기는 호출부/등록 단계에서 정책으로 관리한다.
 *
 * @param sentence 사용자가 작성한 문장. 원본 문자열은 변경하지 않는다.
 * @param expression 표시 문자열이 아닌 type과 pattern을 포함한 검사 규칙.
 * @param options 모든 %에 공통 적용할 단어 수 범위. 생략 시 1~5개.
 * @returns 일치 시 true. 불일치와 잘못된 패턴/범위 설정은 모두 false.
 *   따라서 false만으로 사용자 문장 오류와 콘텐츠 설정 오류를 구분할 수 없다.
 *   콘텐츠 등록 시 설정을 별도로 검증해야 잘못된 콘텐츠를 사용자 오답으로 처리하지 않는다.
 *
 * @example
 * matchesExpression("Can I get a latte?", { type: "CONTIGUOUS", pattern: "Can I get" }); // true
 * matchesExpression("take income into account", { type: "GAPPED", pattern: "take % into account" }); // true
 * matchesExpression("take into account", { type: "GAPPED", pattern: "take % into account" }); // false
 */
export function matchesExpression(
  sentence: string,
  expression: ExpressionPattern,
  options: GapOptions = {},
): boolean {
  // 1. 소비할 토큰 수는 유한한 양의 정수여야 하며 최소값이 최대값을 넘을 수 없다.
  // 0단어 gap은 현재 지원하지 않는다. 설정 오류 시 예외 대신 false를 반환한다.
  // 이 검증은 CONTIGUOUS에도 적용되므로 gap을 쓰지 않더라도 잘못된 options는 거절한다.
  // TypeScript 타입을 전제로 한 API이므로 null/문자열이 아닌 값의 입력 검증은 호출부 책임이다.
  const { minGapTokens = 1, maxGapTokens = 5 } = options;
  if (
    !Number.isInteger(minGapTokens) ||
    !Number.isInteger(maxGapTokens) ||
    minGapTokens < 1 ||
    maxGapTokens < minGapTokens
  ) {
    return false;
  }

  // 2. 타입과 패턴의 의도가 일치하는지 확인한다.
  // CONTIGUOUS에는 %가 없어야 하고, GAPPED에는 최소 하나가 있어야 한다.
  // %는 예약 문자로 사용하므로 현재 문법으로는 리터럴 퍼센트 기호를 검사할 수 없다.
  const pattern = normalize(expression.pattern);
  const hasGap = pattern.includes("%");
  if (
    (expression.type !== "CONTIGUOUS" && expression.type !== "GAPPED") ||
    (expression.type === "GAPPED") !== hasGap
  ) {
    return false;
  }

  // 3. 고정 단어는 tokenize하고, 구분자로 사용한 %는 별도 토큰으로 복원한다.
  // "take % into account" → ["take", "%", "into", "account"].
  // % 주변에 공백이 없어도 동일하며, 맨 앞/끝의 %도 버리지 않는다.
  // 연속된 %%는 두 개의 독립 gap으로 처리되어 기본 합계 2~10단어를 소비할 수 있다.
  // 콘텐츠 작성 시 불필요한 % 중복으로 허용 범위가 넓어지지 않도록 확인한다.
  const patternTokens = pattern.split("%").flatMap((part, index) =>
    index === 0 ? tokenize(part) : ["%", ...tokenize(part)],
  );
  // 빈 패턴, 구두점뿐인 패턴, %만 있는 패턴은 어떤 표현을 검사하는지 특정할 수 없다.
  if (!patternTokens.some((token) => token !== "%")) return false;

  const sentenceTokens = tokenize(sentence);
  // 4. reachable[i]는 "지금까지의 패턴을 처리한 결과, 다음에 읽을 문장 위치가 i인
  // 경로가 존재한다"는 뜻이다. 단어가 아니라 단어 사이 경계를 나타내므로 N+1칸이다.
  // 예: ["take", "income", "into", "account"]의 위치 0은 시작, 4는 문장 끝이다.
  // 초기에는 아직 패턴을 소비하지 않았다. 모든 위치를 true로 두어 문장 어디서든
  // 일치를 시작할 수 있게 한다. 이후 단계는 이전 단계에서 도달한 위치만 확장한다.
  let reachable = new Array<boolean>(sentenceTokens.length + 1).fill(true);

  for (const token of patternTokens) {
    // 이전 단계(reachable)를 읽고 현재 단계(next)에만 쓴다.
    // 같은 배열을 즉시 갱신하면 방금 만든 위치를 같은 토큰으로 다시 확장할 수 있어
    // 고정 단어나 gap을 의도보다 여러 번 소비하는 오류가 생길 수 있다.
    const next = new Array<boolean>(sentenceTokens.length + 1).fill(false);

    for (let start = 0; start < sentenceTokens.length; start += 1) {
      // 일치 가능한 이전 경로가 없는 위치는 다음 단계로 확장하지 않는다.
      // 문장 끝(N)에서는 최소 한 단어를 더 소비할 수 없으므로 반복 범위에서 제외한다.
      if (!reachable[start]) continue;

      if (token === "%") {
        // 5-A. gap은 허용 범위의 모든 길이를 후보로 남긴다. 최단/최장 하나만 선택하지 않는다.
        // 남은 단어보다 많이 소비하지 않게 상한을 자르고, 최소 길이보다 남은 단어가 적으면
        // 반복이 실행되지 않아 이 경로는 자연스럽게 실패한다.
        const maxLength = Math.min(maxGapTokens, sentenceTokens.length - start);
        for (let length = minGapTokens; length <= maxLength; length += 1) {
          next[start + length] = true;
        }
      } else if (sentenceTokens[start] === token) {
        // 5-B. 고정 단어는 현재 위치에서 완전 일치할 때만 정확히 한 단어를 소비한다.
        // 단어가 다르다고 임의로 건너뛰지 않으므로 고정 구간의 연속성이 유지된다.
        next[start + 1] = true;
      }
    }

    // 6. 어떤 경로도 남지 않으면 뒤의 패턴을 처리해도 회복할 수 없어 즉시 실패한다.
    // 첫 고정 단어가 여러 번 나온 경우도 각 시작 위치를 이미 함께 탐색했으므로,
    // 첫 번째 등장 위치만 보고 잘못 실패하는 방식과 다르다.
    if (!next.some(Boolean)) return false;
    reachable = next;
  }

  // 7. 모든 패턴을 소비한 경로가 하나라도 있으면 성공이다. 문장 끝에 도달할 필요는 없다.
  // 추적 예시: 문장 "take income into account", 패턴 "take % into account".
  // 도달 위치: 초기 {0,1,2,3,4} → take {1} → % {2,3,4} → into {3} → account {4}.
  // 여러 gap도 이 과정을 반복하며, 서로 다른 경로는 같은 위치에서 합쳐진다.
  return reachable.some(Boolean);
}
