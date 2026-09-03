import type {
  AppState,
  Challenge,
  ChallengeTemplate,
  Habit,
  HabitLog,
  Unit,
} from "../types";
import { todayStr, evaluateChallenges, isHabitDue, getLogCount } from "../utils/habitHelper";

const STORAGE_KEY = "mht_state_v1";

export const HABIT_EMOJIS = [
  "💧", "🚶", "📖", "🧘", "🏃", "💪", "😴", "🥗", "🍎", "✍️",
  "💊", "🎯", "🌅", "🙏", "🧠", "🎸", "🎨", "✨", "🔥", "🌿",
  "☀️", "🦷", "🚴", "🧹", "💰", "📵", "🥤", "🍵", "🛌", "🏊",
] as const;

export const HABIT_COLORS = [
  "accent",   // tema ana rengi
  "accent2",
  "accent3",
  "text-emerald-500",
  "text-sky-500",
  "text-orange-500",
  "text-fuchsia-500",
  "text-yellow-500",
] as const;

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: "c7_start",
    emoji: "🚀",
    nameKey: "template7",
    days: 7,
    targetPerDay: 1,
    color: "text-sky-400",
    startCount: 1,
  },
  {
    id: "c14_sprint",
    emoji: "🏃",
    nameKey: "template14",
    days: 14,
    targetPerDay: 1,
    color: "text-violet-400",
    startCount: 1,
  },
  {
    id: "c21_habit",
    emoji: "🌱",
    nameKey: "template21",
    days: 21,
    targetPerDay: 1,
    color: "text-emerald-400",
    startCount: 1,
  },
  {
    id: "c30_marathon",
    emoji: "🔥",
    nameKey: "template30",
    days: 30,
    targetPerDay: 1,
    color: "text-amber-400",
    startCount: 1,
  },
  {
    id: "c75_transform",
    emoji: "⚡",
    nameKey: "template75",
    days: 75,
    targetPerDay: 1,
    color: "text-orange-400",
    startCount: 1,
  },
];

export const CHALLENGE_DAY_OPTIONS = [7, 14, 21, 30, 75] as const;

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { habits: [], logs: [], challenges: [] };
    const parsed = JSON.parse(raw) as AppState;
    return {
      habits: (parsed.habits ?? []).map((h) => ({ unit: "count", ...h }) as Habit),
      logs: parsed.logs ?? [],
      challenges: parsed.challenges ?? [],
    };
  } catch (e) {
    console.error("[habitService] state okunamadı:", e);
    return { habits: [], logs: [], challenges: [] };
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("[habitService] state kaydedilemedi:", e);
  }
}

// ---- Habit CRUD -------------------------------------------------------

let idCounter = Date.now() % 1_000_000;
export function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function addHabit(state: AppState, habit: Omit<Habit, "id" | "createdAt" | "archived" | "order">): AppState {
  const h: Habit = {
    ...habit,
    id: makeId("habit"),
    createdAt: todayStr(),
    archived: false,
    order: state.habits.length,
  };
  return { ...state, habits: [...state.habits, h] };
}

// ---- Hazır alışkanlık setleri (şablon paketleri) -----------------------

export interface HabitSetItem {
  emoji: string;
  nameKey: string; // i18n anahtarı (habit adı)
  color: string;
  unit: Unit;
  targetPerDay: number;
  frequency: Habit["frequency"];
}

export interface HabitSetTemplate {
  id: string;
  emoji: string;
  nameKey: string; // i18n anahtarı (paket adı)
  descKey: string; // i18n anahtarı (paket açıklaması)
  color: string;
  habits: HabitSetItem[];
}

