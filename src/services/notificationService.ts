import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Habit, HabitLog } from "../types";
import {
  addDays,
  getAverageRate,
  getCompletionRate,
  getMaxCurrentStreak,
  isHabitComplete,
  isHabitDue,
  todayStr,
} from "../utils/habitHelper";
import { t, LangCode } from "../utils/i18n";

export interface NotifPrefs {
  checkinOn: boolean;
  checkinTime: string; // "HH:mm"
  weeklyOn: boolean;
  monthlyOn: boolean;
}

const CHECKIN_ID = 3101;
const WEEKLY_ID = 3102;
const MONTHLY_ID = 3103;
const ANDROID_CHANNEL = "habits_channel";
const LOOKAHEAD_DAYS = 7;

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function readEntry(key: string, fallback: string): string {
  try {
    const v = localStorage.getItem(key);
    return v ? v : fallback;
  } catch {
    return fallback;
  }
}

export function readNotifPrefs(): NotifPrefs {
  return {
    checkinOn: readEntry("mht_notif_checkin", "1") === "1",
    checkinTime: readEntry("mht_notif_checkin_time", "13:00"),
    weeklyOn: readEntry("mht_notif_weekly", "1") === "1",
    monthlyOn: readEntry("mht_notif_monthly", "1") === "1",
  };
}

