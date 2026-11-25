import React, { useEffect, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Line, Path, Polygon, Rect } from "react-native-svg";
import type { VocabPalette } from "../theme/palettes";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  palette: VocabPalette;
  onDone: () => void;
}

/**
 * Abertura oficial I4:
 * Capa sálvia -> 4 páginas pautadas abrem em leque -> marcador lateral dourado ->
 * traço caligráfico do "V" -> pulso de brilho no ponto dourado -> "Vocabulando".
 */
export function SplashBookIntro({ palette, onDone }: Props) {
  const [coverScale] = useState(() => new Animated.Value(0.84));
  const [coverOpacity] = useState(() => new Animated.Value(0));
  const [pagesOpacity] = useState(() => new Animated.Value(0));
  const [ribbonOpacity] = useState(() => new Animated.Value(0));
  const [v1Offset] = useState(() => new Animated.Value(95));
  const [v2Offset] = useState(() => new Animated.Value(95));
  const [dotScale] = useState(() => new Animated.Value(0));
  const [sparkScale] = useState(() => new Animated.Value(0.5));
  const [sparkOpacity] = useState(() => new Animated.Value(0));
  const [wordOpacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.parallel([
        Animated.timing(coverOpacity, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(coverScale, {
          toValue: 1,
          friction: 7,
          tension: 65,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(pagesOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ribbonOpacity, {
          toValue: 1,
          duration: 350,
          delay: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(v1Offset, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(v2Offset, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.parallel([
        Animated.spring(dotScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(sparkOpacity, { toValue: 0.75, duration: 220, useNativeDriver: true }),
            Animated.timing(sparkScale, { toValue: 1.45, duration: 480, useNativeDriver: true }),
          ]),
          Animated.timing(sparkOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
        ]),
        Animated.timing(wordOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(450),
    ]);

    anim.start(({ finished }) => {
      if (finished) onDone();
    });

    return () => anim.stop();
  }, [
    coverOpacity,
    coverScale,
    dotScale,
    onDone,
    pagesOpacity,
    ribbonOpacity,
    sparkOpacity,
    sparkScale,
    v1Offset,
    v2Offset,
    wordOpacity,
  ]);

  return (
    <Pressable style={[styles.container, { backgroundColor: palette.bg }]} onPress={onDone}>
      <Animated.View
        style={{
          opacity: coverOpacity,
          transform: [{ scale: coverScale }],
          alignItems: "center",
        }}
      >
        <Svg width={210} height={150} viewBox="0 0 190 132" fill="none">
          <Rect x={24} y={24} width={142} height={88} rx={9} fill={palette.accent} />

          <AnimatedG opacity={pagesOpacity}>
            <Path
              d="M95 106 L31 98 L31 30 L95 38 Z"
              fill={palette.surfaceAlt}
              stroke={palette.border}
            />
            <Path
              d="M95 106 L159 98 L159 30 L95 38 Z"
              fill={palette.surfaceAlt}
              stroke={palette.border}
            />
            <Path
              d="M95 106 L38 92 L38 24 L95 36 Z"
              fill={palette.surface}
              stroke={palette.border}
            />
            <Path
              d="M95 106 L152 92 L152 24 L95 36 Z"
              fill={palette.surface}
              stroke={palette.border}
            />
            <Line x1={48} y1={43} x2={82} y2={48} stroke={palette.border} strokeWidth={2.5} strokeLinecap="round" />
            <Line x1={48} y1={56} x2={78} y2={60} stroke={palette.border} strokeWidth={2.5} strokeLinecap="round" />
            <Line x1={108} y1={48} x2={142} y2={43} stroke={palette.border} strokeWidth={2.5} strokeLinecap="round" />
            <Line x1={112} y1={60} x2={142} y2={56} stroke={palette.border} strokeWidth={2.5} strokeLinecap="round" />
          </AnimatedG>

          <AnimatedG opacity={ribbonOpacity}>
            <Polygon points="134,104 146,104 146,125 140,118 134,125" fill={palette.gold} />
          </AnimatedG>

          <AnimatedPath
            d="M67 35 L95 89"
            stroke={palette.accent}
            strokeWidth={8.5}
            strokeLinecap="round"
            strokeDasharray={[95, 95]}
            strokeDashoffset={v1Offset}
          />
          <AnimatedPath
            d="M95 89 L124 39"
            stroke={palette.accent}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={[95, 95]}
            strokeDashoffset={v2Offset}
          />

          <AnimatedCircle
            cx={124}
            cy={27}
            r={10}
            stroke={palette.gold}
            strokeWidth={2}
            opacity={sparkOpacity}
            scale={sparkScale}
            originX={124}
            originY={27}
          />
          <AnimatedCircle
            cx={124}
            cy={27}
            r={4.5}
            fill={palette.gold}
            scale={dotScale}
            originX={124}
            originY={27}
          />
        </Svg>

        <Animated.Text style={[styles.brand, { color: palette.accent, opacity: wordOpacity }]}>
          Vocabulando
        </Animated.Text>
        <View style={{ height: 12 }} />
        <Text style={[styles.tapHint, { color: palette.muted }]}>Toque para pular</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 8,
  },
  tapHint: {
    fontSize: 12,
    opacity: 0.7,
  },
});
