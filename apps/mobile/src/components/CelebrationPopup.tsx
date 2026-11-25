import React, { useEffect, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import type { VocabPalette } from "../theme/palettes";
import { AppIcon, MascotLikeSvg, type MascotMood } from "./AppIcon";

interface Props {
  visible: boolean;
  xp: number;
  title: string;
  subtitle?: string;
  mood?: MascotMood;
  palette: VocabPalette;
  onDismiss: () => void;
}

const BURST_VECTORS = [
  { x: -72, y: -42 },
  { x: -24, y: -58 },
  { x: 24, y: -58 },
  { x: 72, y: -42 },
  { x: 90, y: 0 },
  { x: -90, y: 0 },
];

export function CelebrationPopup({ visible, xp, title, subtitle, mood, palette, onDismiss }: Props) {
  const effectiveMood: MascotMood = mood ?? (xp >= 20 ? "combo" : "celebrate");
  const [slideY] = useState(() => new Animated.Value(80));
  const [opacity] = useState(() => new Animated.Value(0));
  const [burst] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;
    slideY.setValue(64);
    opacity.setValue(0);
    burst.setValue(0);
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, friction: 6, tension: 85, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(burst, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      onDismiss();
    }, subtitle ? 2400 : 1750);
    return () => clearTimeout(timer);
  }, [visible, subtitle, slideY, opacity, burst, onDismiss]);

  if (!visible) return null;

  const burstOpacity = burst.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 0] });
  const burstScale = burst.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.2] });

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {BURST_VECTORS.map((vec, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[
            styles.particle,
            {
              opacity: burstOpacity,
              transform: [
                { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, vec.x] }) },
                { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, vec.y] }) },
                { scale: burstScale },
              ],
            },
          ]}
        >
          <AppIcon
            name="star"
            size={15}
            color={i % 2 === 0 ? palette.gold : palette.accent}
            filled
          />
        </Animated.View>
      ))}

      <Pressable style={{ width: "100%" }} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.banner,
            {
              backgroundColor: palette.surface,
              borderColor: palette.success,
              opacity,
              transform: [{ translateY: slideY }],
            },
          ]}
        >
          <MascotLikeSvg accent={palette.accent} gold={palette.gold} mood={effectiveMood} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: palette.muted }]}>{subtitle}</Text>
            )}
          </View>
          <View style={[styles.xpPill, { backgroundColor: palette.accentSoft }]}>
            <Text style={[styles.xp, { color: palette.success }]}>+{xp} XP</Text>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 72,
    alignItems: "center",
    zIndex: 40,
  },
  particle: { position: "absolute", top: 10, zIndex: 42 },
  banner: {
    width: "100%",
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
  },
  title: { fontSize: 15, fontWeight: "800" },
  subtitle: { fontSize: 12 },
  xpPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  xp: { fontSize: 13, fontWeight: "800" },
});
