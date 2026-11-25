import { NativeModules, Platform } from "react-native";
import type { MobileWordEntry } from "../data/mobileLexicon";
import type { ThemeMode } from "../theme/palettes";

interface VocabulandoWidgetNative {
  saveWidgetCache?: (jsonArrayString: string, themeMode: string) => Promise<boolean>;
}

/**
 * Grava lote de 14 dias e tema atual no SharedPreferences nativo para o Widget Android (Jetpack Glance).
 * No Expo Go (sem módulo nativo compilado), retorna silenciosamente sem erro.
 */
export async function syncNativeWidgetCache(
  words: MobileWordEntry[],
  themeMode: ThemeMode = "day",
): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  const mod = NativeModules.VocabulandoWidget as VocabulandoWidgetNative | undefined;
  if (!mod?.saveWidgetCache) return false;

  try {
    const payload = words.slice(0, 14).map((w, idx) => ({
      dayOffset: idx,
      id: w.id,
      word: w.word,
      phoneticIpa: w.ipa,
      shortDefinition: w.definition,
    }));
    return await mod.saveWidgetCache(JSON.stringify(payload), themeMode);
  } catch {
    return false;
  }
}
