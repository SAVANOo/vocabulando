import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { HabitState } from "@vocabulando/domain";
import type { VocabPalette } from "../theme/palettes";
import { AppIcon } from "./AppIcon";

interface Props {
  visible: boolean;
  palette: VocabPalette;
  habit: HabitState;
  dailyGoalWords: number;
  weeklyXp: number[];
  studiedCount: number;
  onClose: () => void;
}

const WEEK_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function StreakModal({
  visible,
  palette,
  habit,
  dailyGoalWords,
  weeklyXp,
  studiedCount,
  onClose,
}: Props) {
  const pct = Math.min(100, Math.round((habit.todayWordsViewed / Math.max(1, dailyGoalWords)) * 100));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: palette.bg, borderColor: palette.border }]}>
          <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
            <Text style={[styles.headerTitle, { color: palette.text }]}>Sua Ofensiva</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar página de ofensiva"
              style={[styles.closeBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
              onPress={onClose}
            >
              <Text style={{ color: palette.text, fontSize: 12, fontWeight: "700" }}>Fechar</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.gold }]}>
              <View style={[styles.flameCircle, { backgroundColor: palette.accentSoft }]}>
                <AppIcon name="flame" size={40} color={palette.gold} filled />
              </View>
              <Text style={{ color: palette.text, fontSize: 34, fontWeight: "800" }}>
                {habit.currentStreak} {habit.currentStreak === 1 ? "dia" : "dias"}
              </Text>
              <Text style={{ color: palette.muted, fontSize: 13 }}>
                Recorde pessoal: {habit.longestStreak}d • Vocabulário: {studiedCount} palavras
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.label, { color: palette.accent }]}>SEMANA DE ESTUDO</Text>
              <View style={styles.weekRow}>
                {WEEK_INITIALS.map((day, idx) => {
                  const active = (weeklyXp[idx] ?? 0) > 0;
                  return (
                    <View key={`${day}-${idx}`} style={styles.dayCol}>
                      <View
                        style={[
                          styles.dayCircle,
                          {
                            backgroundColor: active ? palette.accentSoft : palette.surfaceAlt,
                            borderColor: active ? palette.accent : palette.border,
                          },
                        ]}
                      >
                        {active ? (
                          <AppIcon name="flame" size={16} color={palette.gold} filled />
                        ) : (
                          <Text style={{ color: palette.muted, fontSize: 11, fontWeight: "600" }}>
                            {day}
                          </Text>
                        )}
                      </View>
                      <Text style={{ color: palette.muted, fontSize: 11 }}>{day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.label, { color: palette.accent }]}>META DE HOJE</Text>
              <Text style={{ color: palette.text, fontSize: 15, fontWeight: "700" }}>
                {habit.todayWordsViewed}/{dailyGoalWords} palavras • {habit.todayQuizzesCompleted}/1 desafio
              </Text>
              <View style={[styles.track, { backgroundColor: palette.surfaceAlt }]}>
                <View style={[styles.fill, { backgroundColor: palette.accent, width: `${pct}%` }]} />
              </View>
              <Text style={{ color: palette.muted, fontSize: 12 }}>
                Complete sua meta diária para manter a chama acesa.
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.label, { color: palette.accent }]}>MARCOS DE OFENSIVA</Text>
              <View style={styles.weekRow}>
                {[
                  { days: 1, label: "1d" },
                  { days: 7, label: "7d" },
                  { days: 30, label: "30d" },
                  { days: 100, label: "100d" },
                ].map((m) => {
                  const unlocked = habit.longestStreak >= m.days || habit.currentStreak >= m.days;
                  return (
                    <View
                      key={m.days}
                      style={[
                        styles.milestoneBadge,
                        {
                          backgroundColor: unlocked ? palette.accentSoft : palette.surfaceAlt,
                          borderColor: unlocked ? palette.gold : palette.border,
                        },
                      ]}
                    >
                      <AppIcon name="star" size={16} color={unlocked ? palette.gold : palette.muted} filled={unlocked} />
                      <Text style={{ color: unlocked ? palette.text : palette.muted, fontSize: 12, fontWeight: "700" }}>
                        {m.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={[styles.shieldBox, { backgroundColor: palette.accentSoft }]}>
                  <AppIcon name="shield" size={22} color={palette.accent} filled />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: palette.text, fontSize: 15, fontWeight: "700" }}>
                    Escudos de Pausa: {habit.freezeShields}
                  </Text>
                  <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 17 }}>
                    Se você perder 1 dia, um escudo entra automaticamente para proteger sua ofensiva sem punições.
                  </Text>
                </View>
              </View>
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
  headerTitle: { fontSize: 18, fontWeight: "700" },
  closeBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  content: { padding: 16, gap: 14, paddingBottom: 30 },
  heroCard: { borderWidth: 1.5, borderRadius: 20, padding: 20, alignItems: "center", gap: 6 },
  flameCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  weekRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 4 },
  dayCol: { alignItems: "center", gap: 5 },
  dayCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  track: { height: 7, borderRadius: 999, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 999 },
  milestoneBadge: { flex: 1, marginHorizontal: 3, borderWidth: 1.5, borderRadius: 12, paddingVertical: 8, alignItems: "center", gap: 3 },
  shieldBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
