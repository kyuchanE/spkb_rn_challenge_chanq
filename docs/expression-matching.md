# Expression matching

`matchesExpression(sentence, expression, options?)`는 React나 저장소에 의존하지 않는 순수 함수입니다.

```ts
import { matchesExpression } from "../lib/expression-matcher";

matchesExpression("Can I get a latte?", {
  type: "CONTIGUOUS",
  pattern: "Can I get",
}); // true

matchesExpression("We take income into account.", {
  type: "GAPPED",
  pattern: "take % into account",
}); // true
```

- `expression`은 화면 표시용이고, `pattern`은 검사에 사용합니다.
- 대소문자, 공백과 구두점은 정규화합니다. 축약형의 아포스트로피는 유지하고 곡선형 아포스트로피도 같은 문자로 취급합니다.
- 고정 단어는 완전한 단어 단위로 연속해서 일치해야 합니다. `get`은 `getting`과 일치하지 않습니다.
- 각 `%`는 기본적으로 1~5개의 단어를 소비합니다. 세 번째 인자 `{ minGapTokens: 1, maxGapTokens: 5 }`로 범위를 지정할 수 있습니다.
- 연속된 `%%`는 두 개의 독립 gap이므로 기본 합계 2~10개 단어를 소비합니다. 의도 없이 중복하지 않도록 콘텐츠 작성 시 확인합니다.
- 문장 전체가 아닌 문장 내 부분 일치입니다. `between % and %`의 마지막 `%`는 `and` 뒤의 1~5개 단어와 일치하면 되므로, 이후 단어가 더 있어도 허용됩니다. 전체 문장 길이를 5단어로 제한하지 않습니다.
- 구두점은 단어 경계로 취급합니다. 문장부호를 통한 절 경계, 문법, 의미, 활용형(`take`/`took`)의 동등성은 검사하지 않습니다.
- 빈 패턴, 고정 단어가 없는 패턴, `type`과 `%` 사용이 맞지 않는 패턴은 `false`를 반환합니다.

동적 계획법으로 각 패턴 토큰까지 일치한 문장 위치들을 유지합니다. 여러 gap에서 하나의 길이만 선택하지 않으므로 중간에 실패한 경우 다른 후보로도 일치 여부를 검토합니다.

문장 토큰 수가 N, 패턴 토큰 수가 M, 최대 gap 길이가 G일 때 시간 복잡도는 O(N×M×G), DP 작업 공간은 O(N)입니다. 토큰 배열까지 포함한 보조 공간은 O(N+M)입니다.

테스트 실행: `npm test`
