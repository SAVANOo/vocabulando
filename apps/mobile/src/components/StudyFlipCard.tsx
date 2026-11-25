import React, { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import * as Speech from "expo-speech";
import type { MobileWordEntry } from "../data/mobileLexicon";
import type { VocabPalette } from "../theme/palettes";
import { getThemeVisual } from "../theme/themesConfig";
import { playUiSound } from "../utils/soundEffects";
import { AppIcon } from "./AppIcon";
import { EtymologyNetwork } from "./EtymologyNetwork";

interface Props {
  word: MobileWordEntry;
  palette: VocabPalette;
  soundEnabled: boolean;
  isSaved: boolean;
  onToggleSave: () => void;
  onStudied: (dwellTimeMs: number) => void;
  onFlipTracked?: () => void;
  onAudioTracked?: () => void;
}

export function StudyFlipCard({
  word,
  palette,
  soundEnabled,
  isSaved,
  onToggleSave,
  onStudied,
  onFlipTracked,
  onAudioTracked,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<0.85 | 1.0>(0.9 as 0.85);
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);
  const [flipAnim] = useState(() => new Animated.Value(0));
  const [dragTilt] = useState(() => new Animated.Value(0));
  const [enterX] = useState(() => new Animated.Value(28));
  const [enterOpacity] = useState(() => new Animated.Value(0));
  const [mountedAt] = useState(() => Date.now());

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterOpacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(enterX, {
        toValue: 0,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [enterOpacity, enterX]);

  function toggleFlip() {
    setFlipped((prev) => {
      const next = !prev;
      Vibration.vibrate(8);
      playUiSound("flip", soundEnabled);
      onFlipTracked?.();
      Animated.spring(flipAnim, {
        toValue: next ? 1 : 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }).start();
      return next;
    });
  }

  const [swipeResponder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 16 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
      onPanResponderMove: (_, gesture) => {
        const clamped = Math.max(-120, Math.min(120, gesture.dx));
        dragTilt.setValue(clamped);
      },
      onPanResponderRelease: (_, gesture) => {
        Animated.spring(dragTilt, { toValue: 0, friction: 7, useNativeDriver: true }).start();
        if (Math.abs(gesture.dx) > 36) {
          toggleFlip();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragTilt, { toValue: 0, friction: 7, useNativeDriver: true }).start();
      },
    }),
  );

  async function speakText(text: string) {
    Vibration.vibrate(6);
    onAudioTracked?.();
    setTtsNotice(null);
    try {
      await Speech.stop();
      const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
      const ptVoice = voices.find((v) => v.language.toLowerCase().startsWith("pt"));
      setSpeaking(true);
      Speech.speak(text, {
        language: ptVoice?.language ?? "pt-BR",
        voice: ptVoice?.identifier,
        rate: speechRate,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => {
          setSpeaking(false);
          playUiSound("save", soundEnabled);
          setTtsNotice("Voz PT-BR indisponível neste dispositivo — confira pelo IPA.");
        },
      });
    } catch {
      setSpeaking(false);
      setTtsNotice("Áudio de voz indisponível neste dispositivo.");
    }
  }

  const themeVis = getThemeVisual(word.theme);
  const dragDeg = dragTilt.interpolate({ inputRange: [-120, 0, 120], outputRange: ["-18deg", "0deg", "18deg"] });
  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity = flipAnim.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [0, 0, 1, 1] });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { opacity: enterOpacity, transform: [{ translateX: enterX }] },
      ]}
    >
      <Animated.View
        style={[
          styles.cardStage,
          { transform: [{ perspective: 1000 }, { rotateY: dragDeg }] },
        ]}
        {...swipeResponder.panHandlers}
      >
        {/* FRENTE LIMPA */}
        <Animated.View
          pointerEvents={flipped ? "none" : "auto"}
          style={[
            styles.face,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              borderTopColor: themeVis.tint,
              borderTopWidth: 3.5,
              opacity: frontOpacity,
              transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Palavra ${word.word}. ${word.definition}`}
            accessibilityHint="Toque duas vezes para virar o card e ver exemplo, origem e sinônimos"
            style={styles.faceInner}
            onPress={toggleFlip}
          >
            <View style={styles.topRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <AppIcon name={themeVis.icon} size={14} color={themeVis.tint} />
                <Text style={[styles.badge, { color: themeVis.tint }]}>
                  {word.themeLabel ?? word.categoryLabel}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Compartilhar palavra"
                  hitSlop={10}
                  onPress={(e) => {
                    e.stopPropagation();
                    void Share.share({
                      message: `${word.word} (${word.ipa}): ${word.definition}\nExemplo: "${word.example}" — via Vocabulando`,
                    });
                  }}
                >
                  <AppIcon name="share" size={20} color={palette.muted} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isSaved ? "Remover dos favoritos" : "Favoritar palavra"}
                  hitSlop={12}
                  onPress={(e) => {
                    e.stopPropagation();
                    onToggleSave();
                  }}
                >
                  <AppIcon
                    name="bookmark"
                    size={22}
                    color={isSaved ? palette.gold : palette.muted}
                    filled={isSaved}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.centerContent}>
              <Text style={[styles.wordTitle, { color: palette.text }]}>{word.word}</Text>
              <Text style={[styles.ipa, { color: palette.accent }]}>
                {word.ipa} • {word.pos}
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ouvir pronúncia"
                style={[
                  styles.audioChip,
                  { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  void speakText(word.word);
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <AppIcon name="volume" size={16} color={palette.accent} />
                  <Text style={[styles.audioText, { color: palette.text }]}>
                    {speaking ? "Falando..." : "Ouvir pronúncia"}
                  </Text>
                </View>
              </Pressable>
              {ttsNotice && (
                <Text style={{ color: palette.muted, fontSize: 11, textAlign: "center" }}>
                  {ttsNotice}
                </Text>
              )}

              <Text style={[styles.definition, { color: palette.text }]}>{word.definition}</Text>
            </View>

            <Text style={[styles.footerNote, { color: palette.muted }]}>
              Toque ou deslize no card para virar ↻
            </Text>
          </Pressable>
        </Animated.View>

        {/* VERSO DO CARD */}
        <Animated.View
          pointerEvents={flipped ? "auto" : "none"}
          style={[
            styles.face,
            {
              backgroundColor: palette.surface,
              borderColor: palette.accent,
              opacity: backOpacity,
              transform: [{ perspective: 1000 }, { rotateY: backRotate }],
            },
          ]}
        >
          <View style={styles.faceInner}>
            <Pressable style={styles.topRow} onPress={toggleFlip}>
              <Text style={[styles.badge, { color: palette.accent }]}>CONTEXTO &amp; ORIGEM</Text>
              <Text style={[styles.hintText, { color: palette.muted }]}>Voltar ↻</Text>
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.backScroll}>
              <Pressable onPress={toggleFlip} style={{ gap: 12 }}>
                <View
                  style={[
                    styles.quoteBox,
                    { backgroundColor: palette.surfaceAlt, borderLeftColor: palette.accent },
                  ]}
                >
                  <Text style={[styles.quoteText, { color: palette.text }]}>"{word.example}"</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={(e) => {
                        e.stopPropagation();
                        void speakText(word.example);
                      }}
                      style={[styles.audioChip, { backgroundColor: palette.surface, borderColor: palette.border, paddingVertical: 5, paddingHorizontal: 10 }]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <AppIcon name="volume" size={13} color={palette.accent} />
                        <Text style={{ color: palette.text, fontSize: 11, fontWeight: "700" }}>
                          Ouvir frase
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={(e) => {
                        e.stopPropagation();
                        setSpeechRate((r) => (r === 1.0 ? 0.85 : 1.0));
                      }}
                      style={[styles.audioChip, { backgroundColor: palette.surface, borderColor: palette.border, paddingVertical: 5, paddingHorizontal: 10 }]}
                    >
                      <Text style={{ color: palette.muted, fontSize: 11, fontWeight: "700" }}>
                        {speechRate}x
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {word.paronym && (
                  <View
                    style={[
                      styles.infoBlock,
                      { backgroundColor: palette.accentSoft, borderColor: palette.accent },
                    ]}
                  >
                    <Text style={[styles.infoLabel, { color: palette.accent }]}>
                      NÃO CONFUNDA COM "{word.paronym.other}"
                    </Text>
                    <Text style={[styles.infoText, { color: palette.text }]}>{word.paronym.diff}</Text>
                  </View>
                )}

                <View style={styles.infoSection}>
                  <Text style={[styles.infoLabel, { color: palette.accent }]}>ORIGEM</Text>
                  <Text style={[styles.infoText, { color: palette.muted }]}>{word.etymology}</Text>
                </View>

                <EtymologyNetwork word={word.word} roots={word.roots} palette={palette} />

                <View style={styles.infoSection}>
                  <Text style={[styles.infoLabel, { color: palette.accent }]}>SINÔNIMOS</Text>
                  {word.synonyms.map((s) => (
                    <Text key={s.word} style={[styles.infoText, { color: palette.muted }]}>
                      <Text style={{ color: palette.text, fontWeight: "700" }}>{s.word}</Text> [
                      {s.register}] — {s.note}
                    </Text>
                  ))}
                </View>
              </Pressable>
            </ScrollView>
          </View>
        </Animated.View>
      </Animated.View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Marcar palavra como aprendida e ganhar 5 XP"
        style={[styles.btnPri, { backgroundColor: palette.accent }]}
        onPress={() => onStudied(Math.max(200, Date.now() - mountedAt))}
      >
        <Text style={[styles.btnPriText, { color: palette.accentInk }]}>Aprendi (+5 XP)</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12 },
  cardStage: { height: 390, position: "relative" },
  face: {
    position: "absolute",
    inset: 0,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    backfaceVisibility: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  faceInner: { flex: 1, justifyContent: "space-between" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badge: { fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  hintText: { fontSize: 12 },
  centerContent: { alignItems: "center", gap: 10, paddingHorizontal: 6 },
  wordTitle: { fontSize: 34, fontWeight: "700", textAlign: "center" },
  ipa: { fontSize: 13, fontWeight: "600" },
  audioChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, marginTop: 2 },
  audioText: { fontSize: 12, fontWeight: "600" },
  definition: { fontSize: 16, lineHeight: 24, textAlign: "center", marginTop: 6 },
  footerNote: { fontSize: 11, textAlign: "center" },
  backScroll: { gap: 12, paddingTop: 12 },
  quoteBox: { borderLeftWidth: 3, borderRadius: 10, padding: 12 },
  quoteText: { fontSize: 14, fontStyle: "italic", lineHeight: 20 },
  infoBlock: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 3 },
  infoSection: { gap: 4 },
  infoLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.9 },
  infoText: { fontSize: 13, lineHeight: 19 },
  btnPri: { borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnPriText: { fontSize: 14, fontWeight: "700" },
});
