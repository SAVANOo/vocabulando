import React, { useEffect, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
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
  unitIndex: number;
  icon: AppIconName;
  title: string;
  subtitle: string;
  kind: PathExerciseKind;
  seedOffset: number;
  completed: boolean;
}

interface Props {
  palette: VocabPalette;
  completedNodeIds: string[];
  dueReviewsCount: number;
  onSelectNode: (node: PathNodeAction) => void;
}

const NODE_OFFSETS = [0, 44, 62, 22, -38, -58];

const UNIT_PALETTES = [
  { title: "Unidade 1 • Fundamentos", bg: "#1B3B2E", border: "#67B897", accent: "#67B897" },
  { title: "Unidade 2 • Precisão & Nuance", bg: "#1A2E47", border: "#4B9CD3", accent: "#4B9CD3" },
  { title: "Unidade 3 • Expressão Executiva", bg: "#3B241E", border: "#C87D55", accent: "#C87D55" },
  { title: "Unidade 4 • Fluência & Repertório", bg: "#2B2142", border: "#8E7CC3", accent: "#8E7CC3" },
  { title: "Unidade 5 • Domínio Contínuo", bg: "#382D16", border: "#D9A441", accent: "#D9A441" },
];

function UnitBannerArtwork({ accent, variant }: { accent: string; variant: number }) {
  return (
    <Svg width={120} height={64} viewBox="0 0 120 64" fill="none" style={styles.bannerArt}>
      {variant % 2 === 0 ? (
        <>
          <Path d="M10 60Q45 18 82 50T120 34V64H10Z" fill={accent} fillOpacity={0.18} />
          <Circle cx={92} cy={20} r={10} fill={accent} fillOpacity={0.22} />
          <Circle cx={64} cy={14} r={3} fill={accent} fillOpacity={0.4} />
        </>
      ) : (
        <>
          <Path d="M0 54C30 28 60 62 120 26V64H0Z" fill={accent} fillOpacity={0.18} />
          <Path d="M74 16L78 24L86 25L80 31L81 39L74 35L67 39L68 31L62 25L70 24L74 16Z" fill={accent} fillOpacity={0.24} />
        </>
      )}
    </Svg>
  );
}

