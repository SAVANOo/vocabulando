import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import {
  applyHabitAction,
  createInitialSrsState,
  getLexiconRank,
  isDailyGoalMet,
  isDueForReview,
  scheduleSrsReview,
  type DifficultyLevel,
  type TrackCategory,
} from "@vocabulando/domain";
import { AppIcon, BrandLogoIcon } from "./components/AppIcon";
import { CelebrationPopup } from "./components/CelebrationPopup";
import { CommuteAudioModal } from "./components/CommuteAudioModal";
import { DictionaryLookupModal } from "./components/DictionaryLookupModal";
import { LearningPath, type PathNodeAction } from "./components/LearningPath";
import { LessonSessionRunner } from "./components/LessonSessionRunner";
import { ExLibrisShelfModal } from "./components/ExLibrisShelfModal";
import { OnboardingFlow, type UserPreferences } from "./components/OnboardingFlow";
import { ReadingImporterModal } from "./components/ReadingImporterModal";
import { SafeErrorBoundary } from "./components/SafeErrorBoundary";
import { SplashBookIntro } from "./components/SplashBookIntro";
import { StreakModal } from "./components/StreakModal";
import { StudyFlipCard } from "./components/StudyFlipCard";
import { TutorialOverlay } from "./components/TutorialOverlay";
import { MOBILE_LEXICON } from "./data/mobileLexicon";
import {
  countPendingEvents,
  downloadThemePack,
  enqueueOfflineEvent,
  ensureMobileLexiconSeeded,
  flushOfflineEvents,
  getLocalAnalyticsSummary,
  getLocalCatalogCounts,
  getLocalTrackCounts,
  getLocalWordsByIds,
  loadLocalState,
  pullRemoteProgress,
  queryLocalLexicon,
  saveLocalState,
  trackAnalyticsEvent,
  type PersistedMobileState,
} from "./storage/localDb";
import { PALETTES, type ThemeMode } from "./theme/palettes";
import { scheduleDailyWordReminder } from "./utils/notifications";
import { playUiSound } from "./utils/soundEffects";
import { syncNativeWidgetCache } from "./utils/widgetSync";

type MainTab = "home" | "practice" | "progress";

const ALL_TRACKS: Array<{ id: TrackCategory; label: string }> = [
  { id: "essencial-culto", label: "Essencial Culto" },
  { id: "comunicacao-executiva", label: "Executivo" },
  { id: "redacao-argumentacao", label: "Redação" },
  { id: "literario-poetico", label: "Literário" },
  { id: "paronimos", label: "Parônimos" },
];

const DIFFICULTIES: Array<{ id: DifficultyLevel; label: string }> = [
  { id: "intermediario", label: "Intermediário" },
  { id: "avancado", label: "Avançado" },
  { id: "erudito", label: "Erudito" },
];

const ALL_THEMES: Array<{ id: string; label: string }> = [
  { id: "all", label: "Todos os temas" },
  { id: "cinema-arte", label: "Cinema & Arte" },
  { id: "escola-estudo", label: "Escola & Estudo" },
  { id: "ferias-praia", label: "Férias & Praia" },
  { id: "trabalho-negocios", label: "Trabalho" },
  { id: "tecnologia-digital", label: "Tecnologia" },
  { id: "saude-bem-estar", label: "Saúde" },
  { id: "gastronomia-casa", label: "Gastronomia" },
];

const DAILY_GOALS = [2, 3, 5] as const;
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const CELEBRATION_MESSAGES = [
  "Mandou bem!",
  "Excelente!",
  "Vocabulário afiado!",
  "Precisão incrível!",
];

function getDefaultApiUrl(): string {
  return Platform.OS === "android" ? "http://10.0.2.2:4180" : "http://127.0.0.1:4180";
}

function createEventUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getRankProgress(xp: number): { nextLabel: string; pct: number; remaining: number } {
  if (xp < 100) return { nextLabel: "Explorador", pct: Math.min(100, xp), remaining: 100 - xp };
  if (xp < 300) {
    return {
      nextLabel: "Estrategista",
      pct: Math.min(100, Math.round(((xp - 100) / 200) * 100)),
      remaining: 300 - xp,
    };
  }
  if (xp < 600) {
    return {
      nextLabel: "Orador",
      pct: Math.min(100, Math.round(((xp - 300) / 300) * 100)),
      remaining: 600 - xp,
    };
  }
  if (xp < 1000) {
    return {
      nextLabel: "Erudito",
      pct: Math.min(100, Math.round(((xp - 600) / 400) * 100)),
      remaining: 1000 - xp,
    };
  }
  return { nextLabel: "Mestre Máximo", pct: 100, remaining: 0 };
}

function TabIcon({ id, color }: { id: MainTab; color: string }) {
  return <AppIcon name={id === "home" ? "home" : id === "practice" ? "path" : "chart"} size={20} color={color} />;
}

export default function MobileApp() {
  return (
    <SafeErrorBoundary>
      <MobileAppContent />
    </SafeErrorBoundary>
  );
}