export const HABIT_SETS: HabitSetTemplate[] = [
  {
    id: "set_morning",
    emoji: "🌅",
    nameKey: "setMorning",
    descKey: "setMorningDesc",
    color: "text-amber-400",
    habits: [
      { emoji: "💧", nameKey: "setMorning1", color: "text-sky-500", unit: "count", targetPerDay: 1, frequency: { kind: "daily" } },
      { emoji: "🧘", nameKey: "setMorning2", color: "text-emerald-500", unit: "minutes", targetPerDay: 10, frequency: { kind: "daily" } },
      { emoji: "✍️", nameKey: "setMorning3", color: "text-fuchsia-500", unit: "count", targetPerDay: 1, frequency: { kind: "daily" } },
      { emoji: "🚶", nameKey: "setMorning4", color: "text-orange-500", unit: "minutes", targetPerDay: 15, frequency: { kind: "daily" } },
      { emoji: "📵", nameKey: "setMorning5", color: "text-yellow-500", unit: "count", targetPerDay: 1, frequency: { kind: "daily" } },
    ],
  },
  {
    id: "set_fitness",
    emoji: "💪",
    nameKey: "setFitness",
    descKey: "setFitnessDesc",
    color: "text-red-400",
    habits: [
      { emoji: "🏃", nameKey: "setFitness1", color: "text-orange-500", unit: "minutes", targetPerDay: 30, frequency: { kind: "daily" } },
      { emoji: "🚴", nameKey: "setFitness2", color: "text-sky-500", unit: "minutes", targetPerDay: 20, frequency: { kind: "weekly", days: [1, 3, 5] } },
      { emoji: "💪", nameKey: "setFitness3", color: "text-red-500", unit: "count", targetPerDay: 3, frequency: { kind: "weekly", days: [1, 2, 4, 5] } },
      { emoji: "🧘", nameKey: "setFitness4", color: "text-emerald-500", unit: "minutes", targetPerDay: 10, frequency: { kind: "daily" } },
      { emoji: "😴", nameKey: "setFitness5", color: "text-violet-500", unit: "count", targetPerDay: 1, frequency: { kind: "daily" } },
    ],
  },
  {
    id: "set_productivity",
    emoji: "🎯",
    nameKey: "setProductivity",
    descKey: "setProductivityDesc",
    color: "text-sky-400",
    habits: [
      { emoji: "📖", nameKey: "setProductivity1", color: "text-sky-500", unit: "minutes", targetPerDay: 30, frequency: { kind: "daily" } },
      { emoji: "✍️", nameKey: "setProductivity2", color: "text-fuchsia-500", unit: "count", targetPerDay: 1, frequency: { kind: "daily" } },
      { emoji: "🎯", nameKey: "setProductivity3", color: "text-yellow-500", unit: "count", targetPerDay: 3, frequency: { kind: "daily" } },
      { emoji: "📵", nameKey: "setProductivity4", color: "text-red-500", unit: "minutes", targetPerDay: 60, frequency: { kind: "weekly", days: [1, 2, 3, 4, 5] } },
      { emoji: "🎨", nameKey: "setProductivity5", color: "text-emerald-500", unit: "count", targetPerDay: 1, frequency: { kind: "daily" } },
    ],
  },
  {
    id: "set_mind",
    emoji: "🧠",
    nameKey: "setMind",
    descKey: "setMindDesc",
    color: "text-emerald-400",
    habits: [
      { emoji: "🧘", nameKey: "setMind1", color: "text-emerald-500", unit: "minutes", targetPerDay: 15, frequency: { kind: "daily" } },
      { emoji: "📖", nameKey: "setMind2", color: "text-sky-500", unit: "minutes", targetPerDay: 20, frequency: { kind: "daily" } },
      { emoji: "✍️", nameKey: "setMind3", color: "text-fuchsia-500", unit: "count", targetPerDay: 1, frequency: { kind: "daily" } },
      { emoji: "🚶", nameKey: "setMind4", color: "text-orange-500", unit: "minutes", targetPerDay: 20, frequency: { kind: "daily" } },
      { emoji: "🙏", nameKey: "setMind5", color: "text-amber-500", unit: "count", targetPerDay: 1, frequency: { kind: "daily" } },
    ],
  },
];

/** Hazır bir setin içindeki tüm habit'leri tek seferde ekler. */
export function addHabitSet(state: AppState, set: HabitSetTemplate): AppState {
  return set.habits.reduce(
    (acc, item) =>
      addHabit(acc, {
        name: item.nameKey,
        emoji: item.emoji,
        color: item.color,
        unit: item.unit,
        targetPerDay: item.targetPerDay,
        frequency: item.frequency,
        packId: set.id,
      }),
    state
  );
}

/** Verilen paketin habit'leri zaten eklenmiş mi? (tekrar eklemeyi engeller) */
export function isHabitSetAdded(state: AppState, setId: string): boolean {
  return state.habits.some((h) => h.packId === setId);
}

export function updateHabit(state: AppState, id: string, patch: Partial<Habit>): AppState {
  return {
    ...state,
    habits: state.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
  };
}

export function deleteHabit(state: AppState, id: string): AppState {
  // Challenge ile bağlıysa challenge da kaldırılır.
  return {
    ...state,
    habits: state.habits.filter((h) => h.id !== id),
    logs: state.logs.filter((l) => l.habitId !== id),
    challenges: state.challenges.filter((c) => c.habitId !== id),
  };
}

// ---- Log mekanizması --------------------------------------------------

/**
 * Belirli bir tarihteki alışkanlık ilerlemesini 1 artırır/azaltır.
 * Tamamlanmış gün tekrar tıklanırsa sıfırlar.
 */
