import assert from "node:assert/strict";
import { test } from "node:test";

import { EXPRESSIONS } from "../src/data/expressions.ts";
import { matchesExpression } from "../src/lib/expression-matcher.ts";

const contiguous = (pattern) => ({ type: "CONTIGUOUS", pattern });
const gapped = (pattern) => ({ type: "GAPPED", pattern });

// 단어 경계·정규화·gap 범위·시작 위치 재탐색을 각각 독립된 입력/기대값으로 검증한다.
// 새 정책을 도입할 때 기존 기대값을 임의로 바꾸지 말고 콘텐츠 계약과 함께 검토한다.
const cases = [
  ["fixed phrase inside a sentence", "Please, can I get a latte?", contiguous("Can I get"), true],
  ["case-insensitive words", "CAN I GET coffee?", contiguous("Can I get"), true],
  ["tabs and newlines", "Can\tI\nget coffee?", contiguous("Can I get"), true],
  ["punctuation normalization", "Can, I get coffee!", contiguous("Can I get?"), true],
  ["curly apostrophe", "Sorry, I’m running late!", contiguous("I'm running late."), true],
  ["do not expand contractions implicitly", "I am running late.", contiguous("I'm running late"), false],
  ["Unicode width normalization", "Ｃａｎ I get coffee?", contiguous("Can I get"), true],
  ["reject partial final word", "Can I getting coffee?", contiguous("Can I get"), false],
  ["reject partial first word", "Scan I get coffee?", contiguous("Can I get"), false],
  ["fixed words must be adjacent", "Can I really get coffee?", contiguous("Can I get"), false],
  ["fixed words must be ordered", "I can get coffee.", contiguous("Can I get"), false],
  ["empty input", "", contiguous("Can I get"), false],
  ["punctuation-only input", "...!?", contiguous("Can I get"), false],
  ["empty pattern", "Can I get coffee?", contiguous(""), false],
  ["punctuation-only pattern", "Can I get coffee?", contiguous("...?"), false],
  ["contiguous patterns cannot contain gaps", "take income into account", contiguous("take % into account"), false],
  ["gapped patterns require a gap", "take into account", gapped("take into account"), false],
  ["all-gap patterns are invalid", "some words here", gapped("% %"), false],
  ["one-word gap", "We take income into account.", gapped("take % into account"), true],
  ["five-word gap", "take one two three four five into account", gapped("take % into account"), true],
  ["empty gap is rejected", "take into account", gapped("take % into account"), false],
  ["six-word gap is rejected", "take one two three four five six into account", gapped("take % into account"), false],
  ["fixed suffix must be adjacent", "take income into careful account", gapped("take % into account"), false],
  ["do not reorder fixed segments", "into account take income", gapped("take % into account"), false],
  ["two gaps with numbers and contraction", "Arrive between 9 and 10 o'clock.", gapped("between % and %"), true],
  ["two gaps at maximum length", "between one two three four five and six seven eight nine ten", gapped("between % and %"), true],
  ["missing first gap", "between and ten", gapped("between % and %"), false],
  ["missing final gap", "between nine and", gapped("between % and %"), false],
  ["oversized internal gap", "between one two three four five six and ten", gapped("between % and %"), false],
  ["try later occurrences of the prefix", "take one two three four five six and take income into account", gapped("take % into account"), true],
  ["retain alternative gap lengths", "take a into b into c d e f account", gapped("take % into % account"), true],
  ["three gaps", "put one between two and three now", gapped("put % between % and % now"), true],
  ["leading gap", "We take income into account", gapped("% take % into account"), true],
  ["leading gap must consume words", "take income into account", gapped("% take % into account"), false],
  ["trailing gap matches part of a longer suffix", "between nine and one two three four five six", gapped("between % and %"), true],
  ["gap marker needs no surrounding spaces", "take income into account", gapped("take%into account"), true],
  // 연속된 %%도 각각 최소 1개를 소비한다. 두 gap의 합은 기본 2~10개이다.
  ["adjacent gaps consume two words", "take annual income into account", gapped("take %% into account"), true],
  ["adjacent gaps cannot share a word", "take income into account", gapped("take %% into account"), false],
  ["adjacent gaps allow ten words", `take ${"word ".repeat(10)}into account`, gapped("take %% into account"), true],
  ["adjacent gaps reject eleven words", `take ${"word ".repeat(11)}into account`, gapped("take %% into account"), false],
];

for (const [name, sentence, expression, expected] of cases) {
  test(name, () => {
    assert.equal(matchesExpression(sentence, expression), expected);
  });
}

// 콘텐츠 등록 계약: 학습자에게 보여 줄 예문은 같은 항목의 pattern을 통과해야 한다.
for (const expression of EXPRESSIONS) {
  test(`provided example matches: ${expression.id}`, () => {
    assert.equal(matchesExpression(expression.example, expression), true);
  });
}

test("gap limits are configurable", () => {
  const expression = gapped("take % into account");
  assert.equal(matchesExpression("take one two into account", expression, { minGapTokens: 2, maxGapTokens: 2 }), true);
  assert.equal(matchesExpression("take one into account", expression, { minGapTokens: 2, maxGapTokens: 2 }), false);
  assert.equal(matchesExpression("take one two three into account", expression, { minGapTokens: 2, maxGapTokens: 2 }), false);
  assert.equal(matchesExpression("take one two three four five six into account", expression, { maxGapTokens: 6 }), true);
});

test("invalid gap limits do not match", () => {
  for (const options of [
    { minGapTokens: 0 },
    { minGapTokens: -1 },
    { minGapTokens: 2, maxGapTokens: 1 },
    { maxGapTokens: 1.5 },
    { maxGapTokens: Infinity },
    { minGapTokens: NaN },
  ]) {
    assert.equal(matchesExpression("take income into account", gapped("take % into account"), options), false);
  }
});

// CONTIGUOUS에서도 options 검증을 생략하지 않는 현재 계약을 고정한다.
test("contiguous patterns also reject invalid gap options", () => {
  assert.equal(matchesExpression("Can I get a latte?", contiguous("Can I get"), { minGapTokens: 0 }), false);
});

// TypeScript 바깥의 호출자/외부 데이터가 잘못된 type을 넘긴 경우를 검증한다.
test("unknown expression types do not match", () => {
  assert.equal(matchesExpression("Can I get a latte?", { type: "UNKNOWN", pattern: "Can I get" }), false);
});

// 종료 지점이 없는 반복 패턴으로, 다중 gap의 후보를 합쳐 처리하는 경로도 검증한다.
test("many ambiguous gaps terminate without exponential exploration", () => {
  const sentence = `start ${"a ".repeat(150)}missing`;
  const expression = gapped(`start ${"% a ".repeat(20)}% end`);
  assert.equal(matchesExpression(sentence, expression), false);
});
