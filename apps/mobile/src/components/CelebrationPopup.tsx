import React, { useEffect, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import type { VocabPalette } from "../theme/palettes";
import { AppIcon, MascotLikeSvg } from "./AppIcon";

interface Props {
  visible: boolean;
  xp: number;
  title: string;
  subtitle?: string;
  palette: VocabPalette;
  onDismiss: () => void;
}

const BURST_VECTORS = [
  { x: -64, y: -56 },
  { x: 0, y: -76 },
  { x: 64, y: -56 },
  { x: 78, y: 0 },
  { x: 58, y: 58 },
  { x: 0, y: 74 },
  { x: -58, y: 58 },
  { x: -78, y: 0 },
];

export function CelebrationPopup({ visible, xp, title, subtitle, palette, onDismiss }: Props) {
  const [scale] = useState(() => new Animated.Value(0.6));
  const [opacity] = useState(() => new Animated.Value(0));
  const [burst] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.55);
    opacity.setValue(0);
    burst.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 95, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(burst, {
        toValue: 1,
        duration: 750,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      onDismiss();
    }, 1700);
    return () => clearTimeout(timer);
  }, [visible, scale, opacity, burst, onDismiss]);

  if (!visible) return null;

  const burstOpacity = burst.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 0] });
  const burstScale = burst.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.25] });

  return (
    <Pressable style={styles.overlay} onPress={onDismiss}>
      <View style={styles.stage}>
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
              size={18}
              color={i % 2 === 0 ? palette.gold : palette.accent}
              filled
            />
          </Animated.View>
        ))}

        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.success,
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <MascotLikeSvg accent={palette.accent} gold={palette.gold} />
          <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: palette.muted }]}>{subtitle}</Text>
          )}
          <Text style={[styles.xp, { color: palette.success }]}>+{xp} XP</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    zIndex: 40,
  },
  stage: { alignItems: "center", justifyContent: "center" },
  particle: { position: "absolute", zIndex: 42 },
  card: {
    borderWidth: 2,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 20,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 10,
  },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 12, textAlign: "center", maxWidth: 230 },
  xp: { fontSize: 15, fontWeight: "800" },
});
