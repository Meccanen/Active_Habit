export type Frequency =
  | { kind: "daily" }
  | { kind: "weekly"; days: number[] }; // 0=Pazartesi değil, JS getDay() → 0=Pazar ... 6=Cumartesi

export type Unit = "count" | "minutes";

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string; // tema içinde kullanılacak renk anahtarı (accent familyası)
  frequency: Frequency;
  targetPerDay: number; // günde kaç kez hedef
  unit: Unit; // hedef tipi: adet veya dakika
  targetMinutes?: number; // süreli hedefler için hedef dakika (unit="minutes")
  createdAt: string; // YYYY-MM-DD
  archived: boolean;
  order: number;
}

export interface HabitLog {
  habitId: string;
  date: string; // YYYY-MM-DD
  count: number; // hedefe doğru ilerleme
}

export type ChallengeStatus = "active" | "completed" | "failed";

export interface Challenge {
  id: string;
  templateId: string; // hazır şablon kimliği (custom için "custom")
  emoji: string;
  name: string;
  totalDays: number; // 7 | 21 | 75 | custom
  startDate: string; // YYYY-MM-DD
  habitId: string; // challenge'ı takip eden alışkanlık
  usedGrace: boolean; // gizli 1 günlük mazeret hakkı kullanıldı mı?
  status: ChallengeStatus;
  completedAt?: string;
}

export interface ChallengeTemplate {
  id: string;
  emoji: string;
  nameKey: string; // i18n anahtarı
  days: number;
  targetPerDay: number;
  color: string;
  startCount: number; // günde kaç tekrar (ör. 8 bardak)
}

export interface AppState {
  habits: Habit[];
  logs: HabitLog[];
  challenges: Challenge[];
}

export interface DayCell {
  date: string; // YYYY-MM-DD
  inMonth: boolean;
  isToday: boolean;
  completed: number;
  due: number;
}

export interface TodayStats {
  due: number;
  done: number;
  pct: number;
}

export interface ChallengeEvalResult {
  usedGraceIds: string[]; // ilk kez kaçıran ve affedilen challenge'lar
  resetIds: string[]; // mazeret hakkı dolunca sıfırlanan challenge'lar
  completedIds: string[]; // süresi dolup başarıyla biten challenge'lar
}