function MobileAppContent() {
  const [state, setState] = useState<PersistedMobileState>(() => loadLocalState());
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => !loadLocalState().seenOnboarding);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const [commuteOpen, setCommuteOpen] = useState(false);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [importerOpen, setImporterOpen] = useState(false);
  const [tooltipText, setTooltipText] = useState<string | null>(null);
  const [tab, setTab] = useState<MainTab>("home");
  const [tabBarWidth, setTabBarWidth] = useState(360);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeLessonNode, setActiveLessonNode] = useState<PathNodeAction | null>(null);
  const [useAllTracks, setUseAllTracks] = useState(false);
  const [filterByDifficulty, setFilterByDifficulty] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("all");
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [celebration, setCelebration] = useState<{
    visible: boolean;
    xp: number;
    title: string;
    subtitle?: string;
  }>({
    visible: false,
    xp: 15,
    title: "Mandou bem!",
  });
  const [pendingSyncCount, setPendingSyncCount] = useState(() => countPendingEvents());
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [catalogCounts] = useState(() => {
    ensureMobileLexiconSeeded();
    return getLocalCatalogCounts();
  });
  const [skimTimestamps, setSkimTimestamps] = useState<number[]>([]);
  const [showSkimSuggestion, setShowSkimSuggestion] = useState(false);
  const [nowIso, setNowIso] = useState(() => new Date().toISOString());
  const [tabSlideAnim] = useState(() => new Animated.Value(0));
  const [tabContentFade] = useState(() => new Animated.Value(1));
  const [practiceFade] = useState(() => new Animated.Value(1));

  const activeHour = new Date(nowIso).getHours();
  const effectiveThemeMode: ThemeMode =
    state.autoNightMode && (activeHour >= 19 || activeHour < 6) ? "night" : state.themeMode;
  const palette = PALETTES[effectiveThemeMode];
  const dailyGoal = state.prefs.dailyGoalWords || 3;

  useEffect(() => {
    saveLocalState(state);
  }, [state]);

  useEffect(() => {
    void syncNativeWidgetCache(MOBILE_LEXICON, effectiveThemeMode);
  }, [effectiveThemeMode]);

  useEffect(() => {
    trackAnalyticsEvent("app_open");
    void (async () => {
      const synced = await flushOfflineEvents(getDefaultApiUrl());
      if (synced > 0) {
        setPendingSyncCount(countPendingEvents());
      }
    })();
  }, []);

  function switchTab(nextTab: MainTab) {
    Vibration.vibrate(6);
    setTab(nextTab);
    tabContentFade.setValue(0);
    const targetIdx = nextTab === "home" ? 0 : nextTab === "practice" ? 1 : 2;
    Animated.parallel([
      Animated.spring(tabSlideAnim, {
        toValue: targetIdx,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(tabContentFade, {
        toValue: 1,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    trackAnalyticsEvent("tab_switch", 0, { tab: nextTab });
  }

  const activeFeed = useMemo(() => {
    const dbRows =
      catalogCounts.wordsCount > 0 || catalogVersion > 0
        ? queryLocalLexicon({
            tracks: useAllTracks || selectedTheme !== "all" ? undefined : state.prefs.tracks,
            theme: selectedTheme,
            difficulty: filterByDifficulty ? state.prefs.difficulty : undefined,
            limit: 10,
          })
        : [];
    if (dbRows.length > 0) return dbRows;

    let list = useAllTracks
      ? MOBILE_LEXICON
      : MOBILE_LEXICON.filter((w) => state.prefs.tracks.includes(w.category));
    if (list.length === 0) list = MOBILE_LEXICON;

    if (filterByDifficulty) {
      const byDiff = list.filter((w) => w.difficulty === state.prefs.difficulty);
      if (byDiff.length > 0) list = byDiff;
    }
    return list.slice(0, 10);
  }, [catalogCounts.wordsCount, catalogVersion, state.prefs.tracks, state.prefs.difficulty, useAllTracks, filterByDifficulty, selectedTheme]);

  const currentWord = activeFeed[cardIndex % activeFeed.length] ?? MOBILE_LEXICON[0]!;
  const rank = getLexiconRank(state.habit.totalXp);
  const rankProg = getRankProgress(state.habit.totalXp);
  const goalMet = isDailyGoalMet(state.habit, dailyGoal);

  const dueReviewIds = useMemo(() => {
    return Object.values(state.srsCards)
      .filter((c) => isDueForReview(c, nowIso))
      .map((c) => c.wordId);
  }, [state.srsCards, nowIso]);
  const dueReviewsCount = dueReviewIds.length;

  const analyticsSummary =
    tab === "progress" ? getLocalAnalyticsSummary() : { totalEvents: 0, avgDwellMs: 0 };

  function addWeeklyXp(prevWeekly: number[], delta: number, iso: string): number[] {
    const dayIdx = new Date(iso).getDay();
    const copy = prevWeekly.length === 7 ? [...prevWeekly] : [0, 0, 0, 0, 0, 0, 0];
    copy[dayIdx] = (copy[dayIdx] ?? 0) + delta;
    return copy;
  }

  function recordOffline(
    type: "WORD_VIEWED" | "QUIZ_ANSWERED",
    wordId: string,
    payload: Record<string, unknown> = {},
  ) {
    enqueueOfflineEvent({
      eventId: createEventUuid(),
      type,
      wordId,
      occurredAt: new Date().toISOString(),
      payload: payload as { correct?: boolean },
    });
    setPendingSyncCount(countPendingEvents());
  }

  function markStudied(wordId: string, dwellTimeMs = 0) {
    Vibration.vibrate(14);
    const currentIso = new Date().toISOString();
    setNowIso(currentIso);
    const nextHabit = applyHabitAction(state.habit, "WORD_VIEWED", currentIso, dailyGoal);
    const justCompletedGoal = !goalMet && isDailyGoalMet(nextHabit, dailyGoal);
    const isNewWord = !state.studiedIds.includes(wordId);
    const wordLabel =
      activeFeed.find((w) => w.id === wordId)?.word ??
      MOBILE_LEXICON.find((w) => w.id === wordId)?.word ??
      currentWord.word;
    playUiSound(justCompletedGoal || isNewWord ? "success" : "save", state.soundEnabled);

    if (justCompletedGoal) {
      setCelebration({
        visible: true,
        xp: 20,
        title: "Meta diária concluída!",
        subtitle: isNewWord
          ? `"${wordLabel}" entrou no seu vocabulário (${state.studiedIds.length + 1} palavras)!`
          : undefined,
      });
    } else if (isNewWord) {
      setCelebration({
        visible: true,
        xp: 5,
        title: "Nova palavra aprendida!",
        subtitle: `"${wordLabel}" agora faz parte do seu vocabulário (${state.studiedIds.length + 1} palavras).`,
      });
    }

    setState((prev) => ({
      ...prev,
      habit: nextHabit,
      weeklyXp: addWeeklyXp(prev.weeklyXp, 5, currentIso),
      studiedIds: prev.studiedIds.includes(wordId)
        ? prev.studiedIds
        : [...prev.studiedIds, wordId],
    }));
    recordOffline("WORD_VIEWED", wordId, { dwellTimeMs });
    trackAnalyticsEvent("word_studied", dwellTimeMs, { wordId });
    setCardIndex((i) => (i + 1) % activeFeed.length);
  }

  function toggleSave(wordId: string) {
    Vibration.vibrate(10);
    playUiSound("save", state.soundEnabled);
    setState((prev) => ({
      ...prev,
      savedIds: prev.savedIds.includes(wordId)
        ? prev.savedIds.filter((x) => x !== wordId)
        : [...prev.savedIds, wordId],
    }));
    trackAnalyticsEvent("word_saved_toggle", 0, { wordId });
  }

  function handlePracticeScore(wordId: string, correct: boolean, skipXp = false) {
    const currentIso = new Date().toISOString();
    setNowIso(currentIso);
    const xpGain = skipXp ? 0 : correct ? 15 : 2;
    if (correct && !activeLessonNode) {
      const msg = CELEBRATION_MESSAGES[state.quizCorrect % CELEBRATION_MESSAGES.length]!;
      setCelebration({ visible: true, xp: 15, title: msg });
    }
    setState((prev) => {
      const existing = prev.srsCards[wordId] ?? createInitialSrsState(wordId, currentIso);
      const nextSrs = scheduleSrsReview(existing, correct ? 3 : 1, currentIso);
      const nextHabit = applyHabitAction(
        prev.habit,
        correct ? "QUIZ_CORRECT" : "QUIZ_WRONG",
        currentIso,
        dailyGoal,
      );
      return {
        ...prev,
        habit: skipXp ? { ...nextHabit, totalXp: prev.habit.totalXp } : nextHabit,
        quizTotal: prev.quizTotal + 1,
        quizCorrect: prev.quizCorrect + (correct ? 1 : 0),
        weeklyXp: xpGain > 0 ? addWeeklyXp(prev.weeklyXp, xpGain, currentIso) : prev.weeklyXp,
        srsCards: { ...prev.srsCards, [wordId]: nextSrs },
      };
    });
    recordOffline("QUIZ_ANSWERED", wordId, { correct });
    trackAnalyticsEvent("quiz_answered", 0, {
      wordId,
      correct,
      mode: activeLessonNode?.kind ?? "path",
    });
  }

  function toggleProfileTrack(id: TrackCategory) {
    Vibration.vibrate(8);
    setState((prev) => {
      const exists = prev.prefs.tracks.includes(id);
      const nextTracks = exists
        ? prev.prefs.tracks.length > 1
          ? prev.prefs.tracks.filter((x) => x !== id)
          : prev.prefs.tracks
        : [...prev.prefs.tracks, id];
      return { ...prev, prefs: { ...prev.prefs, tracks: nextTracks } };
    });
    setCardIndex(0);
  }

  async function manualSync() {
    const synced = await flushOfflineEvents(getDefaultApiUrl());
    const remote = await pullRemoteProgress(getDefaultApiUrl());
    if (remote) {
      setState((prev) => ({
        ...prev,
        habit: {
          ...prev.habit,
          totalXp: Math.max(prev.habit.totalXp, remote.totalXp ?? 0),
        },
        savedIds: Array.from(new Set([...prev.savedIds, ...(remote.savedIds ?? [])])),
        srsCards: { ...(remote.srsCards ?? {}), ...prev.srsCards },
      }));
    }
    const remaining = countPendingEvents();
    setPendingSyncCount(remaining);
    setSyncMessage(
      remaining === 0
        ? `Tudo sincronizado (${synced} enviado(s)).`
        : `API indisponível — ${remaining} registro(s) salvos localmente.`,
    );
  }

  if (showSplash) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]}>
        <StatusBar barStyle={state.themeMode === "day" ? "dark-content" : "light-content"} />
        <SplashBookIntro palette={palette} onDone={() => setShowSplash(false)} />
      </SafeAreaView>
    );
  }

  if (showOnboarding) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]}>
        <StatusBar barStyle={state.themeMode === "day" ? "dark-content" : "light-content"} />
        <OnboardingFlow
          palette={palette}
          soundEnabled={state.soundEnabled}
          initialPrefs={state.prefs}
          onFinish={(nextPrefs: UserPreferences) => {
            void scheduleDailyWordReminder(9);
            const shouldShowTut = !state.seenTutorial;
            setState((prev) => ({
              ...prev,
              prefs: nextPrefs,
              seenOnboarding: true,
              seenTutorial: true,
            }));
            setUseAllTracks(false);
            setCardIndex(0);
            setShowOnboarding(false);
            trackAnalyticsEvent("onboarding_complete", 0, {
              dailyGoalWords: nextPrefs.dailyGoalWords,
              difficulty: nextPrefs.difficulty,
              tracksCount: nextPrefs.tracks.length,
            });
            if (shouldShowTut) setShowTutorial(true);
          }}
        />
      </SafeAreaView>
    );
  }

  const accuracyPct =
    state.quizTotal > 0 ? Math.round((state.quizCorrect / state.quizTotal) * 100) : 100;
  const maxWeekly = Math.max(10, ...state.weeklyXp);
  const userInitial = (state.prefs.userName.trim()[0] ?? "V").toUpperCase();
  const difficultyLabel =
    state.prefs.difficulty === "intermediario"
      ? "Intermediário"
      : state.prefs.difficulty === "avancado"
        ? "Avançado"
        : "Erudito";
  const localTrackCounts =
    tab === "progress" && catalogCounts.wordsCount > 0
      ? getLocalTrackCounts(state.studiedIds)
      : {};
  const savedWordsList =
    tab === "progress" && state.savedIds.length > 0 ? getLocalWordsByIds(state.savedIds) : [];
  const tabSlotWidth = Math.max(80, tabBarWidth / 3);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]}>
      <StatusBar barStyle={state.themeMode === "day" ? "dark-content" : "light-content"} />
      <CelebrationPopup
        visible={celebration.visible}
        xp={celebration.xp}
        title={celebration.title}
        subtitle={celebration.subtitle}
        palette={palette}
        onDismiss={() => setCelebration((c) => ({ ...c, visible: false, subtitle: undefined }))}
      />
      <StreakModal
        visible={streakOpen}
        palette={palette}
        habit={state.habit}
        dailyGoalWords={dailyGoal}
        weeklyXp={state.weeklyXp}
        studiedCount={state.studiedIds.length}
        onClose={() => setStreakOpen(false)}
      />
      <TutorialOverlay
        visible={showTutorial}
        palette={palette}
        soundEnabled={state.soundEnabled}
        onClose={() => setShowTutorial(false)}
      />
      <DictionaryLookupModal
        visible={showLookup}
        palette={palette}
        apiBaseUrl={getDefaultApiUrl()}
        onClose={() => setShowLookup(false)}
      />
      <CommuteAudioModal
        visible={commuteOpen}
        words={activeFeed}
        palette={palette}
        onClose={() => setCommuteOpen(false)}
      />
      <ExLibrisShelfModal
        visible={shelfOpen}
        palette={palette}
        studiedCount={state.studiedIds.length}
        savedCount={state.savedIds.length}
        quizCorrectCount={state.quizCorrect}
        onClose={() => setShelfOpen(false)}
      />
      <ReadingImporterModal
        visible={importerOpen}
        palette={palette}
        savedIds={state.savedIds}
        onSaveWord={toggleSave}
        onClose={() => setImporterOpen(false)}
      />

      {/* Profile Modal */}
      <Modal
        visible={profileOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setProfileOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.profileSheet, { backgroundColor: palette.bg, borderColor: palette.border }]}>
            <View style={[styles.header, { borderBottomColor: palette.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={[styles.avatar, { backgroundColor: palette.accent }]}>
                  <Text style={{ color: palette.accentInk, fontSize: 18, fontWeight: "700" }}>
                    {userInitial}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: palette.text, fontSize: 17, fontWeight: "700" }}>
                    {state.prefs.userName}
                  </Text>
                  <Text style={{ color: palette.muted, fontSize: 12 }}>
                    {rank} • Meta: {dailyGoal} palavras/dia
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar perfil"
                style={[styles.pillBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
                onPress={() => setProfileOpen(false)}
              >
                <Text style={{ color: palette.text, fontSize: 12, fontWeight: "700" }}>Fechar</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={[styles.missionCard, { backgroundColor: palette.surface, borderColor: palette.border, gap: 10 }]}>
                <Text style={[styles.missionLabel, { color: palette.accent }]}>MINHAS TRILHAS</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {ALL_TRACKS.map((tr) => {
                    const active = state.prefs.tracks.includes(tr.id);
                    return (
                      <Pressable
                        key={tr.id}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: active }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? palette.accentSoft : palette.surfaceAlt,
                            borderColor: active ? palette.accent : palette.border,
                          },
                        ]}
                        onPress={() => toggleProfileTrack(tr.id)}
                      >
                        <Text style={{ color: active ? palette.accent : palette.text, fontSize: 12, fontWeight: "600" }}>
                          {active ? `✓ ${tr.label}` : tr.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.missionCard, { backgroundColor: palette.surface, borderColor: palette.border, gap: 10 }]}>
                <Text style={[styles.missionLabel, { color: palette.accent }]}>NÍVEL &amp; DEDICAÇÃO DIÁRIA</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {DIFFICULTIES.map((df) => {
                    const active = state.prefs.difficulty === df.id;
                    return (
                      <Pressable
                        key={df.id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? palette.accentSoft : palette.surfaceAlt,
                            borderColor: active ? palette.accent : palette.border,
                          },
                        ]}
                        onPress={() => {
                          setState((prev) => ({ ...prev, prefs: { ...prev.prefs, difficulty: df.id } }));
                          setCardIndex(0);
                        }}
                      >
                        <Text style={{ color: active ? palette.accent : palette.text, fontSize: 12, fontWeight: "600" }}>
                          {df.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {DAILY_GOALS.map((g) => {
                    const active = dailyGoal === g;
                    return (
                      <Pressable
                        key={g}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? palette.accentSoft : palette.surfaceAlt,
                            borderColor: active ? palette.accent : palette.border,
                          },
                        ]}
                        onPress={() =>
                          setState((prev) => ({
                            ...prev,
                            prefs: { ...prev.prefs, dailyGoalWords: g },
                          }))
                        }
                      >
                        <Text style={{ color: active ? palette.accent : palette.text, fontSize: 12, fontWeight: "600" }}>
                          {g} palavras/dia
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.missionCard, { backgroundColor: palette.surface, borderColor: palette.border, gap: 10 }]}>
                <Text style={[styles.missionLabel, { color: palette.accent }]}>PREFERÊNCIAS</Text>
                <Pressable
                  style={[styles.quizOpt, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
                  onPress={() => {
                    const nextMode: ThemeMode = state.themeMode === "day" ? "night" : "day";
                    setState((prev) => ({ ...prev, themeMode: nextMode }));
                  }}
                >
                  <Text style={{ color: palette.text, fontWeight: "600" }}>
                    Tema: {state.themeMode === "day" ? "Sálvia & Papel (Dia)" : "Noturno Suave (Noite)"}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.quizOpt, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
                  onPress={() => setState((prev) => ({ ...prev, autoNightMode: !prev.autoNightMode }))}
                >
                  <Text style={{ color: palette.text, fontWeight: "600" }}>
                    Modo noturno automático (19h–06h): {state.autoNightMode ? "Ligado" : "Desligado"}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.quizOpt, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
                  onPress={() => setState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                >
                  <Text style={{ color: palette.text, fontWeight: "600" }}>
                    Sons de interação: {state.soundEnabled ? "Ligados" : "Desligados"}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.quizOpt, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
                  onPress={() => void manualSync()}
                >
                  <Text style={{ color: palette.text, fontWeight: "600" }}>
                    Sincronizar progresso ({pendingSyncCount} pendente(s))
                  </Text>
                </Pressable>
                {syncMessage && <Text style={{ color: palette.accent, fontSize: 12 }}>{syncMessage}</Text>}
                <Pressable
                  style={[styles.quizOpt, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
                  onPress={() => {
                    setProfileOpen(false);
                    setShowTutorial(true);
                  }}
                >
                  <Text style={{ color: palette.text, fontWeight: "600" }}>Rever tutorial guiado</Text>
                </Pressable>
                <Pressable
                  style={[styles.quizOpt, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
                  onPress={() => {
                    setProfileOpen(false);
                    setShowOnboarding(true);
                  }}
                >
                  <Text style={{ color: palette.text, fontWeight: "600" }}>Refazer Onboarding</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Header with Design System Logo + HUD + Tooltip + Profile Avatar */}
      <View style={[styles.header, { backgroundColor: palette.bg, borderBottomColor: palette.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <BrandLogoIcon accent={palette.accent} size={32} />
          <View>
            <Text style={[styles.brand, { color: palette.accent }]}>Vocabulando</Text>
            <Text style={[styles.subBrand, { color: palette.muted }]}>
              Olá, {state.prefs.userName.trim() || "Estudante"} • {rank}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir página de ofensiva e meta diária"
            style={[styles.hudPill, { backgroundColor: palette.surface, borderColor: palette.border }]}
            onPress={() => {
              Vibration.vibrate(6);
              setStreakOpen(true);
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <AppIcon name="flame" size={13} color={palette.gold} filled />
              <Text style={[styles.hudText, { color: palette.text }]}>{state.habit.currentStreak}d</Text>
              <AppIcon name="shield" size={13} color={palette.accent} filled />
              <Text style={[styles.hudText, { color: palette.text }]}>{state.habit.freezeShields}</Text>
              <Text style={[styles.hudText, { color: palette.accent }]}>• {state.habit.totalXp} XP</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil e configurações"
            style={[styles.topAvatar, { backgroundColor: palette.accent }]}
            onPress={() => {
              Vibration.vibrate(8);
              setProfileOpen(true);
            }}
          >
            <Text style={{ color: palette.accentInk, fontSize: 14, fontWeight: "700" }}>
              {userInitial}
            </Text>
          </Pressable>
        </View>
      </View>

      {tooltipText && (
        <Pressable
          style={[styles.tooltipBar, { backgroundColor: palette.accentSoft, borderBottomColor: palette.accent }]}
          onPress={() => setTooltipText(null)}
        >
          <Text style={{ color: palette.text, fontSize: 12, lineHeight: 17 }}>{tooltipText}</Text>
          <Text style={{ color: palette.accent, fontSize: 11, fontWeight: "700", marginTop: 2 }}>
            Toque para fechar
          </Text>
        </Pressable>
      )}

      <Animated.View style={[styles.body, { opacity: tabContentFade }]}>
        {tab === "home" && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.missionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={styles.missionTop}>
                <Text style={[styles.missionLabel, { color: palette.accent }]}>
                  {goalMet ? "META DE HOJE CONCLUÍDA ✓" : "SUA META DE HOJE"}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ajuda sobre a meta diária"
                  onPress={() =>
                    setTooltipText(
                      `Sua meta atual é de ${dailyGoal} palavras por dia (ou 1 desafio rápido). Você pode ajustar no seu Perfil.`,
                    )
                  }
                >
                  <Text style={{ color: palette.muted, fontSize: 12, fontWeight: "700" }}>?</Text>
                </Pressable>
              </View>

              <Text style={[styles.missionDesc, { color: palette.text }]}>
                {state.habit.todayWordsViewed}/{dailyGoal} palavras estudadas • {state.habit.todayQuizzesCompleted}/1 desafio rápido
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: palette.surfaceAlt }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: palette.accent,
                      width: `${Math.min(100, Math.round((state.habit.todayWordsViewed / dailyGoal) * 100))}%`,
                    },
                  ]}
                />
              </View>

              {/* Clear Search, Commute Audio & Feed Filters */}
              <View style={{ gap: 8, marginTop: 4 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Buscar palavra no dicionário"
                    style={[styles.dictBarBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
                    onPress={() => setShowLookup(true)}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <AppIcon name="search" size={14} color={palette.accent} />
                      <Text style={{ color: palette.accent, fontSize: 12, fontWeight: "700" }}>
                        Dicionário
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Abrir Modo Trajeto por áudio"
                    style={[styles.dictBarBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
                    onPress={() => setCommuteOpen(true)}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <AppIcon name="headphones" size={14} color={palette.accent} />
                      <Text style={{ color: palette.accent, fontSize: 12, fontWeight: "700" }}>
                        Modo Trajeto
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Importar trecho de leitura"
                    style={[styles.dictBarBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
                    onPress={() => setImporterOpen(true)}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <AppIcon name="book" size={14} color={palette.accent} />
                      <Text style={{ color: palette.accent, fontSize: 12, fontWeight: "700" }}>
                        Importar
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Mostrar ou ocultar filtros"
                    style={[
                      styles.dictBarBtn,
                      {
                        backgroundColor: filtersOpen ? palette.accentSoft : palette.surfaceAlt,
                        borderColor: filtersOpen ? palette.accent : palette.border,
                      },
                    ]}
                    onPress={() => setFiltersOpen((v) => !v)}
                  >
                    <Text style={{ color: filtersOpen ? palette.accent : palette.text, fontSize: 12, fontWeight: "700" }}>
                      {filtersOpen ? "Filtros ▲" : "Filtros ▾"}
                    </Text>
                  </Pressable>
                </ScrollView>

                {filtersOpen && (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    <View style={styles.filterRow}>
                      <Text style={{ color: palette.muted, fontSize: 11, fontWeight: "700" }}>
                        FILTRAR CARDS:
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Alternar filtro de trilhas"
                        style={[
                          styles.pillBtn,
                          {
                            backgroundColor: useAllTracks ? palette.surfaceAlt : palette.accentSoft,
                            borderColor: useAllTracks ? palette.border : palette.accent,
                          },
                        ]}
                        onPress={() => {
                          setUseAllTracks((v) => !v);
                          setCardIndex(0);
                        }}
                      >
                        <Text
                          style={{
                            color: useAllTracks ? palette.text : palette.accent,
                            fontSize: 11,
                            fontWeight: "700",
                          }}
                        >
                          {useAllTracks ? "Trilhas: Todas" : `Minhas trilhas (${activeFeed.length})`}
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Filtrar pelo meu nível"
                        style={[
                          styles.pillBtn,
                          {
                            backgroundColor: filterByDifficulty ? palette.accentSoft : palette.surfaceAlt,
                            borderColor: filterByDifficulty ? palette.accent : palette.border,
                          },
                        ]}
                        onPress={() => {
                          setFilterByDifficulty((v) => !v);
                          setCardIndex(0);
                        }}
                      >
                        <Text
                          style={{
                            color: filterByDifficulty ? palette.accent : palette.text,
                            fontSize: 11,
                            fontWeight: "700",
                          }}
                        >
                          {filterByDifficulty ? `Nível: ${difficultyLabel}` : "Nível: Todos"}
                        </Text>
                      </Pressable>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {ALL_THEMES.map((tm) => {
                        const active = selectedTheme === tm.id;
                        return (
                          <Pressable
                            key={tm.id}
                            accessibilityRole="button"
                            style={[
                              styles.pillBtn,
                              {
                                backgroundColor: active ? palette.accentSoft : palette.surfaceAlt,
                                borderColor: active ? palette.accent : palette.border,
                              },
                            ]}
                            onPress={() => {
                              setSelectedTheme(tm.id);
                              setCardIndex(0);
                              if (tm.id !== "all") {
                                void downloadThemePack(getDefaultApiUrl(), tm.id).then((added) => {
                                  if (added > 0) setCatalogVersion((v) => v + 1);
                                });
                              }
                            }}
                          >
                            <Text style={{ color: active ? palette.accent : palette.muted, fontSize: 11, fontWeight: "700" }}>
                              {tm.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            <StudyFlipCard
              key={currentWord.id}
              word={currentWord}
              palette={palette}
              soundEnabled={state.soundEnabled}
              isSaved={state.savedIds.includes(currentWord.id)}
              onToggleSave={() => toggleSave(currentWord.id)}
              onStudied={(dwellTimeMs) => markStudied(currentWord.id, dwellTimeMs)}
              onFlipTracked={() => trackAnalyticsEvent("card_flipped", 0, { wordId: currentWord.id })}
              onAudioTracked={() => trackAnalyticsEvent("audio_played", 0, { wordId: currentWord.id })}
            />

            <View style={styles.pagerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Palavra anterior"
                style={[styles.pagerBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
                onPress={() => {
                  Vibration.vibrate(6);
                  setCardIndex((i) => (i - 1 + activeFeed.length) % activeFeed.length);
                }}
              >
                <Text style={[styles.pagerText, { color: palette.text }]}>← Anterior</Text>
              </Pressable>
              <Text style={{ color: palette.muted, fontSize: 13, fontWeight: "600" }}>
                {(cardIndex % activeFeed.length) + 1} / {activeFeed.length}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Próxima palavra"
                style={[styles.pagerBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
                onPress={() => {
                  Vibration.vibrate(6);
                  const now = Date.now();
                  const recent = [...skimTimestamps.filter((t) => now - t < 12000), now];
                  setSkimTimestamps(recent);
                  if (recent.length >= 8) {
                    setShowSkimSuggestion(true);
                  }
                  setCardIndex((i) => (i + 1) % activeFeed.length);
                }}
              >
                <Text style={[styles.pagerText, { color: palette.text }]}>Próxima →</Text>
              </Pressable>
            </View>

            {showSkimSuggestion && (
              <View style={[styles.missionCard, { backgroundColor: palette.accentSoft, borderColor: palette.accent }]}>
                <Text style={{ color: palette.text, fontSize: 13, fontWeight: "600" }}>
                  Passando rápido pelos cards? Que tal fixar com 1 atividade rápida na Trilha?
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    style={[styles.pillBtn, { backgroundColor: palette.accent, borderColor: palette.accent }]}
                    onPress={() => {
                      setShowSkimSuggestion(false);
                      setSkimTimestamps([]);
                      switchTab("practice");
                    }}
                  >
                    <Text style={{ color: palette.accentInk, fontSize: 12, fontWeight: "700" }}>
                      Ir para Trilha
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.pillBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
                    onPress={() => {
                      setShowSkimSuggestion(false);
                      setSkimTimestamps([]);
                    }}
                  >
                    <Text style={{ color: palette.muted, fontSize: 12, fontWeight: "600" }}>
                      Continuar lendo
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {tab === "practice" && (
          <View style={{ flex: 1 }}>
            <Animated.View style={{ flex: 1, opacity: practiceFade }}>
              {!activeLessonNode ? (
                <LearningPath
                  palette={palette}
                  completedNodeIds={state.completedNodeIds}
                  dueReviewsCount={dueReviewsCount}
                  onSelectNode={(node) => {
                    if (node.kind === "track") {
                      setCardIndex(node.seedOffset % activeFeed.length);
                      setState((prev) => ({
                        ...prev,
                        completedNodeIds: prev.completedNodeIds.includes(node.id)
                          ? prev.completedNodeIds
                          : [...prev.completedNodeIds, node.id],
                      }));
                      switchTab("home");
                    } else {
                      practiceFade.setValue(0);
                      setActiveLessonNode(node);
                      Animated.timing(practiceFade, {
                        toValue: 1,
                        duration: 240,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true,
                      }).start();
                    }
                  }}
                />
              ) : (
                <LessonSessionRunner
                  key={activeLessonNode.id}
                  nodeId={activeLessonNode.id}
                  kind={activeLessonNode.kind}
                  seedOffset={activeLessonNode.seedOffset}
                  words={activeFeed}
                  palette={palette}
                  soundEnabled={state.soundEnabled}
                  onRecordAnswer={(wordId, hit) => handlePracticeScore(wordId, hit, true)}
                  onCompleteLesson={(nodeId, xpEarned) => {
                    const currentIso = new Date().toISOString();
                    setNowIso(currentIso);
                    setState((prev) => ({
                      ...prev,
                      completedNodeIds: prev.completedNodeIds.includes(nodeId)
                        ? prev.completedNodeIds
                        : [...prev.completedNodeIds, nodeId],
                      habit: {
                        ...prev.habit,
                        totalXp: prev.habit.totalXp + xpEarned,
                      },
                      weeklyXp: addWeeklyXp(prev.weeklyXp, xpEarned, currentIso),
                    }));
                    trackAnalyticsEvent("lesson_completed", 0, { nodeId, xpEarned });
                    setActiveLessonNode(null);
                  }}
                  onExit={() => setActiveLessonNode(null)}
                />
              )}
            </Animated.View>
          </View>
        )}

        {tab === "progress" && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={[styles.missionCard, { backgroundColor: palette.surface, borderColor: palette.border, gap: 10 }]}>
              <Text style={[styles.missionLabel, { color: palette.accent }]}>SEU RANK &amp; DESEMPENHO</Text>
              <Text style={{ color: palette.text, fontSize: 26, fontWeight: "700" }}>{rank}</Text>
              <View style={[styles.progressTrack, { backgroundColor: palette.surfaceAlt }]}>
                <View
                  style={[styles.progressFill, { backgroundColor: palette.accent, width: `${rankProg.pct}%` }]}
                />
              </View>
              <Text style={{ color: palette.muted, fontSize: 12 }}>
                {rankProg.remaining > 0
                  ? `Faltam ${rankProg.remaining} XP para ${rankProg.nextLabel}`
                  : "Nível máximo alcançado!"}
              </Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statBox, { backgroundColor: palette.surfaceAlt }]}>
                  <Text style={{ color: palette.accent, fontSize: 18, fontWeight: "700" }}>
                    {accuracyPct}%
                  </Text>
                  <Text style={{ color: palette.muted, fontSize: 11 }}>Precisão</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: palette.surfaceAlt }]}>
                  <Text style={{ color: palette.accent, fontSize: 18, fontWeight: "700" }}>
                    {state.studiedIds.length}/{catalogCounts.wordsCount > 0 ? catalogCounts.wordsCount : MOBILE_LEXICON.length}
                  </Text>
                  <Text style={{ color: palette.muted, fontSize: 11 }}>Estudadas</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: palette.surfaceAlt }]}>
                  <Text style={{ color: palette.accent, fontSize: 18, fontWeight: "700" }}>
                    {state.habit.longestStreak}d
                  </Text>
                  <Text style={{ color: palette.muted, fontSize: 11 }}>Recorde</Text>
                </View>
              </View>
            </View>

            <View style={[styles.missionCard, { backgroundColor: palette.surface, borderColor: palette.border, gap: 12 }]}>
              <Text style={[styles.missionLabel, { color: palette.accent }]}>ATIVIDADE DA SEMANA (XP)</Text>
              <View style={styles.chartRow}>
                {WEEKDAYS.map((day, idx) => {
                  const val = state.weeklyXp[idx] ?? 0;
                  const h = Math.max(8, Math.round((val / maxWeekly) * 72));
                  return (
                    <View key={day} style={styles.chartCol}>
                      <Text style={{ color: palette.muted, fontSize: 10 }}>{val}</Text>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: h,
                            backgroundColor: val > 0 ? palette.accent : palette.surfaceAlt,
                          },
                        ]}
                      />
                      <Text style={{ color: palette.muted, fontSize: 11 }}>{day}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={{ color: palette.muted, fontSize: 12 }}>
                Práticas registradas: {analyticsSummary.totalEvents} • Tempo médio por card:{" "}
                {Math.round(analyticsSummary.avgDwellMs / 1000)}s
              </Text>
              <Pressable
                accessibilityRole="button"
                style={[styles.dictBarBtn, { backgroundColor: palette.accentSoft, borderColor: palette.accent, marginTop: 4 }]}
                onPress={() => setShelfOpen(true)}
              >
                <Text style={{ color: palette.accent, fontSize: 13, fontWeight: "700" }}>
                  Abrir Minha Estante &amp; Selos Ex-Libris
                </Text>
              </Pressable>
              {accuracyPct >= 90 && state.quizTotal >= 4 && state.prefs.difficulty === "intermediario" && (
                <Pressable
                  accessibilityRole="button"
                  style={[styles.dictBarBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.gold }]}
                  onPress={() =>
                    setState((prev) => ({
                      ...prev,
                      prefs: { ...prev.prefs, difficulty: "avancado" },
                    }))
                  }
                >
                  <Text style={{ color: palette.gold, fontSize: 12, fontWeight: "700" }}>
                    Precisão acima de 90%! Toque para subir ao nível Avançado →
                  </Text>
                </Pressable>
              )}
              {analyticsSummary.avgDwellMs > 0 && analyticsSummary.avgDwellMs < 1500 && accuracyPct < 65 && state.quizTotal >= 4 && (
                <Text style={{ color: palette.muted, fontSize: 12 }}>
                  Dica de estudo: vire o card para explorar a Rede Etimológica antes do desafio.
                </Text>
              )}
            </View>

            <View style={[styles.missionCard, { backgroundColor: palette.surface, borderColor: palette.border, gap: 10 }]}>
              <Text style={[styles.missionLabel, { color: palette.accent }]}>DOMÍNIO POR TRILHA</Text>
              {ALL_TRACKS.map((tr) => {
                const dbTrack = localTrackCounts[tr.id];
                const total = dbTrack?.total ?? MOBILE_LEXICON.filter((w) => w.category === tr.id).length;
                const done =
                  dbTrack?.done ??
                  MOBILE_LEXICON.filter(
                    (w) => w.category === tr.id && state.studiedIds.includes(w.id),
                  ).length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <View key={tr.id} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: palette.text, fontSize: 12, fontWeight: "600" }}>{tr.label}</Text>
                      <Text style={{ color: palette.muted, fontSize: 12 }}>{done}/{total}</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: palette.surfaceAlt }]}>
                      <View style={[styles.progressFill, { backgroundColor: palette.accent, width: `${pct}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={[styles.missionCard, { backgroundColor: palette.surface, borderColor: palette.border, gap: 10 }]}>
              <Text style={[styles.missionLabel, { color: palette.accent }]}>
                PALAVRAS FAVORITAS ({state.savedIds.length})
              </Text>
              {savedWordsList.length === 0 ? (
                <Text style={{ color: palette.muted, fontSize: 14 }}>
                  Toque na bandeirinha no canto superior direito do card para favoritar palavras aqui.
                </Text>
              ) : (
                savedWordsList.map((w) => (
                  <View
                    key={w.id}
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: palette.border,
                      paddingTop: 8,
                    }}
                  >
                    <Text style={{ color: palette.text, fontSize: 16, fontWeight: "700" }}>
                      {w.word}
                    </Text>
                    <Text style={{ color: palette.muted, fontSize: 13 }}>{w.definition}</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {/* Centered Animated 3-Tab Icon Bottom Navbar */}
      <View
        onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}
        style={[styles.tabBar, { backgroundColor: palette.surface, borderTopColor: palette.border }]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabIndicator,
            {
              backgroundColor: palette.accentSoft,
              width: tabSlotWidth - 12,
              transform: [
                {
                  translateX: Animated.add(
                    6,
                    Animated.multiply(tabSlideAnim, tabSlotWidth),
                  ),
                },
              ],
            },
          ]}
        />
        {(
          [
            ["home", "Início"],
            ["practice", "Trilha"],
            ["progress", "Progresso"],
          ] as const
        ).map(([id, label]) => {
          const active = tab === id;
          const color = active ? palette.accent : palette.muted;
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              style={styles.tabItem}
              onPress={() => switchTab(id)}
            >
              <TabIcon id={id} color={color} />
              <Text style={{ color, fontSize: 11, fontWeight: active ? "700" : "600", marginTop: 2 }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  brand: { fontSize: 17, fontWeight: "700" },
  subBrand: { fontSize: 11 },
  hudPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  hudText: { fontSize: 11, fontWeight: "600" },
  topAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  tooltipBar: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  body: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 28 },
  quizCenteredScroll: { flexGrow: 1, justifyContent: "center", padding: 16 },
  missionCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 8 },
  missionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  missionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  missionDesc: { fontSize: 13, fontWeight: "600" },
  progressTrack: { height: 6, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  dictBarBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  filterRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  pillBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  hintToggle: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pagerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pagerBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  pagerText: { fontSize: 13, fontWeight: "600" },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  quizOpt: { borderWidth: 1, borderRadius: 12, padding: 13 },
  primaryAction: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  statsGrid: { flexDirection: "row", gap: 8, marginTop: 4 },
  statBox: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  chartRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 108, paddingTop: 10 },
  chartCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 },
  chartBar: { width: 18, borderRadius: 6 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  profileSheet: { height: "88%", borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTopWidth: 1, overflow: "hidden" },
  tabBar: { flexDirection: "row", borderTopWidth: 1, paddingVertical: 6, position: "relative" },
  tabIndicator: { position: "absolute", top: 6, bottom: 6, left: 0, borderRadius: 12 },
  tabItem: { flex: 1, paddingVertical: 6, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
