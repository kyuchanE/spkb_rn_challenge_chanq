export type Expression = { id: string; expression: string; meaning: string; example: string };

export const EXPRESSIONS: Expression[] = [
  { id: "can-i-get", expression: "Can I get…?", meaning: "~ 주시겠어요? (주문할 때)", example: "Can I get an iced latte to go, please?" },
  { id: "running-late", expression: "I'm running late.", meaning: "늦을 것 같아요.", example: "Sorry, I'm running late. I'll be there in ten minutes." },
  { id: "do-you-mind-if", expression: "Do you mind if…?", meaning: "~해도 될까요?", example: "Do you mind if I sit here?" },
];
