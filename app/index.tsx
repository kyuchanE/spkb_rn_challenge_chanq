import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, Alert, FlatList } from "react-native";
import { pickToday } from "../src/lib/today";
import { loadSentences, saveSentence, getYesterdaySentence, Sentence } from "../src/lib/storage";
import { scheduleNextDayReminder } from "../src/lib/reminder";

export default function TodayScreen() {
  const today = pickToday();
  const [text, setText] = useState("");
  const [list, setList] = useState<Sentence[]>([]);
  const [yesterday, setYesterday] = useState<Sentence>();

  useEffect(() => {
    loadSentences().then(setList);
    getYesterdaySentence().then(setYesterday);
  }, []);

  async function onSave() {
    if (!text.includes(today.expression)) {
      Alert.alert("오늘의 표현을 넣어서 만들어 주세요");
      return;
    }
    await scheduleNextDayReminder();
    await saveSentence(today.id, text);
    setText("");
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
