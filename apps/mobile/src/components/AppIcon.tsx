import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type AppIconName =
  | "flame"
  | "shield"
  | "book"
  | "headphones"
  | "shuffle"
  | "pen"
  | "scale"
  | "repeat"
  | "lightbulb"
  | "search"
  | "volume"
  | "check"
  | "star"
  | "home"
  | "path"
  | "chart"
  | "bookmark"
  | "share"
  | "film"
  | "graduation"
  | "sun"
  | "briefcase"
  | "cpu"
  | "heart"
  | "coffee";

interface IconProps {
  name: AppIconName;
  size?: number;
  color: string;
  filled?: boolean;
}

export function BrandLogoIcon({ accent, size = 32 }: { accent: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      {/* Open book wings matching I4 emblem with transparent background */}
      <Path
        d="M5 12.5C9.5 11 14 12.2 18 15.5C22 12.2 26.5 11 31 12.5V26.5C26.5 25 22 26.2 18 29C14 26.2 9.5 25 5 26.5V12.5Z"
        stroke={accent}
        strokeWidth={2.2}
        strokeLinejoin="round"
        fill={accent}
        fillOpacity={0.14}
      />
      {/* Central V-sprout accent */}
      <Path
        d="M18 15.5V29M18 15.5C15.8 11.2 13.5 9.2 11.5 8.5M18 15.5C20.2 11.2 22.5 9.2 24.5 8.5"
        stroke={accent}
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AppIcon({ name, size = 20, color, filled = false }: IconProps) {
  switch (name) {
    case "flame":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2.5C12 2.5 17.5 7.5 17.5 13a5.5 5.5 0 1 1-11 0c0-2.5 1.3-4.8 2.8-6.4 0 2 1.2 3.2 2.7 3.2 0-2.5 0-7.3 0-7.3Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={filled ? color : "none"}
            fillOpacity={filled ? 0.25 : 0}
          />
        </Svg>
      );
    case "shield":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3l7 3v5.5c0 4.5-3 8.2-7 9.5-4-1.3-7-5-7-9.5V6l7-3Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
            fill={filled ? color : "none"}
            fillOpacity={filled ? 0.2 : 0}
          />
        </Svg>
      );
    case "book":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 6.5C7 5.5 10 6 12 7.5C14 6 17 5.5 20 6.5V18.5C17 17.5 14 18 12 19.5C10 18 7 17.5 4 18.5V6.5Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <Path d="M12 7.5V19.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case "headphones":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 14v-2a8 8 0 0 1 16 0v2"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Rect x={3} y={13} width={4} height={6} rx={1.5} stroke={color} strokeWidth={1.8} />
          <Rect x={17} y={13} width={4} height={6} rx={1.5} stroke={color} strokeWidth={1.8} />
        </Svg>
      );
    case "shuffle":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M16 4h4v4M4 18l5-5M15 7l5-3M4 6l5 5 6 6h5M16 20l4-3-4-3"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "pen":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M14.5 5.5l4 4L8 20H4v-4L14.5 5.5Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "scale":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 4v16M7 20h10M5 8h14M5 8l-2 5h4l-2-5Zm14 0-2 5h4l-2-5Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "repeat":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "lightbulb":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 18h6M10 21h4M8.5 14.5C7 13.3 6 11.5 6 9.5a6 6 0 1 1 12 0c0 2-1 3.8-2.5 5-.5.5-.8 1.2-.8 2H9.3c0-.8-.3-1.5-.8-2Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "search":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={6.5} stroke={color} strokeWidth={1.8} />
          <Path d="M16 16l4.5 4.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case "volume":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 10v4h4l5 4V6L8 10H4ZM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "check":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 12.5l4.5 4.5L19 7"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "star":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9l6.1-.9L12 2.5Z"
            fill={filled ? color : "none"}
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "home":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "path":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 18c4-6 12-6 16-12M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "chart":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={4} y={12} width={4} height={8} rx={1} stroke={color} strokeWidth={1.8} />
          <Rect x={10} y={8} width={4} height={12} rx={1} stroke={color} strokeWidth={1.8} />
          <Rect x={16} y={4} width={4} height={16} rx={1} stroke={color} strokeWidth={1.8} />
        </Svg>
      );
    case "bookmark":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"
            fill={filled ? color : "transparent"}
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "share":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={18} cy={5} r={2.5} stroke={color} strokeWidth={1.8} />
          <Circle cx={6} cy={12} r={2.5} stroke={color} strokeWidth={1.8} />
          <Circle cx={18} cy={19} r={2.5} stroke={color} strokeWidth={1.8} />
          <Path d="M8.3 10.9l7.4-4.6M8.3 13.1l7.4 4.6" stroke={color} strokeWidth={1.8} />
        </Svg>
      );
    case "film":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={5} width={18} height={14} rx={2} stroke={color} strokeWidth={1.8} />
          <Path d="M7 5v14M17 5v14M3 10h4M17 10h4M3 14h4M17 14h4" stroke={color} strokeWidth={1.6} />
        </Svg>
      );
    case "graduation":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M2 10l10-5 10 5-10 5-10-5Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
          <Path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 10v5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case "sun":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.8} />
          <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case "briefcase":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={7} width={18} height={13} rx={2} stroke={color} strokeWidth={1.8} />
          <Path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12h18" stroke={color} strokeWidth={1.8} />
        </Svg>
      );
    case "cpu":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={6} y={6} width={12} height={12} rx={2} stroke={color} strokeWidth={1.8} />
          <Path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case "heart":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "coffee":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 10h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-5ZM16 11h2a2 2 0 0 1 0 4h-2M8 5v2M12 5v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
  }
}

export function MascotLikeSvg({ accent, gold }: { accent: string; gold: string }) {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64" fill="none">
      {/* Mascote Livro-Sábio dando joinha */}
      <Rect x={14} y={14} width={30} height={36} rx={9} fill={accent} fillOpacity={0.18} stroke={accent} strokeWidth={2.2} />
      <Circle cx={24} cy={28} r={2.5} fill={accent} />
      <Circle cx={34} cy={28} r={2.5} fill={accent} />
      <Path d="M24 36c2.5 3 7.5 3 10 0" stroke={accent} strokeWidth={2.2} strokeLinecap="round" />
      {/* Mão dando like */}
      <Path
        d="M46 34h5a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-5V34Zm0 0l2-7a2 2 0 0 1 3.8.6L51 34"
        fill={gold}
        fillOpacity={0.28}
        stroke={gold}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