export function writeNotifPrefs(p: NotifPrefs): void {
  try {
    localStorage.setItem("mht_notif_checkin", p.checkinOn ? "1" : "0");
    localStorage.setItem("mht_notif_checkin_time", p.checkinTime);
    localStorage.setItem("mht_notif_weekly", p.weeklyOn ? "1" : "0");
    localStorage.setItem("mht_notif_monthly", p.monthlyOn ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** İzin durumunu döndürür; henüz karar verilmemişse sorar (denied ise tekrar sormaz). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative()) return true;
  try {
    const perms = await LocalNotifications.checkPermissions();
    if (perms.display === "granted") return true;
    if (perms.display === "denied") return false;
    const res = await LocalNotifications.requestPermissions();
    return res.display === "granted";
  } catch {
    return false;
  }
}

function ensureChannel(lang: LangCode): void {
  try {
    LocalNotifications.createChannel({
      id: ANDROID_CHANNEL,
      name: t("appName", lang),
      description: t("notifTab", lang),
      importance: 4, // HIGH
      vibration: true,
      sound: "default",
      visibility: 1, // PUBLIC
    });
  } catch {
    /* kanal zaten varsa veya platform desteklemiyorsa yok say */
  }
}

/** [from, to] aralığında zorunlu gün sayısı ve tamamlanan gün sayısı. */
function rangeCounts(
  habits: Habit[],
  logs: HabitLog[],
  from: string,
  to: string
): { due: number; done: number } {
  const active = habits.filter((h) => !h.archived);
  let due = 0;
  let done = 0;
  let d = from;
  let guard = 0;
  while (d <= to && guard++ < 4000) {
    for (const h of active) {
      if (isHabitDue(h, d)) {
        due++;
        if (isHabitComplete(h, logs, d)) done++;
      }
    }
    d = addDays(d, 1);
  }
  return { due, done };
}

function anyDue(habits: Habit[], dateStr: string): boolean {
  return habits.some((h) => !h.archived && isHabitDue(h, dateStr));
}

/** Belirli bir tarihten SONRA, zorunlu alışkanlığı olan ilk gün (LOOKAHEAD içinde). */
function nextDueDay(habits: Habit[], afterDate: string): string | null {
  let d = addDays(afterDate, 1);
  for (let i = 0; i < LOOKAHEAD_DAYS; i++, d = addDays(d, 1)) {
    if (anyDue(habits, d)) return d;
  }
  return null;
}

/**
 * Günlük yoklama bildirimi metni. Veriden kişiselleştirilir ve gün bazında
 * rotasyon yapılır (uygulama kapalıyken bile her gün farklı metin düşebilir).
 */
function pickCheckinText(
  habits: Habit[],
  logs: HabitLog[],
  lang: LangCode,
  refDate: string
): string {
  const pool: string[] = [];
  const seed = Math.floor(new Date(refDate + "T00:00:00").getTime() / 86400000);
  const streak = getMaxCurrentStreak(habits, logs, refDate);
  const pct = getAverageRate(habits, logs, 7, refDate);
  if (streak >= 2) pool.push(t("notifBodyStreak", lang, { n: String(streak) }));
  if (pct >= 50) pool.push(t("notifBodyPct", lang, { pct: String(pct) }));
  const worst = habits
    .filter((h) => !h.archived)
    .map((h) => {
      let cnt = 0;
      let due = 0;
      let d = addDays(refDate, -3);
      let guard = 0;
      while (d <= refDate && guard++ < 20) {
        if (isHabitDue(h, d)) {
          due++;
          if (isHabitComplete(h, logs, d)) cnt++;
        }
        d = addDays(d, 1);
      }
      return { h, rate: due === 0 ? 100 : Math.round((cnt / due) * 100), due };
    })
    .sort((a, b) => a.rate - b.rate)[0];
  if (worst && worst.rate < 67 && worst.due > 0) {
    pool.push(
      t("notifBodyMissed", lang, { emoji: worst.h.emoji, name: worst.h.name })
    );
  }
  pool.push(t("notifBodyGeneric", lang));
  return pool[seed % pool.length];
}

/** Pazartesi 09:00 veya ayın 1'i 09:00 gibi bir sonraki hedef tarihi. */
function nextWeekdayTime(
  weekday: number,
  time: string,
  today: string
): string {
  const ref = new Date(today + "T09:00:00");
  const day = ref.getDay();
  let diff = (weekday - day + 7) % 7;
  if (diff === 0 && ref.getTime() <= Date.now()) diff = 7;
  return addDays(today, diff) + "T" + time + ":00";
}

function nextMonthStartsOne(today: string): string {
  const ref = new Date(today + "T09:00:00");
  const isFirst = ref.getDate() === 1;
  let d: Date;
  if (isFirst && ref.getTime() > Date.now()) {
    d = ref;
  } else {
    d = new Date(ref.getFullYear(), ref.getMonth() + 1, 1, 9, 0, 0, 0);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}T09:00:00`;
}

function scheduleAt(id: number, title: string, body: string, atStr: string): void {
  const at = new Date(atStr);
  if (at.getTime() <= Date.now() + 60000) return;
  void LocalNotifications.schedule({
    notifications: [
      {
        id,
        title,
        body,
        channelId: ANDROID_CHANNEL,
        schedule: { at, allowWhileIdle: true },
      },
    ],
  });
}

/** Ayarlara göre tüm bildirimleri iptal edip yeniden planlar. Web'de güvenle hiçbir şey yapmaz. */
export async function scheduleNotifications(
  habits: Habit[],
  logs: HabitLog[],
  prefs: NotifPrefs,
  lang: LangCode
): Promise<void> {
  if (!isNative()) return;
  const enabled = prefs.checkinOn || prefs.weeklyOn || prefs.monthlyOn;
  if (!enabled) {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: CHECKIN_ID }, { id: WEEKLY_ID }, { id: MONTHLY_ID }],
      });
    } catch {
      /* ignore */
    }
    return;
  }
  const granted = await requestNotificationPermission();
  if (!granted) return;

  ensureChannel(lang);
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: CHECKIN_ID }, { id: WEEKLY_ID }, { id: MONTHLY_ID }],
    });
  } catch {
    /* ignore */
  }

  const today = todayStr();

  if (prefs.checkinOn && habits.some((h) => !h.archived)) {
    const target = nextDueDay(habits, today);
    if (target) {
      const atStr = target + "T" + (prefs.checkinTime || "13:00") + ":00";
      scheduleAt(CHECKIN_ID, t("notifCheckinTitle", lang), pickCheckinText(habits, logs, lang, target), atStr);
    }
  }

  if (prefs.weeklyOn) {
    const atStr = nextWeekdayTime(1, "09:00", today); // Pazartesi
    const ref = atStr.slice(0, 10);
    const weekEnd = addDays(ref, -1);
    const weekStart = addDays(ref, -7);
    const c = rangeCounts(habits, logs, weekStart, weekEnd);
    const total = c.due;
    const pct = c.due === 0 ? 0 : Math.round((c.done / c.due) * 100);
    scheduleAt(
      WEEKLY_ID,
      t("notifWeeklyTitle", lang),
      t("notifWeeklyBody", lang, { pct: String(pct), done: String(c.done), total: String(total) }),
      atStr
    );
  }

  if (prefs.monthlyOn) {
    const atStr = nextMonthStartsOne(today);
    const ref = atStr.slice(0, 10);
    const monthEnd = addDays(ref, -1);
    const monthStart = addDays(ref, -29);
    const pct = getCompletionRate(habits, logs, monthStart, monthEnd);
    const streak = getMaxCurrentStreak(habits, logs, monthEnd);
    scheduleAt(
      MONTHLY_ID,
      t("notifMonthlyTitle", lang),
      t("notifMonthlyBody", lang, { pct: String(pct), streak: String(streak) }),
      atStr
    );
  }
}