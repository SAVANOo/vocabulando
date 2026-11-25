import { createAudioPlayer } from "expo-audio";

export type SoundKind = "success" | "flip" | "save" | "softError";

const SOUND_SOURCES: Record<SoundKind, number> = {
  success: require("../../assets/sounds/success.wav"),
  flip: require("../../assets/sounds/flip.wav"),
  save: require("../../assets/sounds/save.wav"),
  softError: require("../../assets/sounds/softError.wav"),
};

export function playUiSound(kind: SoundKind, enabled: boolean) {
  if (!enabled) return;
  try {
    const player = createAudioPlayer(SOUND_SOURCES[kind]);
    player.play();
    setTimeout(() => {
      try {
        player.remove();
      } catch {
        // ignora se já liberado
      }
    }, 600);
  } catch {
    // Fallback silencioso caso o dispositivo esteja sem saída de áudio
  }
}
