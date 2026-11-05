import AsyncStorage from "@react-native-async-storage/async-storage";
import { todayKey } from "./today";

const KEY = "sentences";

export type Sentence = { id: string; expressionId: string; text: string; dateKey: string };

export async function loadSentences(): Promise<Sentence[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveSentence(expressionId: string, text: string): Promise<void> {
  const list = await loadSentences();
  list.push({ id: String(Date.now()), expressionId, text, dateKey: todayKey() });
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function getYesterdaySentence(): Promise<Sentence | undefined> {
  const list = await loadSentences();
  return list[list.length - 1];
}
