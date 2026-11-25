import React from "react";
import { StyleSheet, Text, View } from "react-native";
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
  if (roots.length === 0) return null;

  return (
    <View style={[styles.box, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}>
      <Text style={[styles.eyebrow, { color: palette.accent }]}>REDE ETIMOLÓGICA</Text>
      <View style={[styles.centerNode, { backgroundColor: palette.accentSoft, borderColor: palette.accent }]}>
        <Text style={{ color: palette.accent, fontWeight: "800", fontSize: 13 }}>{word}</Text>
      </View>

      <View style={styles.branches}>
        {roots.map((r) => (
          <View key={r.part} style={[styles.branchCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={{ color: palette.text, fontWeight: "700", fontSize: 12 }}>
              {r.part} <Text style={{ color: palette.muted, fontWeight: "400" }}>({r.meaning})</Text>
            </Text>
            <View style={styles.relatedRow}>
              {r.related.map((rel) => (
                <View key={rel} style={[styles.relChip, { backgroundColor: palette.surfaceAlt }]}>
                  <Text style={{ color: palette.muted, fontSize: 11 }}>{rel}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
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