export function toggleLog(
  state: AppState,
  habitId: string,
  date: string,
  targetPerDay: number
): AppState {
  const existing = state.logs.find((l) => l.habitId === habitId && l.date === date);
  let next: HabitLog[];
  if (!existing) {
    next = [...state.logs, { habitId, date, count: 1 }];
  } else if (existing.count >= targetPerDay) {
    next = state.logs.filter((l) => l !== existing);
  } else {
    next = state.logs.map((l) => (l === existing ? { ...l, count: l.count + 1 } : l));
  }
  return { ...state, logs: next };
}

export function setLogCount(
  state: AppState,
  habitId: string,
  date: string,
  count: number
): AppState {
  const others = state.logs.filter((l) => !(l.habitId === habitId && l.date === date));
  if (count <= 0) return { ...state, logs: others };
  return { ...state, logs: [...others, { habitId, date, count }] };
}

// ---- Challenge --------------------------------------------------------

export function createChallengeFromTemplate(
  state: AppState,
  template: ChallengeTemplate,
  name: string,
  startDate: string,
  lang: string
): AppState {
  const habit: Habit = {
    id: makeId("habit"),
    name: name.trim() || template.nameKey,
    emoji: template.emoji,
    color: "accent",
    frequency: { kind: "daily" },
    targetPerDay: template.targetPerDay,
    unit: "count",
    createdAt: todayStr(),
    archived: false,
    order: state.habits.length,
  };
  void lang;
  const challenge: Challenge = {
    id: makeId("challenge"),
    templateId: template.id,
    emoji: template.emoji,
    name: name.trim() || template.nameKey,
    totalDays: template.days,
    startDate,
    habitId: habit.id,
    usedGrace: false,
    status: "active",
  };
  return {
    habits: [...state.habits, habit],
    challenges: [...state.challenges, challenge],
    logs: state.logs,
  };
}

export function createCustomChallenge(
  state: AppState,
  opts: { name: string; emoji: string; totalDays: number; startDate: string; targetPerDay: number; color: string }
): AppState {
  const habit: Habit = {
    id: makeId("habit"),
    name: opts.name.trim() || "Custom Challenge",
    emoji: opts.emoji,
    color: opts.color,
    frequency: { kind: "daily" },
    targetPerDay: opts.targetPerDay,
    unit: "count",
    createdAt: todayStr(),
    archived: false,
    order: state.habits.length,
  };
  const challenge: Challenge = {
    id: makeId("challenge"),
    templateId: "custom",
    emoji: opts.emoji,
    name: habit.name,
    totalDays: opts.totalDays,
    startDate: opts.startDate,
    habitId: habit.id,
    usedGrace: false,
    status: "active",
  };
  return {
    habits: [...state.habits, habit],
    challenges: [...state.challenges, challenge],
    logs: state.logs,
  };
}

export function deleteChallenge(state: AppState, id: string): AppState {
  const ch = state.challenges.find((c) => c.id === id);
  if (ch) {
    return {
      ...state,
      challenges: state.challenges.filter((c) => c.id !== id),
      habits: state.habits.filter((h) => h.id !== ch.habitId),
      logs: state.logs.filter((l) => l.habitId !== ch.habitId),
    };
  }
  return state;
}

/** Günlük challenge girişini işaretler (alışkanlığın toggle'ı ile aynı). */
export function toggleChallengeDay(state: AppState, challengeId: string, date: string): AppState {
  const ch = state.challenges.find((c) => c.id === challengeId);
  if (!ch) return state;
  const habit = state.habits.find((h) => h.id === ch.habitId);
  if (!habit) return state;
  return toggleLog(state, habit.id, date, habit.targetPerDay);
}

// ---- Sıfırlama / değerlendirme ---------------------------------------

/**
 * Uygulama açılışında ve gün değişiminde çağrılır:
 * mazeret hakkı / sıfırlama / tamamlama değerlendirmesini yapar,
 * sonucu ve yeni state'i döner.
 */
export function evaluateAndPersist(state: AppState, today: string): { state: AppState; evals: { usedGraceIds: string[]; resetIds: string[]; completedIds: string[] } } {
  const { challenges, evals } = evaluateChallenges(
    state.challenges,
    state.habits,
    state.logs,
    today
  );
  const next: AppState = { ...state, challenges };
  saveState(next);
  return { state: next, evals };
}

// ---- Yardımcı arayüzler ----------------------------------------------

export function habitLogFor(habit: Habit, logs: HabitLog[], date: string): {
  count: number;
  complete: boolean;
  due: boolean;
} {
  const due = isHabitDue(habit, date);
  const count = getLogCount(logs, habit.id, date);
  return { count, complete: due && count >= habit.targetPerDay, due };
}

export function getActiveHabits(state: AppState): Habit[] {
  return state.habits
    .filter((h) => !h.archived)
    .sort((a, b) => a.order - b.order);
}