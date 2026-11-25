import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, Vibration, View } from "react-native";
import { buildMixedPracticeQueue, buildQuizBlank } from "@vocabulando/domain";
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

function normalizeWord(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function WritingChallenge({
  palette,
  soundEnabled,
  words = MOBILE_LEXICON,
  studiedIds = [],
  dueIds = [],
  initialSeed = 0,
  onScore,
}: Props) {
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<{ hit: boolean; text: string } | null>(null);

  const queue = useMemo(() => {
    const pool = words.length > 0 ? words : MOBILE_LEXICON;
    return buildMixedPracticeQueue(pool, studiedIds, dueIds, initialSeed + 1, 4);
  }, [words, studiedIds, dueIds, initialSeed]);

  const current = queue[round % queue.length]!;
  const target = current.item;
  const blank = buildQuizBlank(target.example, target.word, target.definition);
  const stepPos = (round % queue.length) + 1;

  function submit() {
    if (result || answer.trim().length === 0) return;
    const hit = normalizeWord(answer) === normalizeWord(target.word);
    Vibration.vibrate(hit ? 14 : 30);
    playUiSound(hit ? "success" : "softError", soundEnabled);
    setResult({
      hit,
      text: hit
        ? `Excelente escrita! "${target.word}" encaixou perfeitamente.`
        : `Quase! A palavra esperada era "${target.word}".`,
    });
    onScore(target.id, hit);
  }

  return (
    <View style={styles.container}>
      <View style={styles.topMeta}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>
          ESCRITA EM CONTEXTO • {target.categoryLabel.toUpperCase()}
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

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        {current.isReview && (
          <Text style={{ color: palette.gold, fontSize: 11, fontWeight: "700" }}>
            REVISÃO PARA FIXAR
          </Text>
        )}
        <Text style={[styles.sentence, { color: palette.text }]}>{blank.prompt}</Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => setShowHint((v) => !v)}
          style={[styles.hintBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
        >
          <View style={styles.inlineRow}>
            <AppIcon name="lightbulb" size={14} color={palette.accent} />
            <Text style={{ color: palette.accent, fontSize: 12, fontWeight: "700" }}>
              {showHint ? "Ocultar dica" : "Ver dica"}
            </Text>
          </View>
        </Pressable>

        {showHint && (
          <Text style={{ color: palette.muted, fontSize: 13, lineHeight: 19 }}>
            {target.definition} (começa com "{target.word[0]?.toUpperCase()}")
          </Text>
        )}

        <TextInput
          accessibilityLabel="Digite a palavra que completa a frase"
          placeholder="Digite a palavra..."
          placeholderTextColor={palette.muted}
          value={answer}
          onChangeText={setAnswer}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!result}
          style={[
            styles.input,
            {
              backgroundColor: palette.surfaceAlt,
              borderColor: palette.border,
              color: palette.text,
            },
          ]}
        />

        {!result ? (
          <Pressable
            accessibilityRole="button"
            style={[styles.primaryBtn, { backgroundColor: palette.accent }]}
            onPress={submit}
          >
            <Text style={{ color: palette.accentInk, fontWeight: "700" }}>Verificar resposta</Text>
          </Pressable>
        ) : (
          <View style={{ gap: 10 }}>
            <Text
              style={{
                color: result.hit ? palette.success : palette.danger,
                fontWeight: "700",
                fontSize: 14,
              }}
            >
              {result.text}
            </Text>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: palette.accent }]}
              onPress={() => {
                setAnswer("");
                setShowHint(false);
                setResult(null);
                setRound((r) => r + 1);
              }}
            >
              <Text style={{ color: palette.accentInk, fontWeight: "700" }}>Próxima escrita →</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 18, gap: 10 },
  topMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  progressTrack: { height: 5, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  sentence: { fontSize: 17, lineHeight: 24 },
  inlineRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  hintBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
  },
  primaryBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
});
