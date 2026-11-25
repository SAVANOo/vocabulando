import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import type { VocabPalette } from "../theme/palettes";
import { playUiSound } from "../utils/soundEffects";

interface Props {
  visible: boolean;
  palette: VocabPalette;
  soundEnabled: boolean;
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  {
    badge: "PASSO 1 DE 4 • META LEVE",
    title: "Sua meta diária no seu ritmo",
    body: "Nada de lições exaustivas. Estude 2, 3 ou 5 palavras por dia ou complete 1 desafio rápido. Se precisar faltar, seu Escudo de Pausa protege sua sequência.",
    highlight: "Dica: toque no ícone '?' ao lado da meta ou ofensiva para ver detalhes rápidos.",
  },
  {
    badge: "PASSO 2 DE 4 • CARD INTERATIVO",
    title: "Toque ou deslize para virar",
    body: "Toque no card ou deslize para a esquerda/direita para virar em 3D e ver exemplo real, origem e sinônimos. Toque novamente para desvirar.",
    highlight: "Use a bandeirinha no canto do card para favoritar ou 'Aprendi (+5 XP)' para avançar.",
  },
  {
    badge: "PASSO 3 DE 4 • TRILHA CONTÍNUA",
    title: "Atividades variadas no seu ritmo",
    body: "Na aba Trilha, avance por unidades com exercícios de Leitura, Escuta, Escrita, Sinônimos, Parônimos e Revisão Inteligente.",
    highlight: "Erros viram revisão suave e cada acerto libera uma celebração + XP!",
  },
  {
    badge: "PASSO 4 DE 4 • PERFIL NO TOPO",
    title: "Seu avatar no canto superior",
    body: "Toque na bolinha do seu Perfil no canto superior direito para ajustar trilhas, nível de dificuldade, Modo Dia/Noite, sons e rever este tutorial.",
    highlight: "Suas escolhas filtram o conteúdo do Início e o Widget na hora!",
  },
];

export function TutorialOverlay({ visible, palette, soundEnabled, onClose }: Props) {
  const [step, setStep] = useState(0);
  const current = TUTORIAL_STEPS[step]!;

  function next() {
    Vibration.vibrate(8);
    if (step < TUTORIAL_STEPS.length - 1) {
      playUiSound("flip", soundEnabled);
      setStep((s) => s + 1);
    } else {
      playUiSound("success", soundEnabled);
      setStep(0);
      onClose();
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setStep(0);
        onClose();
      }}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.accent },
          ]}
        >
          <View style={styles.topRow}>
            <Text style={[styles.badge, { color: palette.accent }]}>{current.badge}</Text>
            <Pressable
              onPress={() => {
                setStep(0);
                onClose();
              }}
            >
              <Text style={{ color: palette.muted, fontSize: 13 }}>Fechar</Text>
            </Pressable>
          </View>

          <Text style={[styles.title, { color: palette.text }]}>{current.title}</Text>
          <Text style={[styles.body, { color: palette.muted }]}>{current.body}</Text>

          <View
            style={[
              styles.tipBox,
              { backgroundColor: palette.accentSoft, borderColor: palette.accent },
            ]}
          >
            <Text style={[styles.tipText, { color: palette.text }]}>{current.highlight}</Text>
          </View>

          <View style={styles.dots}>
            {TUTORIAL_STEPS.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  { backgroundColor: idx === step ? palette.accent : palette.border },
                ]}
              />
            ))}
          </View>

          <Pressable
            style={[styles.btn, { backgroundColor: palette.accent }]}
            onPress={next}
          >
            <Text style={[styles.btnText, { color: palette.accentInk }]}>
              {step < TUTORIAL_STEPS.length - 1 ? "Próximo passo →" : "Entendi, vamos lá!"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 2,
    borderRadius: 22,
    padding: 22,
    gap: 12,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badge: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  title: { fontSize: 21, fontWeight: "700", lineHeight: 27 },
  body: { fontSize: 14, lineHeight: 21 },
  tipBox: { borderWidth: 1, borderRadius: 12, padding: 12 },
  tipText: { fontSize: 13, lineHeight: 18, fontWeight: "600" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 999 },
  btn: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  btnText: { fontSize: 14, fontWeight: "700" },
});