export function LearningPath({
  palette,
  completedNodeIds,
  dueReviewsCount,
  onSelectNode,
}: Props) {
  const [extraUnits, setExtraUnits] = useState(0);
  const [selectedNode, setSelectedNode] = useState<PathNodeAction | null>(null);
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const completedSet = new Set(completedNodeIds);

  const baseCycle: Array<{
    icon: AppIconName;
    title: string;
    subtitle: string;
    kind: PathExerciseKind;
  }> = [
    { icon: "book", title: "Leitura & Descoberta", subtitle: "Explore novas palavras nos cards", kind: "track" },
    { icon: "headphones", title: "Escuta Ativa", subtitle: "Reconheça a palavra pela pronúncia", kind: "listening" },
    { icon: "shuffle", title: "Jogo de Sinônimos", subtitle: "Associe significados com precisão", kind: "synonyms" },
    { icon: "lightbulb", title: "Substitua o Genérico", subtitle: "Eleve o tom de frases do dia a dia", kind: "upgrade" },
    { icon: "pen", title: "Escrita em Contexto", subtitle: "Complete a frase escrevendo a palavra", kind: "writing" },
    { icon: "scale", title: "Radar de Confusão", subtitle: "Compare pares próximos lado a lado", kind: "radar" },
  ];

  // Só libera próxima unidade conforme unidades anteriores vão sendo concluídas (ou ao rolar)
  const completedUnitsCount = Math.floor(completedNodeIds.length / baseCycle.length);
  const totalUnits = 2 + completedUnitsCount + extraUnits;

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

  const units: Array<{
    unitIndex: number;
    theme: (typeof UNIT_PALETTES)[number];
    nodes: PathNodeAction[];
  }> = [];

  for (let u = 0; u < totalUnits; u++) {
    const theme = UNIT_PALETTES[u % UNIT_PALETTES.length]!;
    const unitLabel =
      u < UNIT_PALETTES.length ? theme.title : `Unidade ${u + 1} • Prática Contínua`;
    const unitNodes: PathNodeAction[] = baseCycle.map((step, idx) => {
      const nodeId = `u${u}-n${idx}`;
      const isQuizSlot = u > 0 && idx === 5 && dueReviewsCount > 0;
      return {
        ...step,
        id: nodeId,
        unitIndex: u,
        kind: isQuizSlot ? "quiz" : step.kind,
        title: isQuizSlot ? `Revisão (${dueReviewsCount})` : step.title,
        seedOffset: u * 7 + idx * 3,
        completed: completedSet.has(nodeId),
      };
    });
    units.push({
      unitIndex: u,
      theme: { ...theme, title: unitLabel },
      nodes: unitNodes,
    });
  }

  const firstPendingId = units
    .flatMap((u) => u.nodes)
    .find((n) => !n.completed)?.id;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={120}
        onScroll={(e) => {
          const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 140) {
            setExtraUnits((u) => (u < 10 ? u + 1 : u));
          }
        }}
      >
        <Text style={[styles.eyebrow, { color: palette.accent }]}>TRILHA DE APRENDIZADO</Text>
        <Text style={[styles.lead, { color: palette.muted }]}>
          Conclua cada lição passo a passo para avançar pelas unidades.
        </Text>

        {units.map((unit) => {
          const rowHeight = 96;
          const svgWidth = 260;
          const centerX = svgWidth / 2;
          const svgHeight = unit.nodes.length * rowHeight;

          return (
            <View key={unit.unitIndex} style={{ gap: 12, marginTop: 6 }}>
              <View
                style={[
                  styles.unitBanner,
                  { backgroundColor: unit.theme.bg, borderColor: unit.theme.border },
                ]}
              >
                <UnitBannerArtwork accent={unit.theme.accent} variant={unit.unitIndex} />
                <Text style={[styles.unitTitle, { color: "#EFEDE8" }]}>{unit.theme.title}</Text>
                <Text style={{ color: unit.theme.accent, fontSize: 11, fontWeight: "700" }}>
                  {unit.nodes.filter((n) => n.completed).length}/{unit.nodes.length} lições
                </Text>
              </View>

              <View style={{ alignSelf: "center", width: svgWidth, height: svgHeight, position: "relative" }}>
                {/* Fio contínuo interligando os nós em curva Bezier */}
                <Svg width={svgWidth} height={svgHeight} style={StyleSheet.absoluteFill}>
                  {unit.nodes.map((_, i) => {
                    if (i === unit.nodes.length - 1) return null;
                    const x1 = centerX + (NODE_OFFSETS[i % NODE_OFFSETS.length] ?? 0);
                    const y1 = i * rowHeight + 34;
                    const x2 = centerX + (NODE_OFFSETS[(i + 1) % NODE_OFFSETS.length] ?? 0);
                    const y2 = (i + 1) * rowHeight + 34;
                    const midY = (y1 + y2) / 2;
                    return (
                      <Path
                        key={`edge-${i}`}
                        d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                        stroke={unit.nodes[i]!.completed ? unit.theme.accent : palette.border}
                        strokeWidth={4}
                        strokeDasharray={unit.nodes[i]!.completed ? undefined : "6,6"}
                        fill="none"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </Svg>

                {unit.nodes.map((node, index) => {
                  const x = centerX + (NODE_OFFSETS[index % NODE_OFFSETS.length] ?? 0) - 32;
                  const y = index * rowHeight + 2;
                  const isSelected = selectedNode?.id === node.id;
                  const isFirstPending = node.id === firstPendingId;
                  const isUnlocked = node.completed || isFirstPending;

                  return (
                    <Animated.View
                      key={node.id}
                      style={[
                        { position: "absolute", left: x, top: y, opacity: isUnlocked ? 1 : 0.48 },
                        isFirstPending ? { transform: [{ scale: pulseAnim }] } : undefined,
                      ]}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={node.title}
                        accessibilityHint={node.subtitle}
                        style={[
                          styles.circleBtn,
                          {
                            backgroundColor: node.completed ? unit.theme.accent : palette.surface,
                            borderColor: isSelected
                              ? palette.gold
                              : isFirstPending
                                ? unit.theme.accent
                                : node.completed
                                  ? unit.theme.accent
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
                          color={
                            node.completed
                              ? "#0F1216"
                              : isUnlocked
                                ? unit.theme.accent
                                : palette.muted
                          }
                        />
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {selectedNode && (() => {
        const selectedUnlocked = selectedNode.completed || selectedNode.id === firstPendingId;
        return (
          <View
            style={[
              styles.popoverCard,
              {
                backgroundColor: palette.surface,
                borderColor: selectedUnlocked ? palette.accent : palette.border,
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={[styles.miniCircle, { backgroundColor: palette.accentSoft }]}>
                <AppIcon
                  name={selectedNode.icon}
                  size={20}
                  color={selectedUnlocked ? palette.accent : palette.muted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: palette.text, fontSize: 15, fontWeight: "700" }}>
                  {selectedNode.title}
                </Text>
                <Text style={{ color: palette.muted, fontSize: 12 }}>
                  {selectedUnlocked
                    ? `${selectedNode.subtitle} • 4 etapas`
                    : "Conclua a lição anterior para desbloquear"}
                </Text>
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
              disabled={!selectedUnlocked}
              style={[
                styles.startBtn,
                {
                  backgroundColor: selectedUnlocked ? palette.accent : palette.surfaceAlt,
                  opacity: selectedUnlocked ? 1 : 0.7,
                },
              ]}
              onPress={() => {
                if (!selectedUnlocked) return;
                const target = selectedNode;
                setSelectedNode(null);
                onSelectNode(target);
              }}
            >
              <Text
                style={{
                  color: selectedUnlocked ? palette.accentInk : palette.muted,
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                {selectedUnlocked
                  ? selectedNode.completed
                    ? "Praticar novamente →"
                    : "Começar lição →"
                  : "Lição bloqueada"}
              </Text>
            </Pressable>
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, gap: 8, paddingBottom: 110 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.2 },
  lead: { fontSize: 13, marginBottom: 6 },
  unitBanner: {
    width: "100%",
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: "hidden",
    gap: 2,
  },
  bannerArt: { position: "absolute", right: 0, bottom: 0 },
  unitTitle: { fontSize: 14, fontWeight: "800", letterSpacing: 0.3 },
  circleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
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
    shadowOpacity: 0.24,
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
