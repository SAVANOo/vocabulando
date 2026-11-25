import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { VocabPalette } from "../theme/palettes";
import { getThemeVisual } from "../theme/themesConfig";
import { AppIcon } from "./AppIcon";

interface Props {
  visible: boolean;
  palette: VocabPalette;
  studiedCount: number;
  savedCount: number;
  quizCorrectCount: number;
  onClose: () => void;
}

const SHELF_THEMES = [
  { id: "cinema-arte", title: "Estante Cinema & Arte", req: 2 },
  { id: "escola-estudo", title: "Estante Escola & Ciência", req: 4 },
  { id: "ferias-praia", title: "Estante Férias & Praia", req: 6 },
  { id: "trabalho-negocios", title: "Estante Executiva", req: 8 },
  { id: "tecnologia-digital", title: "Estante Tecnologia", req: 10 },
  { id: "saude-bem-estar", title: "Estante Saúde & Mente", req: 12 },
  { id: "gastronomia-casa", title: "Estante Gastronomia", req: 15 },
];

export function ExLibrisShelfModal({
  visible,
  palette,
  studiedCount,
  savedCount,
  quizCorrectCount,
  onClose,
}: Props) {
  const masteryScore = studiedCount + quizCorrectCount;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: palette.bg, borderColor: palette.border }]}>
          <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
            <Text style={[styles.title, { color: palette.text }]}>Biblioteca &amp; Selos Ex-Libris</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
            >
              <Text style={{ color: palette.text, fontSize: 12, fontWeight: "700" }}>Fechar</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={{ color: palette.muted, fontSize: 13, lineHeight: 19 }}>
              Cada conjunto de palavras e acertos desbloqueia um selo tipográfico na sua biblioteca pessoal ({studiedCount} estudadas • {savedCount} favoritas).
            </Text>

            <View style={styles.grid}>
              {SHELF_THEMES.map((item) => {
                const vis = getThemeVisual(item.id);
                const unlocked = masteryScore >= item.req;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.stampCard,
                      {
                        backgroundColor: unlocked ? palette.surface : palette.surfaceAlt,
                        borderColor: unlocked ? vis.tint : palette.border,
                        opacity: unlocked ? 1 : 0.65,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.stampSeal,
                        {
                          borderColor: unlocked ? vis.tint : palette.muted,
                          backgroundColor: unlocked ? palette.accentSoft : "transparent",
                        },
                      ]}
                    >
                      <AppIcon name={vis.icon} size={22} color={unlocked ? vis.tint : palette.muted} />
                    </View>
                    <Text style={{ color: palette.text, fontSize: 13, fontWeight: "700", textAlign: "center" }}>
                      {item.title}
                    </Text>
                    <Text style={{ color: unlocked ? vis.tint : palette.muted, fontSize: 11, fontWeight: "600" }}>
                      {unlocked ? "Selo conquistado ✓" : `Meta: ${item.req} marcos`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { height: "86%", borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTopWidth: 1, overflow: "hidden" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontWeight: "700" },
  closeBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  content: { padding: 16, gap: 14, paddingBottom: 30 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stampCard: {
    width: "48%",
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  stampSeal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
});
