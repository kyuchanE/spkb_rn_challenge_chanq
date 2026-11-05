import { EXPRESSIONS, Expression } from "../data/expressions";

// 날짜 키 예: "2026-10-20"
export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function pickToday(now: Date = new Date()): Expression {
  const day = now.getDate();
  return EXPRESSIONS[day % EXPRESSIONS.length];
}
