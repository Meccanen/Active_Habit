import type {
  Challenge,
  ChallengeEvalResult,
  DayCell,
  Habit,
  HabitLog,
  TodayStats,
} from "../types";

export const DAY_MS = 86400000;

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toDateStr(dt);
}

export function diffDays(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  const a = new Date(y1, m1 - 1, d1).getTime();
  const b = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((b - a) / DAY_MS);
}

export function isHabitDue(habit: Habit, dateStr: string): boolean {
  if (habit.frequency.kind === "daily") return true;
  const dt = new Date(dateStr + "T00:00:00");
  return habit.frequency.days.includes(dt.getDay());
}

export function getLogCount(logs: HabitLog[], habitId: string, dateStr: string): number {
  const l = logs.find((x) => x.habitId === habitId && x.date === dateStr);
  return l ? l.count : 0;
}

export function isHabitComplete(habit: Habit, logs: HabitLog[], dateStr: string): boolean {
  if (!isHabitDue(habit, dateStr)) return true; // o gün zorunlu değil → nötr
  return getLogCount(logs, habit.id, dateStr) >= habit.targetPerDay;
}

/**
 * Güncel (devam eden) seri. Bugün henüz işaretlenmemişse bugün ceza
 * sayılmaz — dünün serisine devam edilir. Zorunlu olmayan günler atlanır.
 */
export function getCurrentStreak(habit: Habit, logs: HabitLog[], today: string): number {
  let streak = 0;
  let d = today;
  let first = true;
  let guard = 0;
  for (;;) {
    if (guard++ > 3700) break;
    if (isHabitDue(habit, d)) {
      if (isHabitComplete(habit, logs, d)) {
        streak++;
      } else if (!first) {
        break;
      }
      // ilk gün (bugün) zorunlu ama tamamlanmamışsa: devam, ceza yok
    }
    d = addDays(d, -1);
    first = false;
  }
  return streak;
}

/** En uzun seri (oluşturma tarihinden bugüne). */
export function getBestStreak(habit: Habit, logs: HabitLog[], today: string): number {
  let best = 0;
  let cur = 0;
  let d = habit.createdAt;
  let guard = 0;
  while (d <= today && guard++ < 3700) {
    if (isHabitDue(habit, d)) {
      if (isHabitComplete(habit, logs, d)) cur++;
      else {
        if (cur > best) best = cur;
        cur = 0;
      }
    }
    d = addDays(d, 1);
  }
  if (cur > best) best = cur;
  return best;
}

export function getTodayStats(
  habits: Habit[],
  logs: HabitLog[],
  today: string
): TodayStats {
  const active = habits.filter((h) => !h.archived && isHabitDue(h, today));
  const due = active.length;
  const done = active.filter((h) => isHabitComplete(h, logs, today)).length;
  return { due, done, pct: due === 0 ? 0 : Math.round((done / due) * 100) };
}

/** [from, to] aralığında zorunlu günlerin tamamlanma oranı (0-100). */
export function getCompletionRate(
  habits: Habit[],
  logs: HabitLog[],
  from: string,
  to: string
): number {
  const active = habits.filter((h) => !h.archived);
  if (active.length === 0) return 0;
  let due = 0;
  let done = 0;
  let d = from;
  let guard = 0;
  while (d <= to && guard++ < 3700) {
    for (const h of active) {
      if (isHabitDue(h, d)) {
        due++;
        if (isHabitComplete(h, logs, d)) done++;
      }
    }
    d = addDays(d, 1);
  }
  return due === 0 ? 0 : Math.round((done / due) * 100);
}

export interface DaySummary {
  date: string;
  weekday: number;
  done: number;
  due: number;
}

/** Son n günün günlük özeti (mini grafik için). */
export function getLastNDays(
  habits: Habit[],
  logs: HabitLog[],
  n: number,
  today: string
): DaySummary[] {
  const active = habits.filter((h) => !h.archived);
  const out: DaySummary[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const dueHabits = active.filter((h) => isHabitDue(h, date));
    const due = dueHabits.length;
    const doneImp = dueHabits.filter((h) => isHabitComplete(h, logs, date)).length;
    out.push({
      date,
      weekday: new Date(date + "T00:00:00").getDay(),
      done: doneImp,
      due,
    });
  }
  return out;
}

