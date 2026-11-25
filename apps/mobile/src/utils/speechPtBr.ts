import * as Speech from "expo-speech";

export async function speakPtBr(
  text: string,
  options: {
    rate?: number;
    onStart?: () => void;
    onDone?: () => void;
    onError?: () => void;
  } = {},
): Promise<void> {
  try {
    await Speech.stop();
    const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
    // Prioriza estritamente pt-BR e evita cair em pt-PT
    const ptBrVoice = voices.find((v) => {
      const lang = v.language.toLowerCase().replace("_", "-");
      return lang === "pt-br" || lang.startsWith("pt-br");
    });

    options.onStart?.();
    Speech.speak(text, {
      language: "pt-BR",
      voice: ptBrVoice?.identifier,
      rate: options.rate ?? 0.92,
      onDone: options.onDone,
      onStopped: options.onDone,
      onError: options.onError,
    });
  } catch {
    options.onError?.();
  }
}
