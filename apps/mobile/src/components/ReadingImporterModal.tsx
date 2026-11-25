import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MOBILE_LEXICON, type MobileWordEntry } from "../data/mobileLexicon";
import { queryLocalLexicon } from "../storage/localDb";
import type { VocabPalette } from "../theme/palettes";

interface Props {
  visible: boolean;
  palette: VocabPalette;
  savedIds: string[];
  onSaveWord: (wordId: string) => void;
  onClose: () => void;
}

export function ReadingImporterModal({
  visible,
  palette,
  savedIds,
  onSaveWord,
  onClose,
}: Props) {
  const [excerpt, setExcerpt] = useState("");
  const [matches, setMatches] = useState<MobileWordEntry[]>([]);
  const [scanned, setScanned] = useState(false);

  function analyzeExcerpt() {
    const tokens = Array.from(
      new Set(
        excerpt
          .toLowerCase()
          .split(/[^a-záàâãéêíóôõúç]+/i)
          .filter((t) => t.length >= 4),
      ),
    ).slice(0, 25);

    const foundMap = new Map<string, MobileWordEntry>();
    for (const tok of tokens) {
      const dbHits = queryLocalLexicon({ query: tok, limit: 2 });
      for (const hit of dbHits) {
        if (hit.word.toLowerCase() === tok) {
          foundMap.set(hit.id, hit);
        }
      }
      const fallback = MOBILE_LEXICON.find((w) => w.word.toLowerCase() === tok);
      if (fallback) foundMap.set(fallback.id, fallback);
    }
    setMatches(Array.from(foundMap.values()));
    setScanned(true);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: palette.bg, borderColor: palette.border }]}>
          <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
            <Text style={[styles.title, { color: palette.text }]}>Importar Trecho de Leitura</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
            >
              <Text style={{ color: palette.text, fontSize: 12, fontWeight: "700" }}>Fechar</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={{ color: palette.muted, fontSize: 13 }}>
              Cole um parágrafo de livro, artigo ou e-mail. Identificamos palavras do nosso acervo para você salvar e revisar.
            </Text>

            <TextInput
              accessibilityLabel="Cole seu texto aqui"
              placeholder="Cole aqui um trecho de leitura..."
              placeholderTextColor={palette.muted}
              multiline
              numberOfLines={4}
              value={excerpt}
              onChangeText={setExcerpt}
              style={[
                styles.input,
                { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text },
              ]}
            />

            <Pressable
              accessibilityRole="button"
              style={[styles.btn, { backgroundColor: palette.accent }]}
              onPress={analyzeExcerpt}
            >
              <Text style={{ color: palette.accentInk, fontWeight: "700" }}>Analisar palavras do trecho</Text>
            </Pressable>

            {scanned && matches.length === 0 && (
              <Text style={{ color: palette.muted, fontSize: 13 }}>
                Nenhuma palavra do catálogo identificada exatamente neste trecho. Tente outro parágrafo!
              </Text>
            )}

            {matches.map((item) => {
              const saved = savedIds.includes(item.id);
              return (
                <View
                  key={item.id}
                  style={[styles.matchCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: palette.text, fontSize: 16, fontWeight: "700" }}>
                      {item.word}
                    </Text>
                    <Text style={{ color: palette.muted, fontSize: 12 }}>{item.definition}</Text>
                  </View>
                  <Pressable
                    style={[
                      styles.saveChip,
                      {
                        backgroundColor: saved ? palette.accentSoft : palette.surfaceAlt,
                        borderColor: saved ? palette.accent : palette.border,
                      },
                    ]}
                    onPress={() => onSaveWord(item.id)}
                  >
                    <Text style={{ color: saved ? palette.accent : palette.text, fontSize: 12, fontWeight: "700" }}>
                      {saved ? "Salva ✓" : "+ Salvar"}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
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
  content: { padding: 16, gap: 12, paddingBottom: 30 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  btn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  matchCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  saveChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
});
