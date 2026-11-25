import React, { useEffect, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import type { VocabPalette } from "../theme/palettes";

interface RootNode {
  part: string;
  meaning: string;
  related: string[];
}

interface Props {
  word: string;
  roots: RootNode[];
  palette: VocabPalette;
}

export function EtymologyNetwork({ word, roots, palette }: Props) {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [expandAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    expandAnim.setValue(0);
    Animated.timing(expandAnim, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [word, expandAnim]);

  if (roots.length === 0) return null;

  return (
    <View style={[styles.box, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}>
      <Text style={[styles.eyebrow, { color: palette.accent }]}>REDE ETIMOLÓGICA</Text>
      <View style={[styles.centerNode, { backgroundColor: palette.accentSoft, borderColor: palette.accent }]}>
        <Text style={{ color: palette.accent, fontWeight: "800", fontSize: 13 }}>{word}</Text>
      </View>

      <Animated.View
        style={[
          styles.branches,
          {
            opacity: expandAnim,
            transform: [
              {
                translateY: expandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        {roots.map((r) => {
          const active = selectedPart === r.part;
          return (
            <Pressable
              key={r.part}
              accessibilityRole="button"
              onPress={(e) => {
                e.stopPropagation();
                setSelectedPart((prev) => (prev === r.part ? null : r.part));
              }}
              style={[
                styles.branchCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: active ? palette.accent : palette.border,
                },
              ]}
            >
              <Text style={{ color: palette.text, fontWeight: "700", fontSize: 12 }}>
                {r.part} <Text style={{ color: palette.muted, fontWeight: "400" }}>({r.meaning})</Text>
              </Text>
              <View style={styles.relatedRow}>
                {r.related.map((rel) => (
                  <View
                    key={rel}
                    style={[
                      styles.relChip,
                      { backgroundColor: active ? palette.accentSoft : palette.surfaceAlt },
                    ]}
                  >
                    <Text style={{ color: active ? palette.accent : palette.muted, fontSize: 11, fontWeight: active ? "700" : "400" }}>
                      {rel}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  eyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  centerNode: {
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  branches: { gap: 8 },
  branchCard: { borderWidth: 1, borderRadius: 10, padding: 8, gap: 6 },
  relatedRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  relChip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
});
