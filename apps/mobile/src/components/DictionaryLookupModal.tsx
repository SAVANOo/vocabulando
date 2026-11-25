import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MOBILE_LEXICON } from "../data/mobileLexicon";
import { queryLocalLexicon } from "../storage/localDb";
import type { VocabPalette } from "../theme/palettes";

function normalizeTerm(t: string): string {
  return t.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

interface LookupResult {
  word: string;
  found: boolean;
  phoneticIpa: string;
  definitions: string[];
  synonyms: string[];
  etymology: string;
  source: string;
}

interface Props {
  visible: boolean;
  palette: VocabPalette;
  apiBaseUrl: string;
  onClose: () => void;
}

export function DictionaryLookupModal({ visible, palette, apiBaseUrl, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  async function search() {
    const clean = query.trim();
    if (clean.length < 2) return;
    setLoading(true);
    setError(null);

    const norm = normalizeTerm(clean);
    const dbHits = queryLocalLexicon({ query: clean, limit: 5 });
    const localHit =
      dbHits.find((w) => normalizeTerm(w.word) === norm) ??
      dbHits[0] ??
      MOBILE_LEXICON.find((w) => normalizeTerm(w.word) === norm || normalizeTerm(w.id) === norm);
    if (localHit) {
      setResult({
        word: localHit.word,
        found: true,
        phoneticIpa: localHit.ipa,
        definitions: [localHit.definition],
        synonyms: localHit.synonyms.map((s) => s.word),
        etymology: localHit.etymology,
        source: "Acervo Vocabulando",
      });
      setLoading(false);
      return;
    }

    try {
      const authRes = await fetch(`${apiBaseUrl}/api/auth/guest`, { method: "POST" });
      if (!authRes.ok) throw new Error("Serviço indisponível");
      const { token } = (await authRes.json()) as { token: string };
      const res = await fetch(
        `${apiBaseUrl}/api/dictionary/lookup?word=${encodeURIComponent(clean)}&lang=pt-BR`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Falha ao consultar dicionário");
      setResult((await res.json()) as LookupResult);
    } catch {
      setError("Termo não encontrado no acervo local e sem conexão para consulta externa no momento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.top}>
            <Text style={[styles.title, { color: palette.text }]}>Consultar Dicionário Público</Text>
            <Pressable onPress={onClose}>
              <Text style={{ color: palette.muted, fontSize: 14 }}>Fechar</Text>
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Digite uma palavra..."
              placeholderTextColor={palette.muted}
              style={[
                styles.input,
                { backgroundColor: palette.bg, borderColor: palette.border, color: palette.text },
              ]}
            />
            <Pressable
              style={[styles.btn, { backgroundColor: palette.accent }]}
              onPress={() => void search()}
            >
              <Text style={{ color: palette.accentInk, fontWeight: "700" }}>
                {loading ? "..." : "Buscar"}
              </Text>
            </Pressable>
          </View>

          {error && <Text style={{ color: palette.danger, fontSize: 13 }}>{error}</Text>}

          {result && (
            <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={{ gap: 8 }}>
              <Text style={{ color: palette.text, fontSize: 20, fontWeight: "700" }}>
                {result.word}{" "}
                <Text style={{ color: palette.accent, fontSize: 13 }}>{result.phoneticIpa}</Text>
              </Text>
              <Text style={{ color: palette.muted, fontSize: 12 }}>Fonte: {result.source}</Text>
              {result.found ? (
                <>
                  {result.definitions.map((d, i) => (
                    <Text key={i} style={{ color: palette.text, fontSize: 14, lineHeight: 20 }}>
                      • {d}
                    </Text>
                  ))}
                  {result.etymology ? (
                    <Text style={{ color: palette.muted, fontSize: 13 }}>
                      Origem: {result.etymology}
                    </Text>
                  ) : null}
                  {result.synonyms.length > 0 ? (
                    <Text style={{ color: palette.accent, fontSize: 13 }}>
                      Sinônimos: {result.synonyms.join(", ")}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text style={{ color: palette.muted, fontSize: 14 }}>
                  Palavra não encontrada nas fontes públicas.
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 20,
    gap: 14,
  },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 17, fontWeight: "700" },
  searchRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  btn: { borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" },
});