/** Aylık takvim hücreleri (ön-arka komşu günler dahil). */
export function getMonthCells(
  year: number,
  month: number, // 1-12
  habits: Habit[],
  logs: HabitLog[],
  today: string
): DayCell[] {
  const first = new Date(year, month - 1, 1);
  const startOffset = (first.getDay() + 6) % 7; // 0=Pazartesi ... 6=Pazar (hafta Pazartesi başlar)
  const daysInMonth = new Date(year, month, 0).getDate();
  const lastDate = new Date(year, month - 1, daysInMonth);
  const active = habits.filter((h) => !h.archived);

  const cells: DayCell[] = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    const dt = new Date(first);
    dt.setDate(dt.getDate() - (i + 1));
    cells.push(buildCell(dt, false, active, logs, today));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(buildCell(new Date(year, month - 1, d), true, active, logs, today));
  }
  const trail = 7 - (cells.length % 7 === 0 ? 7 : cells.length % 7);
  if (trail < 7) {
    for (let i = 1; i <= trail; i++) {
      const dt = new Date(lastDate);
      dt.setDate(dt.getDate() + i);
      cells.push(buildCell(dt, false, active, logs, today));
    }
  }
  return cells;
}

function buildCell(
  dt: Date,
  inMonth: boolean,
  active: Habit[],
  logs: HabitLog[],
  today: string
): DayCell {
  const date = toDateStr(dt);
  const dueH = active.filter((h) => isHabitDue(h, date));
  const due = dueH.length;
  const done = dueH.filter((h) => isHabitComplete(h, logs, date)).length;
  return { date, inMonth, isToday: date === today, completed: done, due };
}

// ---------------------------------------------------------------------
// Challenge mazeret (gizli 1 günlük izin) ve değerlendirme mantığı
// ---------------------------------------------------------------------

/**
 * Aktif challenge'ları bugüne göre değerlendirir:
 * - Süresi biten ve tüm günleri tamamlanan → başarıyla biter (completed).
 * - Kaçırılan gün varsa ve mazeret hakkı KULLANILMAMIŞSA → hak kullanılır, uyarı döner.
 * - Kaçırılan gün varsa ve mazeret hakkı KULLANILMIŞSA → challenge sıfırlanır.
 * Saf fonksiyon: yeni challenge listesi + sonuç döner, mutasyon yapmaz.
 */
export function evaluateChallenges(
  challenges: Challenge[],
  habits: Habit[],
  logs: HabitLog[],
  today: string
): { challenges: Challenge[]; evals: ChallengeEvalResult } {
  const evals: ChallengeEvalResult = { usedGraceIds: [], resetIds: [], completedIds: [] };
  const next = challenges.map((c) => {
    if (c.status !== "active") return c;
    const habit = habits.find((h) => h.id === c.habitId);
    if (!habit) return { ...c, status: "failed" as const };

    const endDate = addDays(c.startDate, c.totalDays - 1);

    // Bugüne kadar geçen ve kaçırılan günleri bul (bugün henüz değerlendirilmez).
    const checkStart = c.startDate;
    const checkEnd = endDate < addDays(today, -1) ? endDate : addDays(today, -1);
    let missed = false;
    if (checkStart <= checkEnd) {
      let d = checkStart;
      let guard = 0;
      while (d <= checkEnd && guard++ < 3700) {
        if (!isHabitComplete(habit, logs, d)) {
          missed = true;
          break;
        }
        d = addDays(d, 1);
      }
    }

    if (!missed && checkEnd >= endDate) {
      // Süre doldu ve tüm günler tamamlandı → başarı.
      evals.completedIds.push(c.id);
      return { ...c, status: "completed" as const, completedAt: today };
    }

    if (missed) {
      if (!c.usedGrace) {
        evals.usedGraceIds.push(c.id);
        return { ...c, usedGrace: true };
      }
      evals.resetIds.push(c.id);
      return { ...c, startDate: today, usedGrace: false };
    }

    return c;
  });
  return { challenges: next, evals };
}

/** Challenge'ın toplam ilerlemesi: kullanılan gün / toplam gün. */
export function getChallengeProgress(
  c: Challenge,
  habit: Habit | undefined,
  logs: HabitLog[],
  today: string
): { doneDays: number; leftDays: number; pct: number } {
  const habitSafe = habit;
  let doneDays = 0;
  if (habitSafe) {
    const endDateExclusive = addDays(c.startDate, c.totalDays);
    let d = c.startDate;
    let guard = 0;
    while (d < endDateExclusive && d <= today && guard++ < 3700) {
      if (isHabitComplete(habitSafe, logs, d)) doneDays++;
      d = addDays(d, 1);
    }
  }
  const leftDays = Math.max(0, c.totalDays - doneDays);
  const pct = Math.min(100, Math.round((doneDays / c.totalDays) * 100));
  return { doneDays, leftDays, pct };
}

/** Challenge bitiş tarihi. */
export function getChallengeEndDate(c: Challenge): string {
  return addDays(c.startDate, c.totalDays - 1);
}

export function isChallengeActive(c: Challenge, today: string): boolean {
  return c.status === "active" && c.startDate <= today;
}