import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import * as Speech from "expo-speech";
import { buildMixedPracticeQueue } from "@vocabulando/domain";
import { MOBILE_LEXICON, type MobileWordEntry } from "../data/mobileLexicon";
import type { VocabPalette } from "../theme/palettes";
import { playUiSound } from "../utils/soundEffects";
import { AppIcon } from "./AppIcon";

interface Props {
  palette: VocabPalette;
  soundEnabled: boolean;
  words?: MobileWordEntry[];
  studiedIds?: string[];
  dueIds?: string[];
  initialSeed?: number;
  onScore: (wordId: string, hit: boolean) => void;
}

export function ListeningChallenge({
  palette,
  soundEnabled,
  words = MOBILE_LEXICON,
  studiedIds = [],
  dueIds = [],
  initialSeed = 0,
  onScore,
}: Props) {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [showIpa, setShowIpa] = useState(false);

  const queue = useMemo(() => {
    const pool = words.length > 0 ? words : MOBILE_LEXICON;
    return buildMixedPracticeQueue(pool, studiedIds, dueIds, initialSeed, 4);
  }, [words, studiedIds, dueIds, initialSeed]);

  const current = queue[round % queue.length]!;
  const target = current.item;
  const distractors = MOBILE_LEXICON.filter((w) => w.word !== target.word);
  const options = [
    target.word,
    distractors[(initialSeed + round + 1) % distractors.length]!.word,
    distractors[(initialSeed + round + 4) % distractors.length]!.word,
  ].sort();

  async function playAudio() {
    Vibration.vibrate(6);
    try {
      await Speech.stop();
      setSpeaking(true);
      Speech.speak(target.word, {
        language: "pt-BR",
        rate: 0.85,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => {
          setSpeaking(false);
          setShowIpa(true);
        },
      });
    } catch {
      setSpeaking(false);
      setShowIpa(true);
    }
  }

  function handlePick(opt: string) {
    if (picked) return;
    setPicked(opt);
    const hit = opt === target.word;
    Vibration.vibrate(hit ? 14 : 30);
    playUiSound(hit ? "success" : "softError", soundEnabled);
    onScore(target.id, hit);
  }

  const stepPos = (round % queue.length) + 1;

  return (
    <View style={styles.container}>
      <View style={styles.topMeta}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>
          ESCUTA ATIVA • {target.categoryLabel.toUpperCase()}
        </Text>
        <Text style={{ color: palette.muted, fontSize: 12, fontWeight: "700" }}>
          {stepPos}/{queue.length}
        </Text>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: palette.surfaceAlt }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: palette.accent, width: `${Math.round((stepPos / queue.length) * 100)}%` },
          ]}
        />
      </View>

      {current.isReview && (
        <Text style={{ color: palette.gold, fontSize: 11, fontWeight: "700", textAlign: "center" }}>
          REVISÃO PARA FIXAR
        </Text>
      )}

      <Text style={[styles.prompt, { color: palette.text }]}>
        Ouça a pronúncia e escolha a palavra correta:
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ouvir palavra do desafio"
        style={[styles.audioBtn, { backgroundColor: palette.accentSoft, borderColor: palette.accent }]}
        onPress={() => void playAudio()}
      >
        <View style={styles.inlineRow}>
          <AppIcon name={speaking ? "volume" : "headphones"} size={20} color={palette.accent} />
          <Text style={[styles.audioText, { color: palette.accent }]}>
            {speaking ? "Reproduzindo..." : "Ouvir palavra"}
          </Text>
        </View>
      </Pressable>

      <Pressable onPress={() => setShowIpa((v) => !v)} style={{ alignSelf: "center" }}>
        <View style={styles.inlineRow}>
          <AppIcon name="lightbulb" size={14} color={palette.muted} />
          <Text style={{ color: palette.muted, fontSize: 12, fontWeight: "600" }}>
            {showIpa ? `Pronúncia: ${target.ipa}` : "Ver dica de pronúncia"}
          </Text>
        </View>
      </Pressable>

      <View style={{ gap: 10, marginTop: 6 }}>
        {options.map((opt) => {
          const isPicked = picked === opt;
          const isCorrect = opt === target.word;
          let bg = palette.surface;
          let border = palette.border;
          if (picked && isCorrect) {
            bg = palette.accentSoft;
            border = palette.success;
          } else if (isPicked && !isCorrect) {
            bg = palette.surfaceAlt;
            border = palette.danger;
          }
          return (
            <Pressable
              key={opt}
              accessibilityRole="button"
              style={[styles.optBtn, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handlePick(opt)}
            >
              <Text style={{ color: palette.text, fontSize: 16, fontWeight: "600" }}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>

      {picked && (
        <View style={{ gap: 10, marginTop: 4 }}>
          <Text
            style={{
              color: picked === target.word ? palette.success : palette.danger,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {picked === target.word
              ? `Perfeito! "${target.word}" significa: ${target.definition}`
              : `A palavra era "${target.word}".`}
          </Text>
          <Pressable
            style={[styles.nextBtn, { backgroundColor: palette.accent }]}
            onPress={() => {
              setPicked(null);
              setShowIpa(false);
              setRound((r) => r + 1);
            }}
          >
            <Text style={{ color: palette.accentInk, fontWeight: "700" }}>Próxima escuta →</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 18, gap: 10 },
  topMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  progressTrack: { height: 5, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  prompt: { fontSize: 17, fontWeight: "600", textAlign: "center" },
  inlineRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  audioBtn: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginVertical: 4,
  },
  audioText: { fontSize: 16, fontWeight: "700" },
  optBtn: { borderWidth: 1.5, borderRadius: 14, padding: 14, alignItems: "center" },
  nextBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
});
