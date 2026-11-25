import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, Vibration, View } from "react-native";
import type { DifficultyLevel, TrackCategory } from "@vocabulando/domain";
import type { VocabPalette } from "../theme/palettes";
import { playUiSound } from "../utils/soundEffects";

export interface UserPreferences {
  userName: string;
  goal: string;
  tracks: TrackCategory[];
  difficulty: DifficultyLevel;
  dailyGoalWords: number;
}

interface Props {
  palette: VocabPalette;
  soundEnabled: boolean;
  initialPrefs: UserPreferences;
  onFinish: (prefs: UserPreferences) => void;
}

const TRACKS: Array<{ value: TrackCategory; label: string; desc: string }> = [
  { value: "essencial-culto", label: "Essencial Culto", desc: "Repertório elegante no dia a dia" },
  { value: "comunicacao-executiva", label: "Comunicação Executiva", desc: "Reuniões, apresentações e e-mails" },
  { value: "redacao-argumentacao", label: "Redação & Argumentação", desc: "Precisão para provas e textos" },
  { value: "literario-poetico", label: "Literário & Poético", desc: "Expressões ricas e imagéticas" },
  { value: "paronimos", label: "Parônimos", desc: "Nunca mais confundir pares parecidos" },
];

export function OnboardingFlow({ palette, soundEnabled, initialPrefs, onFinish }: Props) {
  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState(initialPrefs.userName);
  const [goal, setGoal] = useState(initialPrefs.goal);
  const [tracks, setTracks] = useState<TrackCategory[]>(initialPrefs.tracks);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialPrefs.difficulty);
  const [dailyGoalWords, setDailyGoalWords] = useState(initialPrefs.dailyGoalWords || 3);

  function toggleTrack(val: TrackCategory) {
    Vibration.vibrate(8);
    playUiSound("save", soundEnabled);
    setTracks((prev) =>
      prev.includes(val) ? (prev.length > 1 ? prev.filter((x) => x !== val) : prev) : [...prev, val],
    );
  }

  function complete() {
    Vibration.vibrate(15);
    playUiSound("success", soundEnabled);
    onFinish({
      userName: userName.trim() || "Estudante",
      goal,
      tracks,
      difficulty,
      dailyGoalWords,
    });
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: palette.bg }]}>
      {step === 0 && (
        <View style={styles.block}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>SUA JORNADA COMEÇA AQUI</Text>
          <Text style={[styles.title, { color: palette.text }]}>
            Domine novas palavras no seu ritmo.
          </Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>
            Cards limpos que viram ao tocar, trilha interativa contínua e desafios de precisão lexical. Como você gostaria de ser chamado(a)?
          </Text>
          <TextInput
            accessibilityLabel="Seu nome"
            value={userName}
            onChangeText={setUserName}
            placeholder="Seu nome"
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text },
            ]}
          />
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: palette.accent }]}
            onPress={() => {
              Vibration.vibrate(10);
              setStep(1);
            }}
          >
            <Text style={[styles.primaryText, { color: palette.accentInk }]}>Personalizar trilhas</Text>
          </Pressable>
          <Pressable style={styles.ghostBtn} onPress={complete}>
            <Text style={[styles.ghostText, { color: palette.muted }]}>Pular e começar agora</Text>
          </Pressable>
        </View>
      )}

      {step === 1 && (
        <View style={styles.block}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>PASSO 1 DE 4 • OBJETIVO</Text>
          <Text style={[styles.title, { color: palette.text }]}>Onde quer se destacar?</Text>
          {[
            ["carreira", "Comunicação no Trabalho"],
            ["redacao", "Redação, Concursos & Provas"],
            ["oratoria", "Oratória & Persuasão"],
            ["cultura", "Leitura & Repertório Cultural"],
          ].map(([id, label]) => {
            const active = goal === id;
            return (
              <Pressable
                key={id}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: active ? palette.accentSoft : palette.surface,
                    borderColor: active ? palette.accent : palette.border,
                  },
                ]}
                onPress={() => {
                  Vibration.vibrate(8);
                  setGoal(id);
                }}
              >
                <Text style={[styles.optionTitle, { color: palette.text }]}>{label}</Text>
              </Pressable>
            );
          })}
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: palette.accent }]}
            onPress={() => setStep(2)}
          >
            <Text style={[styles.primaryText, { color: palette.accentInk }]}>Continuar</Text>
          </Pressable>
        </View>
      )}

      {step === 2 && (
        <View style={styles.block}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>PASSO 2 DE 4 • TRILHAS</Text>
          <Text style={[styles.title, { color: palette.text }]}>
            Quais temas quer ver no seu Início?
          </Text>
          {TRACKS.map((t) => {
            const active = tracks.includes(t.value);
            return (
              <Pressable
                key={t.value}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: active ? palette.accentSoft : palette.surface,
                    borderColor: active ? palette.accent : palette.border,
                  },
                ]}
                onPress={() => toggleTrack(t.value)}
              >
                <Text style={[styles.optionTitle, { color: palette.text }]}>{t.label}</Text>
                <Text style={[styles.optionDesc, { color: palette.muted }]}>{t.desc}</Text>
              </Pressable>
            );
          })}
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: palette.accent }]}
            onPress={() => setStep(3)}
          >
            <Text style={[styles.primaryText, { color: palette.accentInk }]}>Continuar</Text>
          </Pressable>
        </View>
      )}

      {step === 3 && (
        <View style={styles.block}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>PASSO 3 DE 4 • NÍVEL</Text>
          <Text style={[styles.title, { color: palette.text }]}>Qual profundidade prefere?</Text>
          {(
            [
              ["intermediario", "Intermediário", "Palavras úteis e naturais para o dia a dia"],
              ["avancado", "Avançado", "Precisão lexical, nuances e argumentação"],
              ["erudito", "Erudito", "Vocabulário literário, raro e sofisticado"],
            ] as const
          ).map(([id, label, desc]) => {
            const active = difficulty === id;
            return (
              <Pressable
                key={id}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: active ? palette.accentSoft : palette.surface,
                    borderColor: active ? palette.accent : palette.border,
                  },
                ]}
                onPress={() => {
                  Vibration.vibrate(8);
                  setDifficulty(id);
                }}
              >
                <Text style={[styles.optionTitle, { color: palette.text }]}>{label}</Text>
                <Text style={[styles.optionDesc, { color: palette.muted }]}>{desc}</Text>
              </Pressable>
            );
          })}
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: palette.accent }]}
            onPress={() => setStep(4)}
          >
            <Text style={[styles.primaryText, { color: palette.accentInk }]}>Continuar</Text>
          </Pressable>
        </View>
      )}

      {step === 4 && (
        <View style={styles.block}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>PASSO 4 DE 4 • DEDICAÇÃO</Text>
          <Text style={[styles.title, { color: palette.text }]}>
            Quanto tempo quer dedicar por dia?
          </Text>
          {[
            { count: 2, label: "Casual • 2 palavras/dia", desc: "~30 segundos por dia, sem pressão" },
            { count: 3, label: "Regular • 3 palavras/dia", desc: "~1 minuto por dia (Recomendado)" },
            { count: 5, label: "Intenso • 5 palavras/dia", desc: "~2 minutos por dia para acelerar" },
          ].map((opt) => {
            const active = dailyGoalWords === opt.count;
            return (
              <Pressable
                key={opt.count}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: active ? palette.accentSoft : palette.surface,
                    borderColor: active ? palette.accent : palette.border,
                  },
                ]}
                onPress={() => {
                  Vibration.vibrate(8);
                  setDailyGoalWords(opt.count);
                }}
              >
                <Text style={[styles.optionTitle, { color: palette.text }]}>{opt.label}</Text>
                <Text style={[styles.optionDesc, { color: palette.muted }]}>{opt.desc}</Text>
              </Pressable>
            );
          })}
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: palette.accent }]}
            onPress={complete}
          >
            <Text style={[styles.primaryText, { color: palette.accentInk }]}>Começar minha meta</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32, justifyContent: "center" },
  block: { gap: 12 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.3 },
  title: { fontSize: 26, fontWeight: "700", lineHeight: 32 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  optionCard: { borderWidth: 1.5, borderRadius: 14, padding: 14, gap: 4 },
  optionTitle: { fontSize: 15, fontWeight: "600" },
  optionDesc: { fontSize: 13 },
  primaryBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  primaryText: { fontSize: 15, fontWeight: "700" },
  ghostBtn: { paddingVertical: 10, alignItems: "center" },
  ghostText: { fontSize: 14 },
});
