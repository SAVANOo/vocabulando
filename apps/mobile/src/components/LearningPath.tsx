import React, { useEffect, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from "react-native";
import type { VocabPalette } from "../theme/palettes";
import { AppIcon, type AppIconName } from "./AppIcon";

export type PathExerciseKind =
  | "track"
  | "listening"
  | "synonyms"
  | "upgrade"
  | "writing"
  | "freewrite"
  | "radar"
  | "paronyms"
  | "sprint"
  | "quiz";

export interface PathNodeAction {
  id: string;
  unitTitle?: string;
  icon: AppIconName;
  title: string;
  subtitle: string;
  kind: PathExerciseKind;
  seedOffset: number;
  completed: boolean;
}

interface Props {
  palette: VocabPalette;
  studiedCount: number;
  quizCorrectCount: number;
  dueReviewsCount: number;
  totalXp: number;
  onSelectNode: (kind: PathExerciseKind, seedOffset: number) => void;
}

const NODE_OFFSETS = [0, 36, 52, 18, -32, -48];

export function LearningPath({
  palette,
  studiedCount,
  quizCorrectCount,
  dueReviewsCount,
  totalXp,
  onSelectNode,
}: Props) {
  const [extraUnits, setExtraUnits] = useState(1);
  const [selectedNode, setSelectedNode] = useState<PathNodeAction | null>(null);
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const unlockedUnits = Math.max(2, Math.floor(totalXp / 120) + 1) + extraUnits;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.09, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const baseCycle: Array<{
    icon: AppIconName;
    title: string;
    subtitle: string;
    kind: PathExerciseKind;
  }> = [
    {
      icon: "book",
      title: "Leitura & Descoberta",
      subtitle: "Explore novas palavras nos cards",
      kind: "track",
    },
    {
      icon: "headphones",
      title: "Escuta Ativa",
      subtitle: "Reconheça a palavra pela pronúncia",
      kind: "listening",
    },
    {
      icon: "shuffle",
      title: "Jogo de Sinônimos",
      subtitle: "Associe significados com precisão",
      kind: "synonyms",
    },
    {
      icon: "lightbulb",
      title: "Substitua o Genérico",
      subtitle: "Eleve o tom de frases do dia a dia",
      kind: "upgrade",
    },
    {
      icon: "pen",
      title: "Escrita em Contexto",
      subtitle: "Complete a frase escrevendo a palavra",
      kind: "writing",
    },
    {
      icon: "book",
      title: "Use na Sua Frase",
      subtitle: "Prática livre escrevendo sua própria frase",
      kind: "freewrite",
    },
    {
      icon: "scale",
      title: "Radar de Confusão",
      subtitle: "Compare pares próximos lado a lado",
      kind: "radar",
    },
    {
      icon: "flame",
      title: "Desafio 60 Segundos",
      subtitle: "Treino rápido de reflexo lexical",
      kind: "sprint",
    },
    {
      icon: "repeat",
      title: dueReviewsCount > 0 ? `Revisão Inteligente (${dueReviewsCount})` : "Revisão Inteligente",
      subtitle: "Fixe palavras com lacunas contextuais",
      kind: "quiz",
    },
  ];

  const unitNames = [
    "Unidade 1 • Fundamentos",
    "Unidade 2 • Precisão & Nuance",
    "Unidade 3 • Expressão Executiva",
    "Unidade 4 • Fluência & Repertório",
  ];

  const nodes: PathNodeAction[] = [];
  for (let u = 0; u < unlockedUnits; u++) {
    const unitLabel = unitNames[u] ?? `Unidade ${u + 1} • Prática Contínua`;
    baseCycle.forEach((step, idx) => {
      const threshold = (u + 1) * 3 + idx;
      const done =
        step.kind === "track"
          ? studiedCount >= threshold
          : quizCorrectCount >= u * 4 + idx + 1;
      nodes.push({
        ...step,
        id: `u${u}-n${idx}`,
        unitTitle: idx === 0 ? unitLabel : undefined,
        seedOffset: u * 3 + idx,
        completed: done,
      });
    });
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={120}
        onScroll={(e) => {
          const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 140) {
            setExtraUnits((u) => (u < 12 ? u + 1 : u));
          }
        }}
      >
        <Text style={[styles.eyebrow, { color: palette.accent }]}>TRILHA DE APRENDIZADO</Text>
        <Text style={[styles.lead, { color: palette.muted }]}>
          Toque em um ícone para ver a atividade e avançar.
        </Text>

        <View style={styles.pathWrap}>
          {nodes.map((node, index) => {
            const offset = NODE_OFFSETS[index % NODE_OFFSETS.length] ?? 0;
            const isSelected = selectedNode?.id === node.id;
            const isFirstPending = !node.completed && nodes.findIndex((n) => !n.completed) === index;
            return (
              <View key={node.id} style={{ alignItems: "center", gap: 10 }}>
                {node.unitTitle && (
                  <View
                    style={[
                      styles.unitBanner,
                      { backgroundColor: palette.accentSoft, borderColor: palette.accent },
                    ]}
                  >
                    <Text style={[styles.unitTitle, { color: palette.accent }]}>{node.unitTitle}</Text>
                  </View>
                )}

                <View style={{ alignItems: "center", transform: [{ translateX: offset }] }}>
                  {index > 0 && !node.unitTitle && (
                    <View style={[styles.connector, { backgroundColor: palette.border }]} />
                  )}
                  <Animated.View style={isFirstPending ? { transform: [{ scale: pulseAnim }] } : undefined}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={node.title}
                      accessibilityHint={node.subtitle}
                      style={[
                        styles.circleBtn,
                        {
                          backgroundColor: node.completed ? palette.accent : palette.surface,
                          borderColor: isSelected
                            ? palette.gold
                            : isFirstPending
                              ? palette.accent
                              : node.completed
                                ? palette.accent
                                : palette.border,
                        },
                      ]}
                      onPress={() => {
                        Vibration.vibrate(8);
                        setSelectedNode((prev) => (prev?.id === node.id ? null : node));
                      }}
                    >
                      <AppIcon
                        name={node.completed ? "check" : node.icon}
                        size={24}
                        color={node.completed ? palette.accentInk : palette.accent}
                      />
                    </Pressable>
                  </Animated.View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {selectedNode && (
        <View
          style={[
            styles.popoverCard,
            { backgroundColor: palette.surface, borderColor: palette.accent },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={[styles.miniCircle, { backgroundColor: palette.accentSoft }]}>
              <AppIcon name={selectedNode.icon} size={20} color={palette.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.text, fontSize: 15, fontWeight: "700" }}>
                {selectedNode.title}
              </Text>
              <Text style={{ color: palette.muted, fontSize: 12 }}>{selectedNode.subtitle}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar detalhes da atividade"
              onPress={() => setSelectedNode(null)}
            >
              <Text style={{ color: palette.muted, fontSize: 13, fontWeight: "700" }}>✕</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            style={[styles.startBtn, { backgroundColor: palette.accent }]}
            onPress={() => {
              const target = selectedNode;
              setSelectedNode(null);
              onSelectNode(target.kind, target.seedOffset);
            }}
          >
            <Text style={{ color: palette.accentInk, fontWeight: "700", fontSize: 14 }}>
              Começar atividade →
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, gap: 8, paddingBottom: 110 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.2 },
  lead: { fontSize: 13, marginBottom: 6 },
  pathWrap: { gap: 10, paddingVertical: 6 },
  unitBanner: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 8,
  },
  unitTitle: { fontSize: 12, fontWeight: "800", letterSpacing: 0.6 },
  connector: { width: 3, height: 14, marginBottom: 4, borderRadius: 2 },
  circleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  loadMoreBtn: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  popoverCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  miniCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  startBtn: {
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
});
