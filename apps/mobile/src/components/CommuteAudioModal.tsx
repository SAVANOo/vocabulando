import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import * as Speech from "expo-speech";
import type { MobileWordEntry } from "../data/mobileLexicon";
import type { VocabPalette } from "../theme/palettes";
import { AppIcon } from "./AppIcon";

interface Props {
  visible: boolean;
  words: MobileWordEntry[];
  palette: VocabPalette;
  onClose: () => void;
}

export function CommuteAudioModal({ visible, words, palette, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<0.85 | 1.0>(0.9 as 0.85);

  const current = words[index % Math.max(1, words.length)];

  useEffect(() => {
    if (!visible) {
      void Speech.stop();
    }
  }, [visible]);

  function speakCurrent(idx: number) {
    const item = words[idx % Math.max(1, words.length)];
    if (!item) return;
    setPlaying(true);
    const script = `${item.word}. ${item.definition}. Exemplo: ${item.example}`;
    Speech.speak(script, {
      language: "pt-BR",
      rate,
      onDone: () => {
        setPlaying(false);
      },
      onStopped: () => setPlaying(false),
      onError: () => setPlaying(false),
    });
  }

  function togglePlay() {
    if (playing) {
      void Speech.stop();
      setPlaying(false);
    } else {
      speakCurrent(index);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.topRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <AppIcon name="headphones" size={20} color={palette.accent} />
              <Text style={[styles.title, { color: palette.text }]}>Modo Trajeto (Áudio)</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void Speech.stop();
                onClose();
              }}
            >
              <Text style={{ color: palette.muted, fontSize: 13, fontWeight: "700" }}>Fechar</Text>
            </Pressable>
          </View>

          {current && (
            <View style={[styles.card, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}>
              <Text style={{ color: palette.accent, fontSize: 11, fontWeight: "700" }}>
                {current.themeLabel ?? current.categoryLabel}
              </Text>
              <Text style={{ color: palette.text, fontSize: 26, fontWeight: "800" }}>
                {current.word}
              </Text>
              <Text style={{ color: palette.muted, fontSize: 14 }}>{current.definition}</Text>
              <Text style={{ color: palette.text, fontSize: 14, fontStyle: "italic" }}>
                "{current.example}"
              </Text>
            </View>
          )}

          <View style={styles.controls}>
            <Pressable
              style={[styles.secBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
              onPress={() => setRate((r) => (r === 1.0 ? 0.85 : 1.0))}
            >
              <Text style={{ color: palette.text, fontWeight: "700" }}>{rate}x</Text>
            </Pressable>
            <Pressable
              style={[styles.playBtn, { backgroundColor: palette.accent }]}
              onPress={togglePlay}
            >
              <Text style={{ color: palette.accentInk, fontWeight: "700", fontSize: 15 }}>
                {playing ? "Pausar áudio" : "Ouvir palavra + frase"}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.secBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
              onPress={() => {
                void Speech.stop();
                const next = index + 1;
                setIndex(next);
                speakCurrent(next);
              }}
            >
              <Text style={{ color: palette.text, fontWeight: "700" }}>Próxima →</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTopWidth: 1, padding: 18, gap: 14 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 17, fontWeight: "700" },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  controls: { flexDirection: "row", gap: 8, alignItems: "center" },
  secBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  playBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
});
