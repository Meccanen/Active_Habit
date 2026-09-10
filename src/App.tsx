import React, { useState, useEffect, useMemo, useRef, Fragment } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check, Settings, Palette, X, Plus, Trash2, Pencil, Flame, Calendar,
  BarChart3, Trophy, ChevronRight, ChevronLeft, ChevronDown, Zap, Shield,
  Mail, Lock, Star, Sparkles, Download, Upload, FileImage, FileText, Bell,
  Languages, Info,
} from "lucide-react";
import type { Habit, Challenge, ChallengeTemplate, Unit, AppState } from "./types";
import { t, detectLanguage, LangCode } from "./utils/i18n";
import {
  HABIT_EMOJIS, HABIT_COLORS, CHALLENGE_TEMPLATES, HABIT_SETS,
  loadState, saveState, addHabit, updateHabit, deleteHabit,
  toggleLog, createChallengeFromTemplate,
  deleteChallenge, toggleChallengeDay, setLogCount, recoverChallengeDays,
  getActiveHabits, habitLogFor, addHabitSet, isHabitSetAdded, resolveHabitName,
  type HabitSetTemplate,
} from "./services/habitService";
import {
  todayStr, addDays, getCurrentStreak, getBestStreak,
  getTodayStats, getCompletionRate, getLastNDays, getMonthCells,
  getChallengeProgress, getChallengeEndDate, isHabitComplete, isHabitDue,
  getMaxCurrentStreak, getHabitStreaks, getLongRangeDays,
  getAverageRate, getMostConsistent,
} from "./utils/habitHelper";
import { evaluateChallenges } from "./utils/habitHelper";
import {
  showBannerAd, onBannerHeightChange, unlockWithRewardedInterstitial,
  isRewardedUnlockedThisSession,
} from "./services/adMobService";
import { checkIsSupporter } from "./services/billingService";
import {
  exportBackupWithShare, readCurrentSettings, parseBackup,
  type BackupSettings,
} from "./services/backupService";
import { shareReportBlockAsImage, shareReportBlockAsPdf, type ReportBlockOptions } from "./services/reportShare";
import {
  scheduleNotifications, readNotifPrefs, writeNotifPrefs, checkNotificationPermission,
  type NotifPrefs,
} from "./services/notificationService";

export type FontScale = "normal" | "large" | "xlarge";

/**
 * ============================================================================
 * TEMALAR — Meccanen Hava Durumu uygulamasından BİREBİR taşındı.
 * Aynı 16 tema, aynı renk paleti, aynı Tailwind sınıfları.
 * ============================================================================
 */
export const THEMES = {
  gece: {
    label: "Gece Mavisi", preview: ["#020617","#0ea5e9","#818cf8"],
    bg: "bg-[#020617]", card: "bg-slate-900/40 border-slate-800/80",
    cardHover: "hover:border-slate-700/60", header: "border-slate-800/80",
    accent: "text-sky-400", accent2: "text-indigo-400", accent3: "text-amber-300",
    prayerActive: "bg-gradient-to-b from-amber-500/10 to-amber-500/25 border-amber-500/30 text-amber-300 ring-amber-500/20",
    clockGrad: "from-white to-slate-200", secColor: "text-sky-400",
    blob1: "bg-indigo-500/5", blob2: "bg-sky-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-amber-400", settingsCard: "bg-slate-900/95 border-slate-700",
  },
  alacakaranlik: {
    label: "Alacakaranlık", preview: ["#1a0a2e","#e879f9","#f59e0b"],
    bg: "bg-[#1a0a2e]", card: "bg-purple-950/30 border-purple-900/30",
    cardHover: "hover:border-purple-700/40", header: "border-purple-900/40",
    accent: "text-fuchsia-400", accent2: "text-purple-400", accent3: "text-amber-300",
    prayerActive: "bg-gradient-to-b from-fuchsia-500/10 to-fuchsia-500/25 border-fuchsia-500/30 text-fuchsia-300 ring-fuchsia-500/20",
    clockGrad: "from-fuchsia-100 to-purple-200", secColor: "text-fuchsia-400",
    blob1: "bg-fuchsia-500/5", blob2: "bg-purple-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-fuchsia-400", settingsCard: "bg-purple-950/95 border-purple-700",
  },
  orman: {
    label: "Orman Yeşili", preview: ["#051a0f","#34d399","#a3e635"],
    bg: "bg-[#051a0f]", card: "bg-emerald-950/30 border-emerald-900/30",
    cardHover: "hover:border-emerald-700/40", header: "border-emerald-900/40",
    accent: "text-emerald-400", accent2: "text-lime-400", accent3: "text-amber-300",
    prayerActive: "bg-gradient-to-b from-emerald-500/10 to-emerald-500/25 border-emerald-500/30 text-emerald-300 ring-emerald-500/20",
    clockGrad: "from-emerald-100 to-lime-200", secColor: "text-emerald-400",
    blob1: "bg-emerald-500/5", blob2: "bg-lime-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-lime-400", settingsCard: "bg-emerald-950/95 border-emerald-700",
  },
  altin: {
    label: "Altın Çöl", preview: ["#160d00","#f59e0b","#fb923c"],
    bg: "bg-[#160d00]", card: "bg-amber-950/30 border-amber-900/30",
    cardHover: "hover:border-amber-700/40", header: "border-amber-900/40",
    accent: "text-amber-400", accent2: "text-orange-400", accent3: "text-yellow-300",
    prayerActive: "bg-gradient-to-b from-amber-500/10 to-amber-500/25 border-amber-500/30 text-amber-300 ring-amber-500/20",
    clockGrad: "from-amber-100 to-orange-200", secColor: "text-amber-400",
    blob1: "bg-amber-500/5", blob2: "bg-orange-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-orange-400", settingsCard: "bg-amber-950/95 border-amber-700",
  },
  ramazan: {
    label: "Ramazan", preview: ["#0d0a1a","#c084fc","#fde68a"],
    bg: "bg-[#0d0a1a]", card: "bg-violet-950/30 border-violet-900/30",
    cardHover: "hover:border-violet-700/40", header: "border-violet-900/40",
    accent: "text-violet-300", accent2: "text-yellow-300", accent3: "text-rose-300",
    prayerActive: "bg-gradient-to-b from-violet-500/10 to-violet-500/25 border-violet-500/30 text-violet-200 ring-violet-500/20",
    clockGrad: "from-violet-100 to-yellow-200", secColor: "text-violet-300",
    blob1: "bg-violet-500/5", blob2: "bg-yellow-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-yellow-300", settingsCard: "bg-violet-950/95 border-violet-800",
  },
  kabe: {
    label: "Kâbe", preview: ["#0a0a0a","#d4af37","#ffffff"],
    bg: "bg-[#0a0a0a]", card: "bg-neutral-900/60 border-neutral-800/60",
    cardHover: "hover:border-neutral-700/50", header: "border-neutral-800/60",
    accent: "text-yellow-500", accent2: "text-yellow-300", accent3: "text-white",
    prayerActive: "bg-gradient-to-b from-yellow-500/10 to-yellow-500/20 border-yellow-500/30 text-yellow-300 ring-yellow-500/20",
    clockGrad: "from-yellow-200 to-white", secColor: "text-yellow-500",
    blob1: "bg-yellow-500/3", blob2: "bg-white/3",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-yellow-400", settingsCard: "bg-neutral-900/95 border-neutral-700",
  },
  turkuaz: {
    label: "Turkuaz Deniz", preview: ["#010f14","#06b6d4","#67e8f9"],
    bg: "bg-[#010f14]", card: "bg-cyan-950/30 border-cyan-900/30",
    cardHover: "hover:border-cyan-700/40", header: "border-cyan-900/40",
    accent: "text-cyan-400", accent2: "text-teal-400", accent3: "text-sky-200",
    prayerActive: "bg-gradient-to-b from-cyan-500/10 to-cyan-500/25 border-cyan-500/30 text-cyan-300 ring-cyan-500/20",
    clockGrad: "from-cyan-100 to-teal-200", secColor: "text-cyan-400",
    blob1: "bg-cyan-500/5", blob2: "bg-teal-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-teal-400", settingsCard: "bg-cyan-950/95 border-cyan-800",
  },
  bordo: {
    label: "Bordo Kadife", preview: ["#1a0008","#f43f5e","#fda4af"],
    bg: "bg-[#1a0008]", card: "bg-rose-950/30 border-rose-900/30",
    cardHover: "hover:border-rose-700/40", header: "border-rose-900/40",
    accent: "text-rose-400", accent2: "text-pink-400", accent3: "text-orange-300",
    prayerActive: "bg-gradient-to-b from-rose-500/10 to-rose-500/25 border-rose-500/30 text-rose-300 ring-rose-500/20",
    clockGrad: "from-rose-100 to-pink-200", secColor: "text-rose-400",
    blob1: "bg-rose-500/5", blob2: "bg-pink-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-pink-400", settingsCard: "bg-rose-950/95 border-rose-800",
  },
  gunes: {
    label: "Gün Batımı", preview: ["#1a0d00","#f97316","#fbbf24"],
    bg: "bg-[#1a0d00]", card: "bg-orange-950/30 border-orange-900/30",
    cardHover: "hover:border-orange-700/40", header: "border-orange-900/40",
    accent: "text-orange-400", accent2: "text-amber-300", accent3: "text-yellow-200",
    prayerActive: "bg-gradient-to-b from-orange-500/10 to-orange-500/25 border-orange-500/30 text-orange-300 ring-orange-500/20",
    clockGrad: "from-orange-100 to-amber-200", secColor: "text-orange-400",
    blob1: "bg-orange-500/5", blob2: "bg-amber-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-amber-300", settingsCard: "bg-orange-950/95 border-orange-800",
  },
  safir: {
    label: "Safir Gece", preview: ["#00051a","#3b82f6","#a5b4fc"],
    bg: "bg-[#00051a]", card: "bg-blue-950/30 border-blue-900/30",
    cardHover: "hover:border-blue-700/40", header: "border-blue-900/40",
    accent: "text-blue-400", accent2: "text-indigo-300", accent3: "text-sky-200",
    prayerActive: "bg-gradient-to-b from-blue-500/10 to-blue-500/25 border-blue-500/30 text-blue-300 ring-blue-500/20",
    clockGrad: "from-blue-100 to-indigo-200", secColor: "text-blue-400",
    blob1: "bg-blue-500/5", blob2: "bg-indigo-500/5",
    textPrimary: "text-slate-100", textSecondary: "text-slate-400", textMuted: "text-slate-500",
    hijriAccent: "text-indigo-300", settingsCard: "bg-blue-950/95 border-blue-800",
  },
  seher: {
    label: "Beyaz Seher", preview: ["#fefce8","#d97706","#92400e"],
    bg: "bg-[#fefce8]", card: "bg-white/70 border-amber-200/80",
    cardHover: "hover:border-amber-300/60", header: "border-amber-200/60",
    accent: "text-amber-700", accent2: "text-orange-600", accent3: "text-amber-900",
    prayerActive: "bg-gradient-to-b from-amber-400/20 to-amber-400/35 border-amber-500/40 text-amber-800 ring-amber-400/30",
    clockGrad: "from-amber-900 to-orange-800", secColor: "text-amber-600",
    blob1: "bg-amber-300/20", blob2: "bg-orange-200/20",
    textPrimary: "text-amber-950", textSecondary: "text-amber-800", textMuted: "text-amber-600",
    hijriAccent: "text-orange-700", settingsCard: "bg-white/98 border-amber-200",
  },
  gul: {
    label: "Gül Bahçesi", preview: ["#fff1f2","#e11d48","#9f1239"],
    bg: "bg-[#fff1f2]", card: "bg-white/70 border-rose-200/80",
    cardHover: "hover:border-rose-300/60", header: "border-rose-200/60",
    accent: "text-rose-600", accent2: "text-pink-600", accent3: "text-rose-800",
    prayerActive: "bg-gradient-to-b from-rose-400/20 to-rose-400/35 border-rose-500/40 text-rose-700 ring-rose-400/30",
    clockGrad: "from-rose-900 to-pink-800", secColor: "text-rose-500",
    blob1: "bg-rose-300/20", blob2: "bg-pink-200/20",
    textPrimary: "text-rose-950", textSecondary: "text-rose-700", textMuted: "text-rose-500",
    hijriAccent: "text-rose-700", settingsCard: "bg-white/98 border-rose-200",
  },
  nane: {
    label: "Nane Yeşili", preview: ["#f0fdf4","#16a34a","#14532d"],
    bg: "bg-[#f0fdf4]", card: "bg-white/70 border-green-200/80",
    cardHover: "hover:border-green-300/60", header: "border-green-200/60",
    accent: "text-green-700", accent2: "text-emerald-600", accent3: "text-green-900",
    prayerActive: "bg-gradient-to-b from-green-400/20 to-green-400/35 border-green-500/40 text-green-800 ring-green-400/30",
    clockGrad: "from-green-900 to-emerald-800", secColor: "text-green-600",
    blob1: "bg-green-300/20", blob2: "bg-emerald-200/20",
    textPrimary: "text-green-950", textSecondary: "text-green-700", textMuted: "text-green-500",
    hijriAccent: "text-emerald-700", settingsCard: "bg-white/98 border-green-200",
  },
  vaha: {
    label: "Yeşil Vaha", preview: ["#e6fbf5","#0f766e","#3730a3"],
    bg: "bg-[#e6fbf5]", card: "bg-white/70 border-teal-200/80",
    cardHover: "hover:border-teal-300/60", header: "border-teal-200/60",
    accent: "text-indigo-700", accent2: "text-teal-600", accent3: "text-indigo-900",
    prayerActive: "bg-gradient-to-b from-indigo-400/20 to-indigo-400/35 border-indigo-500/40 text-indigo-800 ring-indigo-400/30",
    clockGrad: "from-indigo-900 to-teal-800", secColor: "text-indigo-600",
    blob1: "bg-teal-300/20", blob2: "bg-indigo-200/20",
    textPrimary: "text-teal-950", textSecondary: "text-teal-800", textMuted: "text-teal-600",
    hijriAccent: "text-indigo-700", settingsCard: "bg-white/98 border-teal-200",
  },
  nilufer: {
    label: "Nilüfer Bahçesi", preview: ["#e6fbf5","#0f766e","#e11d48"],
    bg: "bg-[#e6fbf5]", card: "bg-white/70 border-teal-200/80",
    cardHover: "hover:border-teal-300/60", header: "border-teal-200/60",
    accent: "text-rose-600", accent2: "text-teal-600", accent3: "text-rose-800",
    prayerActive: "bg-gradient-to-b from-rose-400/20 to-rose-400/35 border-rose-500/40 text-rose-700 ring-rose-400/30",
    clockGrad: "from-rose-800 to-teal-800", secColor: "text-rose-500",
    blob1: "bg-teal-300/20", blob2: "bg-rose-200/20",
    textPrimary: "text-teal-950", textSecondary: "text-teal-800", textMuted: "text-teal-600",
    hijriAccent: "text-rose-600", settingsCard: "bg-white/98 border-teal-200",
  },
  lavanta: {
    label: "Lavanta Bahçesi", preview: ["#f5f3ff","#7c3aed","#b45309"],
    bg: "bg-[#f5f3ff]", card: "bg-white/70 border-violet-200/80",
    cardHover: "hover:border-violet-300/60", header: "border-violet-200/60",
    accent: "text-violet-700", accent2: "text-amber-600", accent3: "text-violet-900",
    prayerActive: "bg-gradient-to-b from-violet-400/20 to-violet-400/35 border-violet-500/40 text-violet-800 ring-violet-400/30",
    clockGrad: "from-violet-900 to-amber-800", secColor: "text-violet-600",
    blob1: "bg-violet-300/20", blob2: "bg-amber-200/20",
    textPrimary: "text-violet-950", textSecondary: "text-violet-800", textMuted: "text-violet-600",
    hijriAccent: "text-amber-700", settingsCard: "bg-white/98 border-violet-200",
  },
} as const;
export type ThemeKey = keyof typeof THEMES;
const isLight = (key: ThemeKey) => (["seher","gul","nane","vaha","nilufer","lavanta"] as ThemeKey[]).includes(key);

const APP_VERSION = "0.1.0";

/**
 * Reklam özellikleri:
 * - ADVANCED_CHARTS_REWARD: detaylı grafik raporunu kilitleyip ödüllü reklamla açacak
 *   (kullanıcıları grafik görmek için reklam izlemeye motive eder).
 * - SHOW_BANNER_ADS: ana ekranda altta banner reklam gösterecek.
 */
const ADVANCED_CHARTS_REWARD = true;
const SHOW_BANNER_ADS = true;

/** Habit rengi → tema sınıfı çevirici (accent ailesi temaya bağımlı). */
function colorClass(habit: Habit, th: typeof THEMES[ThemeKey]): string {
  switch (habit.color) {
    case "accent": return th.accent;
    case "accent2": return th.accent2;
    case "accent3": return th.accent3;
    default: return habit.color;
  }
}

/** Tema preview hex rengini "r, g, b" metnine çevirir (rgba() için). */
function hexToRgb(hex: string): string {
  const m = hex.replace("#", "");
  const bigint = parseInt(m, 16);
  return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
}

/** Rapor lejant ögesi: renk kutusu + etiket (+ isteğe bağlı değer). */
function LegendItem({ color, label, value }: { color: string; label: string; value?: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded" style={{ background: color }} />
      <span className="text-[10px] text-slate-400">{label}{value ? ` · ${value}` : ""}</span>
    </span>
  );
}

/** Haftalık habit'ler için gün noktaları (günler "weekly" dalında tanımlıdır). */
function renderWeekdayDots(h: Habit, cc: string) {
  const freq = h.frequency;
  if (freq.kind !== "weekly") return null;
  const days = freq.days;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5, 6, 0].map((d) => (
        <span key={d} className={`w-1.5 h-1.5 rounded-full ${days.includes(d) ? cc + " bg-current" : "bg-black/15"}`} />
      ))}
    </div>
  );
}

/**
 * İkon alanına yazılan metni tek bir "grapheme cluster"a indirir (tek emoji —
 * aile/bayrak gibi çok kod noktalı emojiler de tek karakter sayılır). Çoklu
 * emoji girişi görsel alanı taşırdığı için 1 parça fazlasıyla yeterlidir.
 */
function firstGrapheme(input: string): string {
  const v = input.trim();
  if (!v) return "";
  try {
    for (const s of new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(v)) {
      return s.segment;
    }
    return "";
  } catch {
    return Array.from(v)[0] ?? "";
  }
}

/**
 * Habit adını görüntüler. Çözümleme ortak habitService yardımcısında;
 * paket/sablon/paket-challenge adları dile göre çevrilir, özel adlar aynen kalır.
 */
function habitDisplayName(h: Habit, lang: LangCode): string {
  return resolveHabitName(h, lang);
}

/**
 * Challenge adını gösterir. Şablon challenge'ları templateId → nameKey
 * üzerinden çevrilir (dil değişince otomatik güncellenir); custom
 * challenge'lar kendi kullanıcı adını korur.
 */
function challengeDisplayName(c: Challenge, lang: LangCode): string {
  if (c.templateId !== "custom") {
    const tpl = CHALLENGE_TEMPLATES.find((t) => t.id === c.templateId);
    if (tpl) return t(tpl.nameKey, lang);
  }
  const isKey = c.name.startsWith("set") || c.name.startsWith("template") || c.name.startsWith("pack");
  return isKey ? t(c.name, lang) : c.name;
}

// ============================================================================
// GENEL MODAL ÇERÇEVESİ
// ============================================================================
function Modal({ children, onClose, th }: {
  children: React.ReactNode;
  onClose: () => void;
  th: typeof THEMES[ThemeKey];
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 px-3 pb-3 sm:pt-8 sm:px-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`relative w-full max-w-lg rounded-[28px] border ${th.settingsCard} max-h-[92vh] flex flex-col`}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose, th }: { title: string; onClose: () => void; th: typeof THEMES[ThemeKey] }) {
  return (
    <div className={`flex items-center justify-between px-5 py-4 border-b ${th.header}`}>
      <h2 className={`font-semibold text-lg ${th.textPrimary}`}>{title}</h2>
      <button onClick={onClose} className={`p-2 rounded-full ${th.cardHover} ${th.textSecondary}`}><X size={18} /></button>
    </div>
  );
}

// ============================================================================
// AYARLAR PANELİ — Tema / Dil / Bildirimler / Hakkında (Destekçi Rozeti dahil)
// ============================================================================
function Toggle({ on, onClick, th }: {
  on: boolean; onClick: () => void; th: typeof THEMES[ThemeKey];
}) {
  return (
    <button role="switch" aria-checked={on} onClick={onClick}
      className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${on ? "" : "bg-slate-400/40"}`}
      style={on ? { backgroundColor: th.preview[1] } : undefined}>
      <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

function SettingsPanel({
  theme, setTheme, onClose, th, lang, setLang, initialTab,
  setFontScale, setState, onNotify, notifPrefs, setNotifPrefs,
}: {
  theme: ThemeKey; setTheme: (k: ThemeKey) => void;
  onClose: () => void; th: typeof THEMES[ThemeKey];
  lang: LangCode; setLang: (l: LangCode) => void;
  setFontScale: (f: FontScale) => void;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onNotify: (msg: string) => void;
  initialTab?: "tema" | "dil" | "yedekleme" | "bildirim" | "hakkinda";
  notifPrefs: NotifPrefs;
  setNotifPrefs: (p: NotifPrefs) => void;
}) {
  const [tab, setTab] = useState<"tema" | "dil" | "yedekleme" | "bildirim" | "hakkinda">(initialTab || "tema");
  const [isSupporter, setIsSupporter] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingRestore, setPendingRestore] = useState<{ state: AppState; settings: BackupSettings } | null>(null);
  const [showBackupOptions, setShowBackupOptions] = useState(false);
  const [notifPermOk, setNotifPermOk] = useState(true);
  useEffect(() => { checkIsSupporter().then(setIsSupporter); }, []);
  useEffect(() => {
    if (tab !== "bildirim") return;
    let alive = true;
    void checkNotificationPermission().then((ok) => {
      if (alive) setNotifPermOk(ok);
    });
    return () => { alive = false; };
  }, [tab]);

  const openBackupOptions = () => setShowBackupOptions(true);

  const doBackupShare = async () => {
    setShowBackupOptions(false);
    const state = loadState();
    try {
      await exportBackupWithShare(state, readCurrentSettings());
      onNotify(t("backupSuccess", lang));
    } catch {
      onNotify(t("backupError", lang));
    }
  };

  const onRestorePick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const onFileSelected = (file: File | undefined) => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseBackup(String(reader.result ?? ""));
      if (!parsed) { onNotify(t("restoreError", lang)); return; }
      setPendingRestore(parsed);
    };
    reader.readAsText(file);
  };

  const applyRestore = () => {
    if (!pendingRestore) return;
    const { state, settings } = pendingRestore;
    setState(state);
    window.localStorage.setItem("mht_theme", settings.theme);
    window.localStorage.setItem("mht_lang", settings.lang);
    window.localStorage.setItem("mht_font_scale", settings.fontScale);
    setTheme(settings.theme as ThemeKey);
    setLang(settings.lang as LangCode);
    setFontScale(settings.fontScale as FontScale);
    setPendingRestore(null);
    onNotify(t("restoreSuccess", lang));
  };

  const LANGUAGES: { code: LangCode; label: string }[] = [
    { code: "tr", label: "Türkçe" }, { code: "en", label: "English" },
    { code: "de", label: "Deutsch" }, { code: "ar", label: "العربية" },
    { code: "ur", label: "اردو" },
  ];

  return (
    <>
    <Modal onClose={onClose} th={th}>
      <ModalHeader title={t("settings", lang)} onClose={onClose} th={th} />
      <div className={`rounded-2xl border p-2 mx-4 mt-4 ${th.card}`}>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["tema", Palette], ["dil", Languages], ["bildirim", Bell],
            ["yedekleme", Download], ["hakkinda", Info],
          ] as const).map(([tb, Icon]) => {
            const active = tab === tb;
            const label = tb === "tema" ? t("themeTab", lang) : tb === "dil" ? t("language", lang) : tb === "bildirim" ? t("notifTab", lang) : tb === "yedekleme" ? t("backupTab", lang) : t("about", lang);
            return (
              <button key={tb} onClick={() => setTab(tb)} aria-selected={active}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition active:scale-[0.98] ${tb === "hakkinda" ? "col-span-2" : ""} ${active ? th.textPrimary : th.textMuted}`}
                style={active ? { borderColor: th.preview[1], backgroundColor: th.preview[1] + "26" } : { borderColor: "transparent" }}>
                <Icon size={18} className={`shrink-0 ${active ? th.accent : ""}`} />
                <span className={`text-xs font-medium leading-tight text-center ${active ? th.accent : ""}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-5 space-y-4">
        {tab === "tema" && (
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, cardTh]) => (
              <button key={key} onClick={() => setTheme(key)}
                className={`relative rounded-2xl border p-3 text-left transition ${cardTh.card} ${cardTh.cardHover} ${theme === key ? "ring-2 ring-offset-2 ring-offset-transparent " + cardTh.accent : ""}`}>
                <div className="flex gap-1 mb-2">
                  {cardTh.preview.map((c, i) => (
                    <span key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ background: c }} />
                  ))}
                </div>
                <div className={`text-xs font-medium ${cardTh.textPrimary}`}>{t(`theme_${key}`, lang)}</div>
                {theme === key && <Check size={14} className={`absolute top-2 right-2 ${cardTh.accent}`} />}
              </button>
            ))}
          </div>
        )}

        {tab === "dil" && (
          <div className="space-y-2">
            <p className={`text-xs uppercase tracking-wide ${th.textMuted}`}>{t("language", lang)}</p>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition ${th.card} ${th.cardHover} ${lang === l.code ? th.accent + " ring-2 ring-offset-2 ring-offset-transparent " + th.accent : th.textMuted}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "bildirim" && (
          <div className="space-y-4">
            {!notifPermOk && (
              <div className={`rounded-2xl border p-4 ${th.card}`}>
                <p className={`text-xs leading-relaxed text-amber-500`}>{t("notifPermissionDenied", lang)}</p>
              </div>
            )}
            <div className={`rounded-2xl border p-4 ${th.card}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <Bell size={16} className={th.accent} />
                  <h3 className={`text-sm font-semibold ${th.textPrimary}`}>{t("notifCheckinTitle", lang)}</h3>
                </div>
                <Toggle on={notifPrefs.checkinOn} onClick={() => setNotifPrefs({ ...notifPrefs, checkinOn: !notifPrefs.checkinOn })} th={th} />
              </div>
              <p className={`text-xs leading-relaxed mb-3 ${th.textSecondary}`}>{t("notifCheckinDesc", lang)}</p>
              <div className={`flex items-center gap-2 p-2 rounded-xl border ${th.card}`}>
                <p className={`text-xs ${th.textMuted}`}>{t("notifTime", lang)}</p>
                <input type="time" value={notifPrefs.checkinTime}
                  disabled={!notifPrefs.checkinOn}
                  onChange={(e) => e.target.value && setNotifPrefs({ ...notifPrefs, checkinTime: e.target.value })}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-sm outline-none bg-transparent disabled:opacity-40 ${th.card} ${th.textPrimary}`} />
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${th.card}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className={th.accent2} />
                  <h3 className={`text-sm font-semibold ${th.textPrimary}`}>{t("notifWeeklyTitle", lang)}</h3>
                </div>
                <Toggle on={notifPrefs.weeklyOn} onClick={() => setNotifPrefs({ ...notifPrefs, weeklyOn: !notifPrefs.weeklyOn })} th={th} />
              </div>
              <p className={`text-xs leading-relaxed ${th.textSecondary}`}>{t("notifWeeklyDesc", lang)}</p>
            </div>

            <div className={`rounded-2xl border p-4 ${th.card}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className={th.accent2} />
                  <h3 className={`text-sm font-semibold ${th.textPrimary}`}>{t("notifMonthlyTitle", lang)}</h3>
                </div>
                <Toggle on={notifPrefs.monthlyOn} onClick={() => setNotifPrefs({ ...notifPrefs, monthlyOn: !notifPrefs.monthlyOn })} th={th} />
              </div>
              <p className={`text-xs leading-relaxed ${th.textSecondary}`}>{t("notifMonthlyDesc", lang)}</p>
            </div>
          </div>
        )}

        {tab === "yedekleme" && (
          <div className="space-y-4">
            <div className={`rounded-2xl border p-4 ${th.card}`}>
              <div className="flex items-center gap-2 mb-1">
                <Download size={16} className={th.accent} />
                <h3 className={`text-sm font-semibold ${th.textPrimary}`}>{t("backupTitle", lang)}</h3>
              </div>
              <p className={`text-xs leading-relaxed mb-3 ${th.textSecondary}`}>{t("backupDesc", lang)}</p>
              <button onClick={openBackupOptions}
                className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold ${th.card} ${th.accent} active:scale-[0.98] transition`}>
                {t("backupNow", lang)}
              </button>
            </div>

            <div className={`rounded-2xl border p-4 ${th.card}`}>
              <div className="flex items-center gap-2 mb-1">
                <Upload size={16} className={th.accent2} />
                <h3 className={`text-sm font-semibold ${th.textPrimary}`}>{t("restoreTitle", lang)}</h3>
              </div>
              <p className={`text-xs leading-relaxed mb-3 ${th.textSecondary}`}>{t("restoreDesc", lang)}</p>
              <button onClick={onRestorePick}
                className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold ${th.card} ${th.accent2} active:scale-[0.98] transition`}>
                {t("restoreFromFile", lang)}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => onFileSelected(e.target.files?.[0])}
              />
            </div>

            <p className={`text-xs leading-relaxed ${th.textMuted}`}>{t("backupNote", lang)}</p>
          </div>
        )}

        {tab === "hakkinda" && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className={`font-semibold ${th.textPrimary}`}>{t("appName", lang)}</h3>
              <p className={`text-xs ${th.textMuted}`}>v{APP_VERSION}</p>
            </div>

            <div className={`rounded-2xl border p-4 space-y-3 ${th.card}`}>
              <p className={`text-sm leading-relaxed ${th.textSecondary}`}>{t("aboutDescription", lang)}</p>
            </div>

            <div className={`rounded-2xl border p-4 space-y-3 ${th.card}`}>
              <h4 className={`font-medium text-sm ${th.textPrimary}`}>{t("aboutFeaturesTitle", lang)}</h4>
              <ul className="space-y-2">
                {(["aboutFeature1", "aboutFeature2", "aboutFeature3", "aboutFeature4"] as const).map((key) => (
                  <li key={key} className="flex items-start gap-2">
                    <Check size={15} className={`mt-0.5 shrink-0 ${th.accent}`} />
                    <span className={`text-xs leading-relaxed ${th.textSecondary}`}>{t(key, lang)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`rounded-2xl border p-4 space-y-3 ${th.card}`}>
              {isSupporter && (
                <div className={`flex items-center gap-2 text-xs font-semibold ${th.accent}`}>
                  <Star size={15} />
                  {t("adFree", lang)}
                </div>
              )}
              <a href="https://meccanen.github.io/Active_Habit/privacy-policy-en.html" target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-2 text-xs font-medium ${th.accent}`}>
                <Shield size={15} />
                {t("aboutPrivacyLink", lang)}
              </a>
              <a href="mailto:meccanen@meccanen.xyz"
                className={`flex items-center gap-2 text-xs ${th.textSecondary}`}>
                <Mail size={15} />
                {t("aboutContact", lang)}
              </a>
            </div>

            <p className={`text-center text-xs ${th.textMuted}`}>{t("aboutFooter", lang)}</p>
          </div>
        )}
      </div>
    </Modal>

    {pendingRestore && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-fadeIn">
        <div className={`w-full max-w-sm rounded-[24px] border p-5 ${th.settingsCard}`}>
          <h3 className={`font-semibold text-base mb-2 ${th.textPrimary}`}>{t("restoreConfirmTitle", lang)}</h3>
          <p className={`text-xs leading-relaxed mb-4 ${th.textSecondary}`}>{t("restoreConfirmDesc", lang)}</p>
          <div className="flex gap-2">
            <button onClick={() => setPendingRestore(null)}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold ${th.card} ${th.textMuted}`}>
              {t("cancel", lang)}
            </button>
            <button onClick={applyRestore}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold ${th.card} ${th.accent}`}>
              {t("restoreConfirmOk", lang)}
            </button>
          </div>
        </div>
      </div>
    )}

    {showBackupOptions && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-fadeIn">
        <div className={`w-full max-w-sm rounded-[24px] border p-5 ${th.settingsCard}`}>
          <h3 className={`font-semibold text-base mb-1 ${th.textPrimary}`}>{t("backupOptionsTitle", lang)}</h3>
          <p className={`text-xs leading-relaxed mb-4 ${th.textSecondary}`}>{t("backupOptionsDesc", lang)}</p>
          <div className="flex flex-col gap-2">
            <button onClick={doBackupShare}
              className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold ${th.card} ${th.accent} active:scale-[0.98] transition`}>
              {t("backupOptionShare", lang)}
            </button>
            <button onClick={() => setShowBackupOptions(false)}
              className={`w-full rounded-xl border px-4 py-2.5 text-xs font-semibold ${th.card} ${th.textMuted} active:scale-[0.98] transition`}>
              {t("cancel", lang)}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ============================================================================
// İLERLEME HALKASI
// ============================================================================
function ProgressRing({ pct, size = 92, stroke = 9, className }: {
  pct: number; size?: number; stroke?: number; className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, pct) / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none"
        stroke="currentColor" className="opacity-15" />
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none"
        stroke="currentColor" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        className={`transition-all duration-700 ${className || ""}`} />
    </svg>
  );
}

// ============================================================================
// ALIŞKANLIK EKLEME / DÜZENLEME MODALI (3 adım)
// ============================================================================
function HabitModal({ existing, onSave, onClose, th, lang, inline }: {
  existing: Habit | null;
  onSave: (h: { name: string; emoji: string; color: string; frequency: Habit["frequency"]; targetPerDay: number; unit: Unit }) => void;
  onClose: () => void; th: typeof THEMES[ThemeKey]; lang: LangCode;
  inline?: boolean;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(existing ? habitDisplayName(existing, lang) : "");
  const [emoji, setEmoji] = useState(existing?.emoji || HABIT_EMOJIS[0]);
  const [color, setColor] = useState(existing?.color || "accent");
  const [freqKind, setFreqKind] = useState<"daily" | "weekly">(existing?.frequency.kind || "daily");
  const [days, setDays] = useState<number[]>(
    existing?.frequency.kind === "weekly" ? existing.frequency.days : [1, 2, 3, 4, 5]
  );
  const [target, setTarget] = useState(String(existing?.targetPerDay || 1));
  const [unit, setUnit] = useState<Unit>(existing?.unit || "count");

  const canNext = step === 1 ? name.trim().length > 0 : true;

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  };

  const submit = () => {
    onSave({
      name: name.trim(),
      emoji,
      color,
      frequency: freqKind === "daily" ? { kind: "daily" } : { kind: "weekly", days: days.length ? days : [1] },
      targetPerDay: Math.max(1, parseInt(target, 10) || (unit === "minutes" ? 30 : 1)),
      unit,
    });
    if (inline) onClose();
  };

  const weekdayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const weekdayDayValue: number[] = [1, 2, 3, 4, 5, 6, 0];

  const dots = (
    <div className="flex items-center justify-center gap-1.5">
      {[1, 2, 3].map((s) => (
        <span key={s} className={`h-1.5 rounded-full transition-all ${s === step ? `w-8 ${th.accent} bg-current` : "w-4 bg-black/15"}`} />
      ))}
    </div>
  );

  const steps = (
    <>
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("habitName", lang)}</p>
              <input value={name} onChange={(e) => setName(e.target.value)}
                autoFocus placeholder={t("habitNamePh", lang)}
                className={`w-full px-4 py-3 rounded-xl border bg-transparent text-sm outline-none ${th.card} ${th.textPrimary}`} />
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("chooseIcon", lang)}</p>
              <div className="grid grid-cols-6 gap-2">
                {HABIT_EMOJIS.map((e) => (
                  <button key={e} onClick={() => setEmoji(e)}
                    className={`h-12 rounded-xl border text-xl transition ${emoji === e ? th.accent + " ring-2 ring-offset-2 " : th.card + " " + th.cardHover}`}>
                    {e}
                  </button>
                ))}
                <button onClick={() => setEmoji("")}
                  className={`h-12 rounded-xl border text-xs font-bold transition ${emoji === "" ? th.accent + " ring-2 ring-offset-2 " + th.accent : th.card + " " + th.cardHover}`}>
                  {t("iconNone", lang)}
                </button>
              </div>
              <div className="mt-3">
                <p className={`text-xs mb-1.5 ${th.textMuted}`}>{t("iconCustom", lang)}</p>
                <input type="text" value={emoji && !HABIT_EMOJIS.includes(emoji) ? emoji : ""}
                  onChange={(e) => setEmoji(firstGrapheme(e.target.value))}
                  placeholder={t("iconCustomPh", lang)}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm outline-none ${th.card} ${th.textPrimary}`} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("frequency", lang)}</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setFreqKind("daily")}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition ${freqKind === "daily" ? th.accent + " ring-2 ring-offset-2 " + th.accent : th.card + " " + th.cardHover}`}>
                  {t("frequencyDaily", lang)}
                </button>
                <button onClick={() => setFreqKind("weekly")}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition ${freqKind === "weekly" ? th.accent + " ring-2 ring-offset-2 " + th.accent : th.card + " " + th.cardHover}`}>
                  {t("frequencyWeekly", lang)}
                </button>
              </div>
            </div>

            {freqKind === "weekly" && (
              <div>
                <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("selectDays", lang)}</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {weekdayKeys.map((k, i) => (
                    <button key={k} onClick={() => toggleDay(weekdayDayValue[i])}
                      className={`h-10 rounded-xl text-xs font-semibold transition ${days.includes(weekdayDayValue[i]) ? th.accent + " bg-current/10 ring-1 " : th.card + " " + th.cardHover}`}>
                      {t(k, lang)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("targetPerDay", lang)}</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => setUnit("count")}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${unit === "count" ? th.accent + " ring-2 ring-offset-2 " + th.accent : th.card + " " + th.cardHover}`}>
                  {t("unitCount", lang)}
                </button>
                <button onClick={() => setUnit("minutes")}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${unit === "minutes" ? th.accent + " ring-2 ring-offset-2 " + th.accent : th.card + " " + th.cardHover}`}>
                  ⏱ {t("unitMinutes", lang)}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input type="text" inputMode="numeric" pattern="[0-9]*" min={1} max={unit === "minutes" ? 1440 : 99} value={target}
                  onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))}
                  className={`w-24 px-4 py-3 rounded-xl border bg-transparent text-sm outline-none ${th.card} ${th.textPrimary}`} />
                <span className={`text-sm ${th.textSecondary}`}>{unit === "minutes" ? t("minutesPerDay", lang) : t("timesPerDay", lang)}</span>
              </div>
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("chooseIcon", lang)}</p>
              <div className="grid grid-cols-4 gap-2">
                {HABIT_COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`h-10 rounded-xl border flex items-center justify-center transition ${color === c ? "ring-2 ring-offset-2 " + c : th.card + " " + th.cardHover}`}>
                    <span className={`inline-block w-5 h-5 rounded-full ${c} bg-current`} />
                  </button>
                ))}
              </div>
            </div>
            <div className={`rounded-2xl border p-4 ${th.card}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${th.textPrimary}`}>{name || t("habitName", lang)}</p>
                  <p className={`text-xs ${th.textMuted}`}>
                    {freqKind === "daily" ? t("daily", lang) : `${days.length} ${t("weekly", lang).toLowerCase()}`} · {Math.max(1, parseInt(target, 10) || 1)} {unit === "minutes" ? t("minutes", lang) : t("times", lang)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );

  const footer = (
    <>
      {step < 3 ? (
        <button onClick={() => step === 1 && !canNext ? null : setStep(step + 1)}
          disabled={step === 1 && !canNext}
          className={`w-full py-3 rounded-xl text-sm font-bold transition ${th.accent} border ${th.card} ${step === 1 && !canNext ? "opacity-40" : ""}`}>
          {t("next", lang)}
        </button>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setStep(2)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border ${th.card} ${th.textSecondary}`}>
            {t("back", lang)}
          </button>
          <button onClick={submit}
            className={`flex-[2] py-3 rounded-xl text-sm font-bold border ${th.card} ${th.accent}`}>
            {t("save", lang)}
          </button>
        </div>
      )}
    </>
  );

  return inline ? (
    <div className="space-y-4">
      {dots}
      {steps}
      {footer}
    </div>
  ) : (
    <Modal onClose={onClose} th={th}>
      <ModalHeader title={existing ? t("editHabit", lang) : t("newHabit", lang)} onClose={onClose} th={th} />
      <div className="overflow-y-auto flex-1 p-5 space-y-5">
        {dots}
        {steps}
      </div>
      <div className={`p-5 border-t ${th.header}`}>
        {footer}
      </div>
    </Modal>
  );
}

// ============================================================================
// ŞABLON CHALLENGE ADI MODALI
// ============================================================================
function TemplateNameModal({ template, onSave, onClose, th, lang }: {
  template: ChallengeTemplate;
  onSave: (name: string, unit: Unit, targetPerDay: number) => void;
  onClose: () => void; th: typeof THEMES[ThemeKey]; lang: LangCode;
}) {
  const [name, setName] = useState(t(template.nameKey, lang));
  const isDays = template.kind !== "pack";
  const [unit, setUnit] = useState<Unit>(isDays ? "count" : template.habitUnit ?? "count");
  const [target, setTarget] = useState(isDays ? "1" : String(template.targetPerDay));

  const switchUnit = (next: Unit) => {
    setUnit(next);
    setTarget((cur) => {
      const seen = /^\d+$/.test(cur) ? parseInt(cur, 10) : 0;
      if (next === "minutes" && seen === 1) return "30";
      if (next === "count" && seen === 30) return "1";
      return cur;
    });
  };

  const parsedTarget = Math.max(1, parseInt(target, 10) || (unit === "minutes" ? 30 : 1));

  const submit = () => {
    if (isDays) onSave(name, unit, parsedTarget);
    else onSave(name, template.habitUnit ?? "count", template.targetPerDay);
  };

  return (
    <Modal onClose={onClose} th={th}>
      <ModalHeader title={t("newChallenge", lang)} onClose={onClose} th={th} />
      <div className="overflow-y-auto flex-1 p-5 space-y-4">
        <div className={`rounded-2xl border p-4 ${th.card}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{template.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${th.textPrimary}`}>{t(template.nameKey, lang)}</p>
              <p className={`text-xs mt-0.5 ${th.textMuted}`}>
                {t(`days${template.days}`, lang)} · {parsedTarget} {unit === "minutes" ? t("minutesPerDay", lang) : t("timesPerDay", lang)}
              </p>
            </div>
          </div>
        </div>

        {isDays && (
          <div className={`rounded-2xl border p-4 ${th.card}`}>
            <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("dailyGoal", lang)}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => switchUnit("count")}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${unit === "count" ? th.accent + " ring-2 ring-offset-2 " + th.accent : th.card + " " + th.cardHover}`}>
                {t("unitCount", lang)}
              </button>
              <button onClick={() => switchUnit("minutes")}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${unit === "minutes" ? th.accent + " ring-2 ring-offset-2 " + th.accent : th.card + " " + th.cardHover}`}>
                ⏱ {t("unitMinutes", lang)}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={target}
                onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))}
                className={`w-24 px-4 py-3 rounded-xl border bg-transparent text-sm outline-none ${th.card} ${th.textPrimary}`} />
              <span className={`text-sm ${th.textSecondary}`}>{unit === "minutes" ? t("minutesPerDay", lang) : t("timesPerDay", lang)}</span>
            </div>
          </div>
        )}

        <div>
          <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("challengeName", lang)}</p>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60}
            placeholder={t(template.nameKey, lang)}
            className={`w-full px-4 py-3 rounded-xl border bg-transparent text-sm outline-none ${th.card} ${th.textPrimary}`} />
          <p className={`text-xs mt-1.5 ${th.textMuted}`}>{t("challengeNameHint", lang)}</p>
        </div>
      </div>
      <div className={`p-5 border-t ${th.header}`}>
        <button onClick={submit}
          className={`w-full py-3 rounded-xl text-sm font-bold border ${th.card} ${th.accent}`}>
          {t("startChallenge", lang)}
        </button>
      </div>
    </Modal>
  );
}

// ============================================================================
// CHALLENGE DETAY MODALI
// ============================================================================
function ChallengeDetailModal({ challenge, habit, logs, today, onToggle, onCancel, onClose, onRecover, recovering, th, lang }: {
  challenge: Challenge;
  habit: Habit | undefined;
  logs: Parameters<typeof habitLogFor>[1];
  today: string;
  onToggle: (date: string) => void;
  onCancel: () => void;
  onClose: () => void;
  onRecover: (id: string) => void;
  recovering: boolean; th: typeof THEMES[ThemeKey]; lang: LangCode;
}) {
  const [confirming, setConfirming] = useState(false);
  const progress = habit
    ? getChallengeProgress(challenge, habit, logs, today)
    : { doneDays: 0, leftDays: challenge.totalDays, pct: 0 };
  const end = getChallengeEndDate(challenge);
  const cc = habit ? colorClass(habit, th) : th.accent;

  return (
    <Modal onClose={onClose} th={th}>
      <ModalHeader title={challengeDisplayName(challenge, lang)} onClose={onClose} th={th} />
      <div className="overflow-y-auto flex-1 p-5 space-y-4">
        <div className={`rounded-2xl border p-4 ${th.card}`}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{challenge.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${th.textPrimary}`}>{challengeDisplayName(challenge, lang)}</p>
              <p className={`text-xs mt-0.5 ${th.textMuted}`}>
                {t("startsOn", lang)}: {challenge.startDate} · {t("endsOn", lang)}: {end}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className={th.textSecondary}>{t("dayNumber", lang, { n: String(Math.min(challenge.totalDays, progress.doneDays + 1)) })}</span>
              <span className={th.textMuted}>{t(progress.leftDays === 1 ? "dayLeft" : "daysLeft", lang, { n: String(progress.leftDays) })}</span>
            </div>
            <div className="h-2.5 rounded-full bg-black/15 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${cc} bg-current`} style={{ width: `${progress.pct}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className={cc}>{progress.doneDays}/{challenge.totalDays}</span>
              <span className={th.textMuted}>%{progress.pct}</span>
            </div>
          </div>
        </div>

        {challenge.needsRecovery && (
          <div className={`rounded-2xl border-2 border-orange-500/40 bg-orange-500/10 p-4 space-y-3`}>
            <div className="flex items-start gap-2">
              <Zap size={18} className="text-orange-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-orange-500">{t("recoveryTitle", lang)}</p>
                <p className="text-xs leading-relaxed text-orange-500">
                  {t("recoveryDesc1", lang, { date: challenge.recoveryTargetDate ?? "" })} {t("recoveryDesc2", lang)}
                </p>
              </div>
            </div>
            <button onClick={() => onRecover(challenge.id)} disabled={recovering}
              className={`w-full py-2.5 rounded-xl text-sm font-bold border border-orange-500/50 text-orange-500 transition active:scale-[0.98] ${recovering ? "opacity-50" : ""}`}>
              {recovering ? "…" : t("recoveryBtn", lang)}
            </button>
          </div>
        )}

        {harvestDisclaimer(challenge, habit, logs, today) && (
          <div className={`rounded-2xl border-2 border-red-500/40 bg-red-500/10 p-4 flex items-start gap-2`}>
            <Trophy size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-red-500">{t("challengeWarn", lang)}</p>
          </div>
        )}

        {habit && (
          <div>
            <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("todayTitle", lang)}</p>
            <button onClick={() => onToggle(today)}
              className={`w-full flex items-center gap-3 rounded-2xl border p-4 transition active:scale-[0.98] ${th.card} ${th.cardHover}`}>
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center border transition ${colorClass(habit, th)} ${isHabitComplete(habit, logs, today) ? "bg-current" : "bg-transparent"}`}>
                {isHabitComplete(habit, logs, today) && <Check size={18} className="text-slate-950" />}
              </span>
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-sm font-semibold truncate ${th.textPrimary}`}>{habit.emoji} {habitDisplayName(habit, lang)}</p>
                <p className={`text-xs ${th.textMuted}`}>
                  {habitLogFor(habit, logs, today).count}/{habit.targetPerDay}
                </p>
              </div>
            </button>
          </div>
        )}

        {confirming ? (
          <div className={`rounded-2xl border p-4 space-y-3 ${th.card}`}>
            <p className={`text-sm ${th.textPrimary}`}>{t("cancelChallengeDesc", lang)}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)} className={`flex-1 py-2.5 rounded-xl text-sm border ${th.card} ${th.textSecondary}`}>
                {t("cancel", lang)}
              </button>
              <button onClick={onCancel} className={`flex-1 py-2.5 rounded-xl text-sm border-2 border-red-500/40 text-red-500`}>
                {t("cancelChallengeConfirm", lang)}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className={`w-full py-2.5 rounded-xl text-sm border border-red-500/30 text-red-500/80`}>
            {t("cancelChallenge", lang)}
          </button>
        )}
      </div>
    </Modal>
  );
}

/** Challenge'ın bugünü kaçırılırsa sıfırlanma riski olup olmadığını gösterir. */
function harvestDisclaimer(c: Challenge, habit: Habit | undefined, logs: Parameters<typeof habitLogFor>[1], today: string): boolean {
  if (!habit || c.status !== "active") return false;
  if (today < c.startDate) return false;
  return !isHabitComplete(habit, logs, today);
}

// ============================================================================
// TAKVİM MODALI
// ============================================================================
function CalendarModal({ habits, logs, onToggle, onClose, th, lang }: {
  habits: Habit[];
  logs: Parameters<typeof habitLogFor>[1];
  onToggle: (habitId: string, date: string) => void;
  onClose: () => void; th: typeof THEMES[ThemeKey]; lang: LangCode;
}) {
  const today = todayStr();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selected, setSelected] = useState<string | null>(today);

  const intlLocale = { tr: "tr-TR", en: "en-US", de: "de-DE", ar: "ar-SA", ur: "ur-PK" }[lang];
  const monthLabel = new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));

  const cells = useMemo(() => getMonthCells(year, month, habits, logs, today), [year, month, habits, logs, today]);
  const weekKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const active = getActiveHabits({ habits, logs, challenges: [] });

  const shift = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setYear(y); setMonth(m);
  };

  return (
    <Modal onClose={onClose} th={th}>
      <ModalHeader title={t("calendarTitle", lang)} onClose={onClose} th={th} />
      <div className="flex items-center justify-between px-5 pt-4">
        <button onClick={() => shift(-1)} className={`p-2 rounded-full border ${th.card} ${th.textSecondary}`}><ChevronLeft size={18} /></button>
        <p className={`font-semibold text-sm ${th.textPrimary}`}>{monthLabel}</p>
        <button onClick={() => shift(1)} className={`p-2 rounded-full border ${th.card} ${th.textSecondary}`}><ChevronRight size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekKeys.map((k) => (
            <span key={k} className={`text-[10px] font-semibold uppercase ${th.textMuted}`}>{t(k, lang)}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            const complete = cell.due > 0 && cell.completed === cell.due;
            const partial = cell.due > 0 && cell.completed > 0 && cell.completed < cell.due;
            return (
              <button key={i} onClick={() => setSelected(cell.date)}
                className={`relative h-11 rounded-xl border text-xs font-semibold transition
                  ${!cell.inMonth ? "opacity-30 " + th.card : th.card + " " + th.cardHover}
                  ${cell.isToday ? th.accent + " ring-2 ring-offset-2 " : ""}
                  ${selected === cell.date ? "ring-1 " + th.accent : ""}`}>
                {Number(cell.date.slice(8, 10))}
                {cell.inMonth && cell.due > 0 && (
                  <span className={`absolute bottom-1 left-0 right-0 flex justify-center gap-0.5`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${complete ? th.accent + " bg-current" : partial ? "bg-amber-400" : "bg-black/15"}`} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className={`text-[11px] text-center ${th.textMuted}`}>{t("tapDayHint", lang)}</p>

        {selected && (
          <div className={`rounded-2xl border p-4 space-y-2 ${th.card}`}>
            <div className="flex items-center justify-between">
              <p className={`text-xs font-semibold ${th.textPrimary}`}>
                {new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "long", weekday: "long" }).format(new Date(selected + "T00:00:00"))}
              </p>
              {selected === today && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${th.accent}`}>{t("todayTag", lang)}</span>}
            </div>
            {active.length === 0 && <p className={`text-xs ${th.textMuted}`}>{t("noActivity", lang)}</p>}
            {active.map((h) => {
              const due = isHabitDue(h, selected);
              const done = isHabitComplete(h, logs, selected);
              return (
                <button key={h.id} onClick={() => onToggle(h.id, selected)} disabled={!due}
                  className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 transition ${due ? th.cardHover : "opacity-40"} ${th.card}`}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center border ${colorClass(h, th)} ${done ? "bg-current" : ""}`}>
                    {done && <Check size={14} className="text-slate-950" />}
                  </span>
                  <span className={`flex-1 text-left text-sm truncate ${th.textPrimary}`}>{h.emoji} {habitDisplayName(h, lang)}</span>
                  <span className={`text-xs ${th.textMuted}`}>
                    {due ? `${habitLogFor(h, logs, selected).count}/${h.targetPerDay}` : "·"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ============================================================================
// İSTATİSTİK MODALI
// ============================================================================
function StatsModal({ habits, logs, onClose, th, lang }: {
  habits: Habit[]; logs: Parameters<typeof habitLogFor>[1];
  onClose: () => void; th: typeof THEMES[ThemeKey]; lang: LangCode;
}) {
  const today = todayStr();
  const week = useMemo(() => getCompletionRate(habits, logs, addDays(today, -6), today), [habits, logs, today]);
  const month = useMemo(() => getCompletionRate(habits, logs, addDays(today, -29), today), [habits, logs, today]);
  const last7 = useMemo(() => getLastNDays(habits, logs, 7, today), [habits, logs, today]);
  const active = getActiveHabits({ habits, logs, challenges: [] });
  const bestStreak = useMemo(
    () => Math.max(0, ...active.map((h) => getBestStreak(h, logs, today))),
    [active, logs, today]
  );
  const totalCompletions = useMemo(() => {
    const ids = new Set(active.map((h) => h.id));
    let n = 0;
    for (const l of logs) if (ids.has(l.habitId)) n += 1;
    return n;
  }, [active, logs]);

  const weekLabels = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  const max = Math.max(1, ...last7.map((d) => d.due));

  return (
    <Modal onClose={onClose} th={th}>
      <ModalHeader title={t("stats", lang)} onClose={onClose} th={th} />
      <div className="overflow-y-auto flex-1 p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2.5">
          <button className={`flex flex-col items-center gap-1 rounded-2xl border p-3.5 ${th.card}`}>
            <span className={`text-lg font-bold ${th.accent}`}>%{week}</span>
            <span className={`text-[10px] text-center leading-tight ${th.textMuted}`}>{t("weekRate", lang)}</span>
          </button>
          <button className={`flex flex-col items-center gap-1 rounded-2xl border p-3.5 ${th.card}`}>
            <span className={`text-lg font-bold ${th.accent2}`}>%{month}</span>
            <span className={`text-[10px] text-center leading-tight ${th.textMuted}`}>{t("monthRate", lang)}</span>
          </button>
          <button className={`flex flex-col items-center gap-1 rounded-2xl border p-3.5 ${th.card}`}>
            <span className={`text-lg font-bold ${th.accent3}`}>{bestStreak}</span>
            <span className={`text-[10px] text-center leading-tight ${th.textMuted}`}>{t("bestStreak", lang)}</span>
          </button>
        </div>

        <div>
          <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("last7Days", lang)}</p>
          <div className={`rounded-2xl border p-4 ${th.card}`}>
            <div className="flex items-end justify-between gap-1.5 h-28">
              {last7.map((d) => {
                const pct = d.due === 0 ? 0 : Math.round((d.done / d.due) * 100);
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className={`text-[10px] font-semibold ${d.due === 0 ? th.textMuted : th.accent}`}>
                      {d.due === 0 ? "·" : d.done + "/" + d.due}
                    </span>
                    <div className={`w-full rounded-md ${th.accent} bg-current`} style={{ height: `${Math.max(4, (pct / 100) * 78)}px`, opacity: d.due === 0 ? 0.15 : 0.35 + 0.65 * (pct / 100) }} />
                    <span className={`text-[9px] uppercase ${th.textMuted}`}>{t(weekLabels[d.weekday], lang)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button className={`w-full flex items-center justify-between rounded-2xl border p-3.5 ${th.card}`}>
          <span className={`text-sm ${th.textPrimary}`}>{t("todayStat", lang)}</span>
          <span className={`text-sm font-bold ${th.accent}`}>{getTodayStats(habits, logs, today).done}/{getTodayStats(habits, logs, today).due}</span>
        </button>
        <button className={`w-full flex items-center justify-between rounded-2xl border p-3.5 ${th.card}`}>
          <span className={`text-sm ${th.textPrimary}`}>{t("streak", lang)}</span>
          <span className={`text-sm font-bold ${th.accent2}`}>{totalCompletions}</span>
        </button>
      </div>
    </Modal>
  );
}

// ============================================================================
// GELİŞMİŞ İSTATİSTİKLER MODALI (uzun dönem grafik + ortalamalar + seriler)
// Şu an reklamsız açılır; ödüllü reklam kilidi bu modalın ÖNÜNE sonra eklenir.
// ============================================================================
function ShareRow({ target, share, shareId, sharing, th, lang }: {
  target: React.RefObject<HTMLDivElement | null>;
  share: (mode: "image" | "pdf", ref: React.RefObject<HTMLDivElement | null>, id: number) => void;
  shareId: number; sharing: number | null; th: typeof THEMES[ThemeKey]; lang: LangCode;
}) {
  const busy = sharing === shareId;
  return (
    <div className="share-row flex items-center gap-2 pt-1">
      <button
        onClick={() => share("image", target, shareId)}
        disabled={busy}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${th.card} ${th.accent} active:scale-[0.97] transition disabled:opacity-50`}>
        <FileImage size={13} /> {t("shareImage", lang)}
      </button>
      <button
        onClick={() => share("pdf", target, shareId)}
        disabled={busy}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${th.card} ${th.accent2} active:scale-[0.97] transition disabled:opacity-50`}>
        <FileText size={13} /> {t("sharePdf", lang)}
      </button>
      {busy && <span className={`text-[11px] ${th.textMuted}`}>{t("sharing", lang)}</span>}
    </div>
  );
}

function DetailStatsModal({ habits, logs, onClose, th, lang }: {
  habits: Habit[]; logs: Parameters<typeof habitLogFor>[1];
  onClose: () => void; th: typeof THEMES[ThemeKey]; lang: LangCode;
}) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const monthReportRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<HTMLDivElement>(null);
  const donutRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const last30Ref = useRef<HTMLDivElement>(null);
  const perHabitRef = useRef<HTMLDivElement>(null);
  const consistentRef = useRef<HTMLDivElement>(null);
  const fullReportRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState<number | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const buildShareOpts = (): ReportBlockOptions => {
    const dateLabel = new Date().toLocaleDateString(lang, { day: "2-digit", month: "short", year: "numeric" });
    return {
      appName: t("appName", lang),
      dateLabel,
      footer: t("reportSource", lang),
    };
  };

  const shareFull = async (mode: "image" | "pdf") => {
    const a4 = fullReportRef.current;
    if (!a4) return;
    setSharing(0);
    setShareError(null);
    try {
      a4.innerHTML = "";
      for (const r of [summaryRef, monthReportRef, heatmapRef, donutRef, lineRef, last30Ref, perHabitRef, consistentRef]) {
        if (!r.current) continue;
        const clone = r.current.cloneNode(true) as HTMLElement;
        clone.querySelectorAll(".share-row").forEach((el) => el.remove());
        clone.style.cssText = "margin:0 0 20px;";
        a4.appendChild(clone);
      }
      const opts = buildShareOpts();
      if (mode === "image") await shareReportBlockAsImage(a4, opts);
      else await shareReportBlockAsPdf(a4, opts);
    } catch (e) {
      console.error("[reportShare]", e);
      setShareError(String(e instanceof Error ? e.message : e));
    } finally {
      setSharing(null);
    }
  };

  const share = async (mode: "image" | "pdf", ref: React.RefObject<HTMLDivElement | null>, shareId: number) => {
    const el = ref.current;
    if (!el) return;
    setSharing(shareId);
    setShareError(null);
    const opts = buildShareOpts();
    try {
      if (mode === "image") await shareReportBlockAsImage(el, opts);
      else await shareReportBlockAsPdf(el, opts);
    } catch (e) {
      console.error("[reportShare]", e);
      setShareError(String(e instanceof Error ? e.message : e));
    } finally {
      setSharing(null);
    }
  };

  const today = todayStr();
  const maxStreak = useMemo(() => getMaxCurrentStreak(habits, logs, today), [habits, logs, today]);
  const last30 = useMemo(() => getLongRangeDays(habits, logs, 30, today), [habits, logs, today]);

  // Baskı/çıktı dostu rapor stili: tema koyuluğu yerine beyaz kart + koyu metin.
  const rTitle = "text-slate-500";
  const rText = "text-slate-900";
  const rMuted = "text-slate-500";
  const rCard = "bg-white border-slate-200";
  const rBg = "#ffffff";
  const accHex = th.preview[1];
  const acc3Hex = th.preview[2];
  const avg7 = useMemo(() => getAverageRate(habits, logs, 7, today), [habits, logs, today]);
  const avg30 = useMemo(() => getAverageRate(habits, logs, 30, today), [habits, logs, today]);
  const habitStreaks = useMemo(() => getHabitStreaks(habits, logs, today), [habits, logs, today]);
  const consistent = useMemo(() => getMostConsistent(habits, logs, 30, today, 5), [habits, logs, today]);

  // Aktif habit'ler (rapor grafikleri boşken gereksiz gösterilmesin)
  const active = getActiveHabits({ habits, logs, challenges: [] });
  // Aylık takvim bloğu: içinde bulunulan ayın statik özeti
  const calNow = new Date();
  const calYear = calNow.getFullYear();
  const calMonth = calNow.getMonth() + 1;
  const monthCells = useMemo(
    () => getMonthCells(calYear, calMonth, habits, logs, today),
    [habits, logs, today]
  );
  const intlLocale = { tr: "tr-TR", en: "en-US", de: "de-DE", ar: "ar-SA", ur: "ur-PK" }[lang];
  const monthLabel = new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(new Date(calYear, calMonth - 1, 1));
  const weekKeysC = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const monthA = hexToRgb(th.preview[1]);
  const amberA = "245, 158, 11";
  const missedA = "148, 163, 184"; // slate-400 tonu

  // Son 12 hafta katkı haritası (Pazartesi başlangıçlı, sütun = hafta)
  const heatmap = (() => {
    const activeH = habits.filter((h) => !h.archived);
    const cols: { label: string; rows: { date: string; done: number; due: number; future: boolean }[] }[] = [];
    let lastMonth = -1;
    for (let w = 11; w >= 0; w--) {
      const monday = addDays(today, -w * 7);
      const mm = parseInt(monday.slice(5, 7), 10);
      const label = mm !== lastMonth
        ? new Intl.DateTimeFormat(intlLocale, { month: "short" }).format(new Date(monday + "T00:00:00"))
        : "";
      lastMonth = mm;
      const rows: { date: string; done: number; due: number; future: boolean }[] = [];
      for (let r = 0; r < 7; r++) {
        const date = addDays(monday, r);
        const future = date > today;
        const dueH = activeH.filter((h) => isHabitDue(h, date));
        const due = dueH.length;
        const done = future ? 0 : dueH.filter((h) => isHabitComplete(h, logs, date)).length;
        rows.push({ date, done, due, future });
      }
      cols.push({ label, rows });
    }
    return cols;
  })();
  const heatTotals = heatmap.reduce<{ done: number; total: number }>(
    (acc, c) => {
      for (const r of c.rows) {
        if (r.due > 0 && !r.future) {
          acc.total++;
          if (r.done === r.due) acc.done++;
        }
      }
      return acc;
    },
    { done: 0, total: 0 }
  );
  const heatA = hexToRgb(th.preview[1]);
  const heatBg = (day: { done: number; due: number; future: boolean }): string | undefined => {
    if (day.future || day.due === 0) return undefined;
    const r = day.done / day.due;
    const a = r <= 0 ? 0.08 : r < 0.5 ? 0.35 : r < 1 ? 0.7 : 1;
    return `rgba(${heatA}, ${a})`;
  };
  const monthCellBg = (cell: { completed: number; due: number; inMonth: boolean; date: string }): string | undefined => {
    if (!cell.inMonth || cell.due === 0 || cell.date > today) return undefined;
    if (cell.completed >= cell.due) return `rgba(${monthA}, 1)`;
    if (cell.completed > 0) return `rgba(${amberA}, 0.85)`;
    return `rgba(${missedA}, 0.22)`;
  };
  // Takvim hücrelerini 7'li hafta satırlarına böl (flex ile html2canvas uyumlu).
  const monthWeeks: { date: string; completed: number; due: number; inMonth: boolean; isToday: boolean }[][] = [];
  for (let i = 0; i < monthCells.length; i += 7) monthWeeks.push(monthCells.slice(i, i + 7));

  type StreakRow = (typeof habitStreaks)[number];
  const streakGroups: {
    standalone: StreakRow[];
    packs: { id: string; template?: HabitSetTemplate; rows: StreakRow[] }[];
  } = useMemo(() => {
    const packs = new Map<string, StreakRow[]>();
    const standalone: StreakRow[] = [];
    for (const row of habitStreaks) {
      if (row.habit.packId) {
        const g = packs.get(row.habit.packId);
        if (g) g.push(row);
        else packs.set(row.habit.packId, [row]);
      } else {
        standalone.push(row);
      }
    }
    return {
      standalone,
      packs: Array.from(packs.entries()).map(([id, rows]) => ({ id, template: HABIT_SETS.find((s) => s.id === id), rows })),
    };
  }, [habitStreaks]);

  type ConsistentRow = (typeof consistent)[number];
  const consistentGroups: {
    standalone: { row: ConsistentRow; rank: number }[];
    packs: { id: string; template?: HabitSetTemplate; rows: { row: ConsistentRow; rank: number }[] }[];
  } = useMemo(() => {
    const packs = new Map<string, { row: ConsistentRow; rank: number }[]>();
    const standalone: { row: ConsistentRow; rank: number }[] = [];
    consistent.forEach((row, i) => {
      const item = { row, rank: i + 1 };
      if (row.habit.packId) {
        const g = packs.get(row.habit.packId);
        if (g) g.push(item);
        else packs.set(row.habit.packId, [item]);
      } else {
        standalone.push(item);
      }
    });
    return {
      standalone,
      packs: Array.from(packs.entries()).map(([id, rows]) => ({ id, template: HABIT_SETS.find((s) => s.id === id), rows })),
    };
  }, [consistent]);

  const StreakLine = ({ habit, current, best }: StreakRow) => {
    const cc = colorClass(habit, th);
    return (
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <span className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${cc}`}>
          {habit.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${rText}`}>{habitDisplayName(habit, lang)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] rounded-full px-2 py-1 border bg-white ${th.accent3}`}>🔥 {t("dayStreak", lang, { n: String(current) })}</span>
          <span className={`text-[10px] rounded-full px-2 py-1 border bg-white ${rMuted}`}>{best}⚡</span>
        </div>
      </div>
    );
  };

  const ConsistentLine = ({ row, rank }: { row: ConsistentRow; rank: number }) => {
    return (
      <div className="flex items-center gap-3">
        <span className={`w-5 text-sm font-bold text-center ${rank === 1 ? th.accent3 : rMuted}`}>#{rank}</span>
        <span className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${colorClass(row.habit, th)}`}>
          {row.habit.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-semibold truncate ${rText}`}>{habitDisplayName(row.habit, lang)}</p>
            <span className={`text-xs font-bold ${th.accent}`}>%{row.rate}</span>
          </div>
          <div className="h-1.5 w-full rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
            <div className="h-full rounded-full" style={{ backgroundColor: accHex, width: `${row.rate}%`, opacity: 0.7 }} />
          </div>
        </div>
      </div>
    );
  };

  const monthLabels = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  // Son 30 günü 6 sütuna böl (her biri 5 gün) — okunur uzun dönem grafiği
  const buckets: { label: string; pct: number; done: number; due: number }[] = [];
  for (let b = 0; b < 6; b++) {
    const slice = last30.slice(b * 5, b * 5 + 5);
    const due = slice.reduce((s, d) => s + d.due, 0);
    const done = slice.reduce((s, d) => s + d.done, 0);
    const fromDay = new Date(slice[0]?.date + "T00:00:00").getDate();
    const isLast = b === 5;
    let label: string;
    if (isLast) {
      label = t("todayTitle", lang);
    } else {
      const from = new Date((slice[0]?.date ?? today) + "T00:00:00");
      label = t(monthLabels[from.getDay()], lang);
    }
    const _ = fromDay;
    buckets.push({ label, pct: due === 0 ? 0 : Math.round((done / due) * 100), done, due });
  }
  const maxBucket = Math.max(1, ...buckets.map((b) => b.pct));

  // ---- Pasta (donut) grafiği: son 30 günün durum dağılımı ----
  const past30 = last30.filter((d) => d.date <= today);
  const sliceCounts = past30.reduce(
    (acc, d) => {
      if (d.due === 0) acc.rest++;
      else if (d.done >= d.due) acc.done++;
      else if (d.done > 0) acc.partial++;
      else acc.missed++;
      return acc;
    },
    { done: 0, partial: 0, missed: 0, rest: 0 }
  );
  const donutTotal = sliceCounts.done + sliceCounts.partial + sliceCounts.missed + sliceCounts.rest;
  const DONUT_R = 52;
  const DONUT_C = 2 * Math.PI * DONUT_R;
  const donutSegs: { key: string; v: number; color: string }[] = [
    { key: "done", v: sliceCounts.done, color: "#22c55e" },
    { key: "partial", v: sliceCounts.partial, color: "#f59e0b" },
    { key: "missed", v: sliceCounts.missed, color: "#94a3b8" },
    { key: "rest", v: sliceCounts.rest, color: "#e2e8f0" },
  ];
  let donutOffset = 0;
  const donutArcs = donutSegs.map((s) => {
    const frac = donutTotal ? s.v / donutTotal : 0;
    const dash = frac > 0 ? Math.max(frac * DONUT_C - 2.5, 0.1) : 0;
    const el =
      frac > 0 ? (
        <circle
          key={s.key}
          cx="64"
          cy="64"
          r={DONUT_R}
          fill="none"
          stroke={s.color}
          strokeWidth="17"
          strokeDasharray={`${dash} ${DONUT_C}`}
          strokeDashoffset={-donutOffset}
          transform="rotate(-90 64 64)"
        />
      ) : null;
    donutOffset += frac * DONUT_C;
    return el;
  });

  // ---- XY (çizgi) grafiği: son 30 gün günlük tamamlama yüzdesi ----
  let carried = 0;
  const lineVals = past30.map((d) => {
    if (d.due === 0) return carried;
    const v = Math.round((d.done / d.due) * 100);
    carried = v;
    return v;
  });
  const L_W = 260;
  const L_H = 104;
  const L_PX = 6;
  const L_PT = 14;
  const L_PB = 8;
  const lx = (i: number) => (lineVals.length === 1 ? L_PX : L_PX + (i * (L_W - L_PX * 2)) / (lineVals.length - 1));
  const ly = (v: number) => L_PT + ((100 - v) / 100) * (L_H - L_PT - L_PB);
  const linePts = lineVals.map((v, i) => `${lx(i).toFixed(1)},${ly(v).toFixed(1)}`).join(" ");
  const areaPts = lineVals.length
    ? `${lx(0).toFixed(1)},${(L_H - L_PB).toFixed(1)} ${linePts} ${lx(lineVals.length - 1).toFixed(1)},${(L_H - L_PB).toFixed(1)}`
    : "";
  const lineXL = [0, Math.floor((lineVals.length - 1) * 0.25), Math.floor((lineVals.length - 1) * 0.5), Math.floor((lineVals.length - 1) * 0.75), lineVals.length - 1]
    .map((i) => past30[i]?.date.slice(8, 10) ?? "");
  const hasTrend = lineVals.length > 0 && past30.some((d) => d.due > 0);
  const hasBreakdown = past30.some((d) => d.due > 0);

  return (
    <Modal onClose={onClose} th={th}>
      <ModalHeader title={t("advancedStats", lang)} onClose={onClose} th={th} />
      <div className="overflow-y-auto flex-1 p-5 space-y-4">
        {/* Tüm rapor (A4) paylaşımı */}
        <div className={`rounded-2xl border p-3 ${th.card}`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className={`text-xs uppercase tracking-wide ${th.textMuted}`}>{t("fullReportTitle", lang)}</p>
            {sharing === 0 && <span className={`text-[11px] ${th.textMuted}`}>{t("sharing", lang)}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => shareFull("image")}
              disabled={sharing !== null}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${th.card} ${th.accent} active:scale-[0.97] transition disabled:opacity-50`}>
              <FileImage size={14} /> {t("shareImage", lang)}
            </button>
            <button
              onClick={() => shareFull("pdf")}
              disabled={sharing !== null}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${th.card} ${th.accent2} active:scale-[0.97] transition disabled:opacity-50`}>
              <FileText size={14} /> {t("sharePdf", lang)}
            </button>
          </div>
        </div>

        {/* Üst özet: akım zincir + ortalamalar */}
        <div ref={summaryRef} className="space-y-1">
          <p className={`text-xs uppercase tracking-wide pl-4 ${rTitle}`}>{t("summaryTitle", lang)}</p>
          <div className="flex" style={{ background: rBg }}>
            <div className={`flex flex-col items-center gap-1 flex-1 rounded-2xl border p-3.5 ${rCard}`} style={{ marginRight: 10 }}>
              <span className="flex items-center justify-center w-7 h-7 rounded-full opacity-20" style={{ background: acc3Hex }}>
                <Flame size={14} className="text-black" />
              </span>
              <span className={`text-xl font-bold ${th.accent3}`}>{maxStreak}</span>
              <span className={`text-[10px] text-center leading-tight ${rMuted}`}>{t("yourStreak", lang)}</span>
            </div>
            <div className={`flex flex-col items-center gap-1 flex-1 rounded-2xl border p-3.5 ${rCard}`} style={{ marginRight: 10 }}>
              <span className={`text-xl font-bold ${th.accent}`}>%{avg7}</span>
              <span className={`text-[10px] text-center leading-tight ${rMuted}`}>{t("avg7", lang)}</span>
            </div>
            <div className={`flex flex-col items-center gap-1 flex-1 rounded-2xl border p-3.5 ${rCard}`}>
              <span className={`text-xl font-bold ${th.accent2}`}>%{avg30}</span>
              <span className={`text-[10px] text-center leading-tight ${rMuted}`}>{t("avg30", lang)}</span>
            </div>
          </div>
          {maxStreak > 0 ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-semibold"
              style={{ background: rBg, color: "#111827" }}>
              <Flame size={14} className={th.accent} />
              <span className={th.accent}>{t("motivateKeep", lang, { n: String(maxStreak) })}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-semibold"
              style={{ background: rBg, color: "#111827" }}>
              <Flame size={14} className={th.textMuted} />
              <span className={rMuted}>{t("motivateStart", lang)}</span>
            </div>
          )}
          <ShareRow target={summaryRef} share={share} shareId={1} sharing={sharing} th={th} lang={lang} />
        </div>

        {/* Aylık takvim özeti */}
        {active.length > 0 && (
          <div ref={monthReportRef} className="space-y-1">
            <p className={`text-xs uppercase tracking-wide pl-4 ${rTitle}`}>{t("reportMonthTitle", lang)}</p>
            <div className={`rounded-2xl border p-4 ${rCard}`} style={{ background: rBg }}>
              <p className={`text-center text-sm font-semibold mb-2 ${rText}`}>{monthLabel}</p>
              <div className="flex text-center mb-1">
                {weekKeysC.map((k) => (
                  <span key={k} className={`flex-1 text-[9px] font-semibold uppercase ${rMuted}`}>{t(k, lang)}</span>
                ))}
              </div>
              <div className="flex flex-col">
                {monthWeeks.map((week, wi) => (
                  <div key={wi} className="flex" style={wi ? { marginTop: 4 } : undefined}>
                    {week.map((cell, ci) => (
                      <div key={ci}
                        className={`relative h-9 flex-1 rounded-lg border flex items-center justify-center text-[11px] font-semibold transition ${cell.inMonth ? "border-slate-200" : "opacity-30 border-slate-200"} ${cell.isToday ? "ring-1 ring-current " + th.accent : ""}`}
                        style={{ ...(ci < week.length - 1 ? { marginRight: 4 } : {}), ...(monthCellBg(cell) ? { background: monthCellBg(cell) } : {}) }}>
                        <span className={cell.completed >= cell.due && cell.due > 0 ? "text-slate-950" : cell.completed > 0 ? "text-slate-950" : `${rText}`}>
                          {Number(cell.date.slice(8, 10))}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 mt-3">
                <LegendItem color={`rgba(${monthA}, 1)`} label={t("reportDone", lang)} />
                <LegendItem color={`rgba(${amberA}, 0.85)`} label={t("reportPartial", lang)} />
                <LegendItem color={`rgba(${missedA}, 0.22)`} label={t("reportMissed", lang)} />
              </div>
            </div>
            <ShareRow target={monthReportRef} share={share} shareId={5} sharing={sharing} th={th} lang={lang} />
          </div>
        )}

        {/* Son 12 hafta katkı haritası */}
        {active.length > 0 && (
          <div ref={heatmapRef} className="space-y-1">
            <p className={`text-xs uppercase tracking-wide pl-4 ${rTitle}`}>{t("reportHeatmapTitle", lang)}</p>
            <div className={`rounded-2xl border p-4 ${rCard}`} style={{ background: rBg }}>
              <div className="flex mb-1">
                {heatmap.map((c, i) => (
                  <span key={i} className={`flex-1 text-[9px] text-center truncate ${rMuted}`}>{c.label}</span>
                ))}
              </div>
              <div className="flex">
                {heatmap.map((c, i) => (
                  <div key={i} className="flex-1 flex flex-col" style={i < heatmap.length - 1 ? { marginRight: 4 } : undefined}>
                    {c.rows.map((day, r) => (
                      <div key={r} className="h-3.5 rounded-[3px]"
                        style={{ ...(r ? { marginTop: 4 } : {}), ...(heatBg(day) ? { background: heatBg(day) } : {}) }} />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 mt-3">
                <span className={`text-[10px] ${rMuted}`}>
                  {t("reportHeatmapSummary", lang, { done: String(heatTotals.done), total: String(heatTotals.total) })}
                </span>
                <span className="flex items-center gap-1.5 text-[10px]">
                  <span className={rMuted}>{t("reportHeatmapLess", lang)}</span>
                  {[0.08, 0.35, 0.7, 1].map((a) => (
                    <span key={a} className="w-3 h-3 rounded-[3px]" style={{ background: `rgba(${heatA}, ${a})` }} />
                  ))}
                  <span className={rMuted}>{t("reportHeatmapMore", lang)}</span>
                </span>
              </div>
            </div>
            <ShareRow target={heatmapRef} share={share} shareId={6} sharing={sharing} th={th} lang={lang} />
          </div>
        )}

        {/* Pasta (donut) grafiği: son 30 günün durum dağılımı */}
        {hasBreakdown && (
          <div ref={donutRef} className="space-y-1">
            <p className={`text-xs uppercase tracking-wide pl-4 ${rTitle}`}>{t("reportPieTitle", lang)}</p>
            <div className={`rounded-2xl border p-4 ${rCard}`} style={{ background: rBg }}>
              <div className="flex items-center justify-center gap-6">
                <div className="relative w-36 h-36 shrink-0">
                  <svg viewBox="0 0 128 128" className="w-full h-full">
                    <circle cx="64" cy="64" r={DONUT_R} fill="none" stroke="#e2e8f0" strokeWidth="17" />
                    {donutArcs}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold" style={{ color: "#16a34a" }}>{sliceCounts.done}</span>
                    <span className="text-[9px] uppercase tracking-wide text-slate-500">{t("reportDone", lang)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <LegendItem color="#22c55e" label={t("reportDone", lang)} value={String(sliceCounts.done)} />
                  <LegendItem color="#f59e0b" label={t("reportPartial", lang)} value={String(sliceCounts.partial)} />
                  <LegendItem color="#94a3b8" label={t("reportMissed", lang)} value={String(sliceCounts.missed)} />
                  <LegendItem color="#e2e8f0" label={t("reportRest", lang)} value={String(sliceCounts.rest)} />
                </div>
              </div>
            </div>
            <ShareRow target={donutRef} share={share} shareId={7} sharing={sharing} th={th} lang={lang} />
          </div>
        )}

        {/* XY (çizgi) grafiği: son 30 gün günlük tamamlama yüzdesi */}
        {hasTrend && (
          <div ref={lineRef} className="space-y-1">
            <p className={`text-xs uppercase tracking-wide pl-4 ${rTitle}`}>{t("reportTrendTitle", lang)}</p>
            <div className={`rounded-2xl border p-4 ${rCard}`} style={{ background: rBg }}>
              <svg viewBox={`0 0 ${L_W} ${L_H}`} className="w-full h-24">
                {[25, 50, 75].map((y) => (
                  <line key={y} x1={L_PX} y1={y} x2={L_W - L_PX} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 4" />
                ))}
                <polyline points={areaPts} fill="#22c55e" opacity="0.16" stroke="none" />
                <polyline points={linePts} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
              <div className="flex justify-between mt-1 px-0.5">
                {lineXL.map((l, i) => (
                  <span key={i} className="text-[9px] tabular-nums text-slate-400">{l}</span>
                ))}
              </div>
            </div>
            <ShareRow target={lineRef} share={share} shareId={8} sharing={sharing} th={th} lang={lang} />
          </div>
        )}

        {/* Son 30 gün grafiği (6 × 5 gün dilimi) */}
        <div ref={last30Ref} className="space-y-1">
          <p className={`text-xs uppercase tracking-wide pl-4 ${rTitle}`}>{t("last30Days", lang)}</p>
          <div className={`rounded-2xl border p-4 ${rCard}`} style={{ background: rBg }}>
            <div className="flex items-end justify-between gap-2.5 h-32">
              {buckets.map((b) => (
                <div key={b.label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <span className={`text-[10px] font-semibold ${b.due === 0 ? rMuted : th.accent}`}>
                    {b.due === 0 ? "—" : "%" + b.pct}
                  </span>
                  <div className="w-full rounded-t-lg"
                    style={{
                      height: `${Math.max(5, (b.pct / maxBucket) * 78)}px`,
                      background: b.due === 0
                        ? "rgba(0,0,0,0.08)"
                        : `linear-gradient(180deg, ${accHex} 0%, ${acc3Hex} 100%)`,
                    }} />
                  <span className={`text-[9px] uppercase ${rMuted}`}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ShareRow target={last30Ref} share={share} shareId={2} sharing={sharing} th={th} lang={lang} />
        </div>

        {/* Alışkanlık bazında seri */}
        <div ref={perHabitRef} className="space-y-1">
          <p className={`text-xs uppercase tracking-wide pl-4 ${rTitle}`}>{t("perHabit", lang)}</p>
          <div className={`rounded-2xl border p-2 ${rCard} space-y-1`}>
            {habitStreaks.length === 0 && (
              <p className={`text-xs text-center py-3 ${rMuted}`}>{t("noHabits", lang)}</p>
            )}
            {streakGroups.standalone.map(({ habit, current, best }) => (
              <StreakLine key={habit.id} habit={habit} current={current} best={best} />
            ))}
            {streakGroups.packs.map((pack) => (
              <Fragment key={pack.id}>
                <p className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-bold mt-1 ${rMuted}`}>
                  <span className="text-xs">{pack.template?.emoji}</span>
                  {t(pack.template?.nameKey ?? pack.id, lang)}
                </p>
                {pack.rows.map(({ habit, current, best }) => (
                  <StreakLine key={habit.id} habit={habit} current={current} best={best} />
                ))}
              </Fragment>
            ))}
          </div>
          <ShareRow target={perHabitRef} share={share} shareId={3} sharing={sharing} th={th} lang={lang} />
        </div>

        {/* En tutarlı alışkanlıklar */}
        <div ref={consistentRef} className="space-y-1">
          <p className={`text-xs uppercase tracking-wide pl-4 ${rTitle}`}>{t("consistentTitle", lang)}</p>
          <div className={`rounded-2xl border p-3 ${rCard} space-y-2`} style={{ background: rBg }}>
            {consistent.length === 0 && (
              <p className={`text-xs text-center py-3 ${rMuted}`}>{t("noHabits", lang)}</p>
            )}
            {consistentGroups.standalone.map(({ row, rank }) => (
              <Fragment key={row.habit.id}>
                <ConsistentLine row={row} rank={rank} />
              </Fragment>
            ))}
            {consistentGroups.packs.map((pack) => (
              <Fragment key={pack.id}>
                <p className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-bold ${rMuted}`}>
                  <span className="text-xs">{pack.template?.emoji}</span>
                  {t(pack.template?.nameKey ?? pack.id, lang)}
                </p>
                {pack.rows.map(({ row, rank }) => (
                  <Fragment key={row.habit.id}>
                    <ConsistentLine row={row} rank={rank} />
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </div>
          <ShareRow target={consistentRef} share={share} shareId={4} sharing={sharing} th={th} lang={lang} />
        </div>
        {shareError && (
          <p className="text-[11px] text-red-500 break-all px-1">{shareError}</p>
        )}
      </div>

      {/* A4 "Tüm Rapor" paylaşım alanı — ekran dışı, görüntü yakalamada kullanılır */}
      <div
        ref={fullReportRef}
        className="pointer-events-none fixed top-0 left-[-9999px] w-[794px] min-h-[1123px] bg-white p-6"
        style={{ zIndex: 0 }}
      />
    </Modal>
  );
}

// ============================================================================
// KURTARMA / SIFIRLAMA UYARI MODALI
// ============================================================================
function GraceModal({ recoveryChallenges, resetChallenges, completedChallenges, challenges, onRecover, recovering, onClose, th, lang }: {
  recoveryChallenges: string[];
  resetChallenges: string[];
  completedChallenges: string[];
  challenges: Challenge[];
  onRecover: (id: string) => void;
  recovering: boolean;
  onClose: () => void; th: typeof THEMES[ThemeKey]; lang: LangCode;
}) {
  const nameOf = (id: string) => {
    const c = challenges.find((x) => x.id === id);
    return c ? challengeDisplayName(c, lang) : "";
  };
  const targetOf = (id: string) => challenges.find((x) => x.id === id)?.recoveryTargetDate ?? "";
  return (
    <Modal onClose={onClose} th={th}>
      <ModalHeader title={t("challengeWarn", lang)} onClose={onClose} th={th} />
      <div className="overflow-y-auto flex-1 p-5 space-y-4">
        {completedChallenges.length > 0 && (
          <div className={`rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 p-4 flex items-start gap-2`}>
            <Trophy size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              {completedChallenges.map((id) => (
                <p key={id} className="text-xs leading-relaxed text-emerald-500"><b>{nameOf(id)}</b> — {t("challengeDoneCelebration", lang)}</p>
              ))}
            </div>
          </div>
        )}
        {recoveryChallenges.length > 0 && (
          <div className={`rounded-2xl border-2 border-orange-500/40 bg-orange-500/10 p-4 space-y-3`}>
            <div className="flex items-start gap-2">
              <Zap size={18} className="text-orange-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-orange-500">{t("recoveryTitle", lang)}</p>
                {recoveryChallenges.map((id) => (
                  <p key={id} className="text-xs leading-relaxed text-orange-500">
                    <b>{nameOf(id)}</b> — {t("recoveryDesc1", lang, { date: targetOf(id) })} {t("recoveryDesc2", lang)}
                  </p>
                ))}
              </div>
            </div>
            {recoveryChallenges.map((id) => (
              <button key={id} onClick={() => onRecover(id)} disabled={recovering}
                className={`w-full py-2.5 rounded-xl text-sm font-bold border border-orange-500/50 text-orange-500 transition active:scale-[0.98] ${recovering ? "opacity-50" : ""}`}>
                {recovering ? "…" : t("recoveryBtn", lang)}
              </button>
            ))}
          </div>
        )}
        {resetChallenges.length > 0 && (
          <div className={`rounded-2xl border-2 border-red-500/40 bg-red-500/10 p-4 flex items-start gap-2`}>
            <Trophy size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-red-500">{t("challengeResetTitle", lang)}</p>
              {resetChallenges.map((id) => (
                <p key={id} className="text-xs leading-relaxed text-red-500"><b>{nameOf(id)}</b> — {t("challengeResetDesc", lang)}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ============================================================================
// ANA UYGULAMA
// ============================================================================
const formatTimer = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

const playTimerChime = () => {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const play = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    play(880, 0, 0.25);
    play(1174, 0.22, 0.25);
    play(1568, 0.44, 0.45);
    setTimeout(() => ctx.close().catch(() => {}), 1500);
  } catch {
    /* ses desteklenmiyorsa sessiz devam */
  }
  try {
    if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
  } catch { /* titresim desteklenmiyorsa sessiz */ }
};

export default function App() {
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    const saved = localStorage.getItem("mht_theme") as ThemeKey;
    return saved && THEMES[saved] ? saved : "gece";
  });
  const setTheme = (key: ThemeKey) => { setThemeKey(key); localStorage.setItem("mht_theme", key); };
  const th = THEMES[themeKey];

  const [lang, setLangState] = useState<LangCode>(
    () => (localStorage.getItem("mht_lang") as LangCode) || detectLanguage()
  );
  const setLang = (l: LangCode) => { setLangState(l); localStorage.setItem("mht_lang", l); };

  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    const saved = localStorage.getItem("mht_font_scale") as FontScale | null;
    return saved === "normal" || saved === "large" || saved === "xlarge" ? saved : "large";
  });
  const setFontScale = (f: FontScale) => { setFontScaleState(f); localStorage.setItem("mht_font_scale", f); };
  useEffect(() => {
    document.documentElement.classList.remove("font-scale-normal", "font-scale-large", "font-scale-xlarge");
    document.documentElement.classList.add(`font-scale-${fontScale}`);
  }, [fontScale]);

  const today = todayStr();

  // ---- Veri state (localStorage) ----
  const [state, setStateRaw] = useState(loadState);
  const { habits, logs, challenges } = state;
  const [dayKey, setDayKey] = useState(today);

  // ---- Zamanlayıcı (süreli habit'ler) ----
  const [timerFor, setTimerFor] = useState<string | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [timerStart, setTimerStart] = useState(0);
  const [timerReached, setTimerReached] = useState(false);

  // stateRef her zaman en güncel state'i tutar; otomatik kaydetme effect'i
  // her değişiklikte localStorage'a yazar.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
    saveState(state);
  }, [state]);

  const activeHabits = useMemo(() => getActiveHabits(state), [state]);

  // Hazır paketlerden gelen alışkanlıklar paket adı altında gruplanır;
  // paketsiz (kullanıcı tarafından eklenen) alışkanlıklar tek başına kalır.
  const habitGroups = useMemo(() => {
    const packs = new Map<string, Habit[]>();
    const standalone: Habit[] = [];
    for (const h of activeHabits) {
      if (h.packId) {
        const g = packs.get(h.packId);
        if (g) g.push(h);
        else packs.set(h.packId, [h]);
      } else {
        standalone.push(h);
      }
    }
    return {
      standalone,
      packs: Array.from(packs.entries()).map(([id, habits]) => ({
        id,
        emoji: HABIT_SETS.find((s) => s.id === id)?.emoji ?? "📦",
        nameKey: HABIT_SETS.find((s) => s.id === id)?.nameKey,
        habits,
      })),
    };
  }, [activeHabits]);

  // Zamanlayıcı saniyeleri günceller (startTime tabanlı, arka planda doğru)
  useEffect(() => {
    if (!timerRunning) return;
    const habit = timerFor ? habits.find((h) => h.id === timerFor) : null;
    if (!habit || habit.unit !== "minutes") return;
    const targetMs = (habit.targetPerDay || 1) * 60000;
    const iv = setInterval(() => {
      const now = Date.now() - timerStart;
      setElapsedMs(Math.min(now, targetMs));
      if (now >= targetMs) {
        clearInterval(iv);
        setTimerRunning(false);
        setElapsedMs(targetMs);
        setTimerReached(true);
        playTimerChime();
        setTimeout(() => handleFinishTimer(targetMs), 400);
      }
    }, 200);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning, timerStart, timerFor]);

  // ---- Modaller ----
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"tema" | "dil" | "yedekleme" | "bildirim" | "hakkinda">("tema");
  const [notifPrefs, setNotifPrefsState] = useState<NotifPrefs>(readNotifPrefs);
  const setNotifPrefs = (p: NotifPrefs) => { writeNotifPrefs(p); setNotifPrefsState(p); };
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const challengePacksRef = useRef<HTMLDivElement>(null);
  const scrollToChallengePacks = () => {
    const el = challengePacksRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 12;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  };
  const [templatePending, setTemplatePending] = useState<ChallengeTemplate | null>(null);
  const [challengeDetail, setChallengeDetail] = useState<Challenge | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showDetailStats, setShowDetailStats] = useState(false);
  const [confirmDeleteHabit, setConfirmDeleteHabit] = useState<Habit | null>(null);
  const [habitSetPreview, setHabitSetPreview] = useState<HabitSetTemplate | null>(null);
  const [customHabitOpen, setCustomHabitOpen] = useState(false);
  const [customChallengeOpen, setCustomChallengeOpen] = useState(false);
  const [expandedPacks, setExpandedPacks] = useState<Record<string, boolean>>({});
  const togglePack = (id: string) => setExpandedPacks((p) => ({ ...p, [id]: !p[id] }));

  // Tek bir alışkanlık kartı. Hem tek başına hem paket içinde kullanılır.
  const renderHabitCard = (h: Habit) => {
    const info = habitLogFor(h, logs, today);
    const streak = getCurrentStreak(h, logs, today);
    const cc = colorClass(h, th);
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-4 ${th.card}`}>
        {h.unit === "minutes" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${cc}`}>
                {info.complete ? <Check size={20} className="text-slate-950" /> : <span className="text-lg">{h.emoji}</span>}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold truncate ${th.textPrimary}`}>{habitDisplayName(h, lang)}</p>
                  {renderWeekdayDots(h, cc)}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={`flex items-center gap-1 text-xs font-semibold ${streak > 0 ? "text-orange-400" : th.textMuted}`}>
                    <Flame size={13} /> {t("streakDays", lang, { n: String(streak) })}
                  </span>
                  <span className={`text-xs ${th.textMuted}`}>{info.count} / {h.targetPerDay} {t("minutes", lang)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => { setEditingHabit(h); setShowHabitModal(true); }}
                  className={`p-2 rounded-xl ${th.cardHover} ${th.textMuted}`}><Pencil size={16} /></button>
                <button onClick={() => setConfirmDeleteHabit(h)}
                  className={`p-2 rounded-xl ${th.cardHover} text-red-500/70`}><Trash2 size={16} /></button>
              </div>
            </div>

            <div className={`rounded-xl border p-3 ${th.card} ${timerFor === h.id && timerReached ? "border-green-500/60 animate-pulse" : ""}`}>
              {timerFor === h.id && timerReached && (
                <div className="flex items-center justify-center gap-2 mb-2 py-1">
                  <span className={`font-bold text-base ${th.accent}`}>🎉 {t("timerDone", lang)}</span>
                </div>
              )}
              {timerFor === h.id && timerRunning && !timerReached && (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className={`font-mono text-lg font-bold tabular-nums ${th.accent}`}>
                    {formatTimer(elapsedMs)}
                  </span>
                  <span className={`text-xs ${th.textMuted}`}>/ {h.targetPerDay} {t("minutes", lang)}</span>
                </div>
              )}
              {timerFor === h.id && !timerRunning && !timerReached && (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className={`font-mono text-lg font-bold tabular-nums ${th.textPrimary}`}>
                    {formatTimer(elapsedMs)}
                  </span>
                  <span className={`text-xs ${th.textMuted}`}>/ {h.targetPerDay} {t("minutes", lang)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {timerReached ? (
                  <button onClick={handleFinishTimer}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${th.accent} animate-bounce`}>
                    {t("finish", lang)}
                  </button>
                ) : timerFor !== h.id ? (
                  <button onClick={() => handleStartTimer(h.id)} disabled={!info.due}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${cc} ${info.due ? "" : "opacity-40"}`}>
                    ▶ {t("startTimer", lang)}
                  </button>
                ) : timerRunning ? (
                  <>
                    <button onClick={handlePauseTimer}
                      className={`flex-[2] py-2 rounded-xl text-sm font-bold border transition ${th.card} ${th.textSecondary}`}>
                      ⏸ {t("pause", lang)}
                    </button>
                    <button onClick={() => handleFinishTimer()} disabled={!info.due}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${th.accent} ${info.due ? "" : "opacity-40"}`}>
                      {t("finish", lang)}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleResumeTimer}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${th.accent}`}>
                      ▶ {t("resume", lang)}
                    </button>
                    <button onClick={() => handleFinishTimer()} disabled={!info.due}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${th.card} ${info.due ? "" : "opacity-40"}`}>
                      {t("finish", lang)}
                    </button>
                  </>
                )}
                {timerFor === h.id && (
                  <button onClick={handleResetTimer} title="reset"
                    className={`p-2 rounded-xl ${th.cardHover} ${th.textMuted}`}><X size={16} /></button>
                )}
              </div>
            </div>
          </div>
        ) : (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => handleToggleHabit(h.id, today)} disabled={!info.due}
              className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition active:scale-90 ${cc} ${info.due ? "" : "opacity-40"}`}
              style={info.complete ? { background: "currentColor" } : undefined}>
              {info.complete ? (
                <Check size={20} className="text-slate-950" />
              ) : (
                <span className="text-lg">{h.emoji}</span>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-semibold truncate ${th.textPrimary}`}>{habitDisplayName(h, lang)}</p>
                {renderWeekdayDots(h, cc)}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className={`flex items-center gap-1 text-xs font-semibold ${streak > 0 ? "text-orange-400" : th.textMuted}`}>
                  <Flame size={13} /> {t("streakDays", lang, { n: String(streak) })}
                </span>
                {h.targetPerDay > 1 && (
                  <span className={`text-xs ${th.textMuted}`}>{info.count}/{h.targetPerDay}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => { setEditingHabit(h); setShowHabitModal(true); }}
                className={`p-2 rounded-xl ${th.cardHover} ${th.textMuted}`}><Pencil size={16} /></button>
              <button onClick={() => setConfirmDeleteHabit(h)}
                className={`p-2 rounded-xl ${th.cardHover} text-red-500/70`}><Trash2 size={16} /></button>
            </div>
          </div>
        </>
        )}
      </motion.div>
    );
  };

  // Aktif alışkanlık listesi: paketsizler + kapalı çekmece halindeki paketler.
  const renderActiveList = () => {
    return (
      <>
        {habitGroups.standalone.map((h) => (
          <Fragment key={h.id}>{renderHabitCard(h)}</Fragment>
        ))}
        {habitGroups.packs.map((pack) => {
          const isOpen = !!expandedPacks[pack.id];
          const done = pack.habits.filter((x) => habitLogFor(x, logs, today).complete).length;
          return (
            <div key={pack.id}>
              <button onClick={() => togglePack(pack.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition ${th.card}`}>
                <span className="text-lg">{pack.emoji}</span>
                <span className={`flex-1 text-left text-sm font-bold truncate ${th.textPrimary}`}>{t(pack.nameKey ?? pack.id, lang)}</span>
                <span className={`text-xs font-semibold ${done === pack.habits.length ? th.accent3 : th.textMuted}`}>
                  {done}/{pack.habits.length}
                </span>
                <ChevronDown size={16} className={`shrink-0 transition-transform ${th.textMuted} ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="pt-2 pr-0.5 pl-0.5 space-y-2.5">
                      {pack.habits.map((x) => (
                        <Fragment key={x.id}>{renderHabitCard(x)}</Fragment>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </>
    );
  };
  const [showGraceModal, setShowGraceModal] = useState(false);
  const [gracePayload, setGracePayload] = useState<{ recoveryIds: string[]; resetIds: string[]; completedIds: string[] }>({ recoveryIds: [], resetIds: [], completedIds: [] });
  const [recovering, setRecovering] = useState(false);
  const [toast, setToast] = useState("");

  // Ödüllü reklamla kilit: oturum başına 1 kere. Reklam kapalıyken herkese açık.
  const [chartsUnlocked, setChartsUnlocked] = useState(isRewardedUnlockedThisSession());

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3200); };

  // ---- Challenge değerlendirmesi (kurtarma / sıfırlama / tamamlama) ----
  // Yalnızca GERÇEK geçişlerde (recovery false→true, status değişimi, startDate
  // ileri taşınması) uyarı gösterilir — her açılışta aynı uyarı tekrarlanmaz.
  const runEvaluation = () => {
    const s = stateRef.current;
    const before = new Map<string, Challenge>(s.challenges.map((c) => [c.id, c]));
    const { challenges: nextCh, evals } = evaluateChallenges(s.challenges, s.habits, s.logs, todayStr());
    if (nextCh !== s.challenges) {
      setStateRaw((prev) => ({ ...prev, challenges: nextCh }));
    }
    const recoveryIds: string[] = [];
    const resetIds: string[] = [];
    const completedIds: string[] = [];
    for (const c of nextCh) {
      const beforeC = before.get(c.id);
      if (!beforeC) continue;
      if (beforeC.status === "active" && c.status === "completed") completedIds.push(c.id);
      if (!beforeC.needsRecovery && c.needsRecovery) recoveryIds.push(c.id);
      if (beforeC.status === "active" && c.status === "active" && beforeC.startDate !== c.startDate) resetIds.push(c.id);
    }
    if (recoveryIds.length || resetIds.length || completedIds.length) {
      setGracePayload({ recoveryIds, resetIds, completedIds });
      setTimeout(() => setShowGraceModal(true), 350);
    }
  };

  // Uygulama açılışında + gün değiştiğinde değerlendir.
  useEffect(() => { runEvaluation(); }, [dayKey]);

  // Yeni günü algıla (süre kontrolü).
  useEffect(() => {
    const id = setInterval(() => setDayKey(todayStr()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  // ---- Banner reklam (kapalı) ----
  const [bannerHeight, setBannerHeight] = useState(0);
  useEffect(() => {
    if (!SHOW_BANNER_ADS) return;
    showBannerAd();
    const unsub = onBannerHeightChange(setBannerHeight);
    return unsub;
  }, []);

  // ---- Bildirim planlama (yerel, native'de) ----
  const habitsKey = useMemo(
    () => habits.map((h) => `${h.id}:${h.archived}:${h.frequency.kind === "daily" ? "d" : h.frequency.days.join("")}`).join("|"),
    [habits]
  );
  useEffect(() => {
    let alive = true;
    const run = () => {
      if (!alive) return;
      void scheduleNotifications(habits, logs, notifPrefs, lang);
    };
    const h = setTimeout(run, 1200);
    const onVis = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      clearTimeout(h);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habitsKey, notifPrefs.checkinOn, notifPrefs.checkinTime, notifPrefs.weeklyOn, notifPrefs.monthlyOn, dayKey, lang]);

  // ---- Türetilmiş görünüm verisi ----
  const todayStats = useMemo(() => getTodayStats(habits, logs, today), [habits, logs, today]);
  const last7 = useMemo(() => getLastNDays(habits, logs, 7, today), [habits, logs, today]);
  const maxCurrentStreak = useMemo(() => getMaxCurrentStreak(habits, logs, today), [habits, logs, today]);
  const streakMotivation = maxCurrentStreak > 0
    ? (todayStats.done === todayStats.due && todayStats.due > 0
        ? t("motivateAchieved", lang)
        : t("motivateKeep", lang, { n: String(maxCurrentStreak) }))
    : t("motivateStart", lang);
  const activeChallenges = useMemo(() => challenges.filter((c) => c.status === "active"), [challenges]);
  const doneChallenges = useMemo(() => challenges.filter((c) => c.status !== "active"), [challenges]);

  const intlLocale = { tr: "tr-TR", en: "en-US", de: "de-DE", ar: "ar-SA", ur: "ur-PK" }[lang] || "en-US";
  const todayLabel = new Intl.DateTimeFormat(intlLocale, { weekday: "short", day: "numeric", month: "short" }).format(new Date());

  const habitFor = (id: string) => habits.find((h) => h.id === id);
  const challengeHabitName = (c: Challenge) => {
    const h = habitFor(c.habitId);
    return h ? `${h.emoji} ${habitDisplayName(h, lang)}` : `${c.emoji} ${challengeDisplayName(c, lang)}`;
  };

  // ---- AKSİYONLAR ----
  const handleToggleHabit = (habitId: string, date: string) => {
    const s = stateRef.current;
    const h = s.habits.find((x) => x.id === habitId);
    if (!h) return;
    if (!isHabitDue(h, date)) { notify(t("selectDays", lang)); return; }
    setStateRaw((prev) => toggleLog(prev, habitId, date, h.targetPerDay));
    runEvaluation();
  };

  const handleSaveHabit = (data: { name: string; emoji: string; color: string; frequency: Habit["frequency"]; targetPerDay: number; unit: Unit }) => {
    const habitData = { ...data };
    if (editingHabit) {
      setStateRaw((prev) => updateHabit(prev, editingHabit.id, habitData));
      notify(t("saved", lang));
    } else {
      setStateRaw((prev) => addHabit(prev, habitData));
      notify(t("added", lang));
    }
    setShowHabitModal(false);
    setEditingHabit(null);
  };

  const handlePickTemplate = (tpl: ChallengeTemplate, name?: string, unit?: Unit, targetPerDay?: number) => {
    const finalName = (name || "").trim();
    const next = createChallengeFromTemplate(stateRef.current, tpl, finalName, todayStr(), lang, { unit, targetPerDay });
    setStateRaw(next);
    setTemplatePending(null);
    notify(t("startChallenge", lang));
  };

  // Detaylı grafik raporu ödüllü reklamla açılır (grafik merakı → reklam izleme).
  const handleOpenDetailStats = async () => {
    if (!ADVANCED_CHARTS_REWARD || chartsUnlocked) { setShowDetailStats(true); return; }
    const granted = await unlockWithRewardedInterstitial();
    if (granted) {
      setChartsUnlocked(true);
      setShowDetailStats(true);
    }
  };

  // Challenge kurtarma: ödüllü reklam izlenirse kaçırılan günleri tamamla.
  const handleRecoverChallenge = async (id: string) => {
    if (recovering) return;
    const s = stateRef.current;
    const ch = s.challenges.find((c) => c.id === id);
    if (!ch || ch.status !== "active" || !ch.needsRecovery) return;
    setRecovering(true);
    const unlocked = await unlockWithRewardedInterstitial({ skipCooldown: true });
    setRecovering(false);
    if (!unlocked) return;
    const next = recoverChallengeDays(s, id, todayStr());
    setStateRaw(next);
    setShowGraceModal(false);
    notify(t("recoveryDone", lang));
  };

  const handleCancelChallenge = (id: string) => {
    setStateRaw((prev) => deleteChallenge(prev, id));
    setChallengeDetail(null);
    notify(t("cancelChallengeConfirm", lang));
  };

  const handleToggleChallengeDay = (date: string) => {
    if (!challengeDetail) return;
    setStateRaw((prev) => toggleChallengeDay(prev, challengeDetail.id, date));
    runEvaluation();
  };

  // ---- Zamanlayıcı kontrolleri (süreli habit'ler) ----
  const handleStartTimer = (habitId: string) => {
    setTimerFor(habitId);
    const base = Date.now();
    setTimerStart(base);
    setElapsedMs(0);
    setTimerReached(false);
    setTimerRunning(true);
  };
  const handlePauseTimer = () => {
    setTimerRunning(false);
  };
  const handleResumeTimer = () => {
    if (!timerFor) return;
    setTimerStart(Date.now() - elapsedMs);
    setTimerRunning(true);
  };
  const handleFinishTimer = (elapsed = elapsedMs) => {
    if (!timerFor) return;
    const habit = habits.find((h) => h.id === timerFor);
    const minutes = Math.max(1, Math.round(elapsed / 60000));
    setStateRaw((prev) => {
      const existing = prev.logs.find((l) => l.habitId === timerFor && l.date === today);
      const base = existing ? existing.count : 0;
      return setLogCount(prev, timerFor, today, base + minutes);
    });
    setTimerFor(null);
    setTimerRunning(false);
    setElapsedMs(0);
    setTimerReached(false);
    if (habit) notify(`${t("added", lang)} ⏱ ${minutes} ${t("minutes", lang)}`);
  };
  const handleResetTimer = () => {
    setTimerFor(null);
    setTimerRunning(false);
    setElapsedMs(0);
    setTimerReached(false);
  };

  const hdrBtnBg = isLight(themeKey) ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10";
  const hdrBtnText = th.textSecondary;

  return (
    <div dir={lang === "ar" || lang === "ur" ? "rtl" : "ltr"}
      style={{ paddingBottom: bannerHeight ? bannerHeight + 12 : undefined }}
      className={`min-h-screen ${th.bg} ${th.textPrimary} relative overflow-clip p-3 sm:p-6 md:p-8 transition-colors duration-700`}>
      <div className={`pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl ${th.blob1}`} />
      <div className={`pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl ${th.blob2}`} />

      <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 sm:gap-5 relative z-10 animate-fadeIn">

        {/* Header — Hava Durumu uygulamasıyla birebir aynı çerçeve */}
        <header className="flex flex-col gap-[8px] pb-[8px]">
          <div className="flex justify-between items-center gap-[8px]">
            <button onClick={() => { setSettingsTab("hakkinda"); setShowSettings(true); }}
              className="cursor-pointer select-none hover:opacity-75 transition-opacity duration-200 text-left shrink-0">
              <div className={`text-[28px] font-extrabold tracking-widest ${th.accent} leading-none`}>MECCANEN</div>
            </button>
            <div className="flex items-center gap-[10px] min-w-0">
              <button onClick={() => setShowCalendar(true)}
                className={`inline-flex items-center gap-[8px] h-[48px] px-[18px] border rounded-full text-[16px] font-bold ${th.accent} ${hdrBtnBg} transition-all cursor-pointer min-w-0 max-w-[42vw]`}>
                <Calendar size={18} className="shrink-0" /><span className="truncate">{todayLabel}</span>
              </button>
              <button onClick={() => { setSettingsTab("tema"); setShowSettings(true); }}
                className={`w-[48px] h-[48px] flex items-center justify-center border rounded-full transition-all cursor-pointer shrink-0 ${hdrBtnBg} ${hdrBtnText}`}>
                <Settings size={24} />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center gap-[8px]">
            <div className="flex items-center gap-[8px] min-w-0">
              <span className={`text-[15px] font-semibold truncate ${th.textSecondary}`}>{t("appName", lang)}</span>
            </div>
            <div className="flex items-center gap-[10px] shrink-0">
              <button onClick={() => {
                const order: FontScale[] = ["normal", "large", "xlarge"];
                const next = order[(order.indexOf(fontScale) + 1) % order.length];
                setFontScale(next);
              }}
                title={t("fontSize", lang)}
                className={`w-[48px] h-[48px] flex items-center justify-center text-[17px] font-extrabold border rounded-full transition-all cursor-pointer ${hdrBtnBg} ${hdrBtnText}`}>
                Aa
              </button>
              <button onClick={() => {
                const order: LangCode[] = ["tr", "en", "ar", "de", "ur"];
                const next = order[(order.indexOf(lang) + 1) % order.length];
                setLang(next);
              }}
                className={`px-[18px] h-[48px] flex items-center justify-center text-[16px] font-bold border rounded-full transition-all cursor-pointer ${hdrBtnBg} ${hdrBtnText}`}>
                {lang.toUpperCase()}
              </button>
              <button onClick={() => {
                const order = Object.keys(THEMES) as ThemeKey[];
                const next = order[(order.indexOf(themeKey) + 1) % order.length];
                setTheme(next);
              }}
                title={t("changeTheme", lang)}
                className={`w-[48px] h-[48px] flex items-center justify-center border rounded-full transition-all cursor-pointer ${hdrBtnBg} ${hdrBtnText}`}>
                <Palette size={19} />
              </button>
            </div>
          </div>
        </header>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] rounded-full border px-4 py-2 text-sm font-semibold ${th.card} ${th.accent} shadow-xl`}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bugün kartı — ilerleme halkası */}
        <section className={`${th.card} border rounded-3xl p-6 sm:p-7 transition-all duration-300 shadow-2xl relative overflow-hidden`}>
          <div className="relative flex items-center gap-5">
            <div className={`relative shrink-0 ${th.accent}`}>
              <ProgressRing pct={todayStats.pct} className={th.accent} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold leading-none">%{todayStats.pct}</span>
                <span className={`text-[10px] uppercase ${th.textSecondary}`}>{t("todayTitle", lang)}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className={`text-lg font-bold ${th.textPrimary}`}>
                {todayStats.done === 0 && todayStats.due === 0
                  ? t("noHabits", lang)
                  : todayStats.done === todayStats.due && todayStats.due > 0
                    ? t("goalReached", lang)
                    : t("todayProgress", lang)}
              </p>
              <p className={`text-sm ${th.textSecondary}`}>
                {t("doneOf", lang, { done: String(todayStats.done), due: String(todayStats.due) })}
              </p>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowCalendar(true)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border ${th.card} ${th.accent}`}>
                  <Calendar size={14} /> {t("calendar", lang)}
                </button>
                <button onClick={() => setShowStats(true)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border ${th.card} ${th.accent2}`}>
                  <BarChart3 size={14} /> {t("stats", lang)}
                </button>
              </div>
            </div>
          </div>

          {/* Son 7 gün mini çubuğu */}
          <div className="mt-5 flex items-end gap-1.5 h-12">
            {last7.map((d) => {
              const pct = d.due === 0 ? 0 : Math.round((d.done / d.due) * 100);
              return (
                <div key={d.date} className={`flex-1 rounded-md ${th.accent} bg-current`}
                  style={{ height: `${Math.max(4, (pct / 100) * 44)}px`, opacity: d.due === 0 ? 0.12 : 0.3 + 0.7 * (pct / 100) }} />
              );
            })}
          </div>
        </section>

        {/* Seri özet kartı — merak uyandıran özet; detaylar için dokun → (ödüllü reklam) detaylı grafikler */}
        <button onClick={handleOpenDetailStats}
          className={`w-full rounded-3xl border p-5 text-left transition-all active:scale-[0.98] ${th.card}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs uppercase tracking-wide ${th.textMuted}`}>{t("yourStreak", lang)}</span>
            {ADVANCED_CHARTS_REWARD && !chartsUnlocked ? (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-500">
                <Lock size={11} /> {t("chartsLocked", lang)}
              </span>
            ) : (
              <span className={`text-[10px] font-semibold ${th.accent2}`}>{t("tapForDetails", lang)}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className={`shrink-0 w-16 h-16 rounded-2xl border flex items-center justify-center ${th.accent3} bg-current/20`}>
              <Flame size={30} strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-4xl font-extrabold leading-none ${th.accent3}`}>{maxCurrentStreak}</span>
                <span className={`text-sm font-semibold ${th.textSecondary}`}>{t("dayStreak", lang, { n: "" })}</span>
              </div>
              <p className={`text-sm mt-1.5 ${th.textPrimary}`}>{streakMotivation}</p>
            </div>
            <ChevronRight size={20} className={`shrink-0 ${th.textMuted}`} />
          </div>
        </button>

        {/* Alışkanlıklar */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className={`font-bold text-lg ${th.textPrimary}`}>{t("habitsTitle", lang)}</h2>
          </div>

          {activeHabits.length === 0 && (
            <div className={`rounded-3xl border-2 border-dashed p-6 text-center ${th.card}`}>
              <p className="text-4xl">🌱</p>
              <p className={`font-semibold text-sm mt-2 ${th.textPrimary}`}>{t("noHabits", lang)}</p>
              <p className={`text-xs mt-1 ${th.textMuted}`}>{t("noHabitsDesc", lang)}</p>
            </div>
          )}

          <div className="space-y-2.5">
            {renderActiveList()}
          </div>
        </section>

        {/* Hazır alışkanlık setleri */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className={th.accent} />
            <h2 className={`font-bold text-lg ${th.textPrimary}`}>{t("habitSetsTitle", lang)}</h2>
          </div>
          <p className={`text-xs ${th.textMuted} -mt-2`}>{t("habitSetsSub", lang)}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {HABIT_SETS.map((set) => {
              const added = isHabitSetAdded(state, set.id);
              return (
              <motion.button key={set.id} whileTap={{ scale: 0.97 }}
                onClick={() => setHabitSetPreview(set)}
                className={`text-left rounded-3xl border p-3 sm:p-4 shadow-xl transition ${th.card} ${th.cardHover} relative`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl drop-shadow">{set.emoji}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${added ? "text-green-500" : th.cardHover}`}>
                    {added ? <Check size={16} /> : <Plus size={16} className={th.accent} />}
                  </div>
                </div>
                <p className={`font-bold text-sm leading-tight ${th.textPrimary}`}>{t(set.nameKey, lang)}</p>
                <p className={`text-[11px] leading-snug mt-1 ${th.textMuted}`}>{t(set.descKey, lang)}</p>
                <div className={`flex items-center gap-1 mt-2 text-[11px] font-semibold ${added ? "text-green-500" : th.textSecondary}`}>
                  <span>{set.habits.length}</span>
                  <span>{t("habitSetsItems", lang)}</span>
                  {added && <span>· {t("habitSetAddedTag", lang)}</span>}
                </div>
              </motion.button>
              );
            })}
          </div>
        </section>

        {/* Challenge Paketleri */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className={th.accent} />
            <h2 className={`font-bold text-lg ${th.textPrimary}`}>{t("challengePacksTitle", lang)}</h2>
          </div>
          <p className={`text-xs ${th.textMuted} -mt-2`}>{t("challengePacksSub", lang)}</p>
          <div ref={challengePacksRef} className="scroll-mt-4" />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CHALLENGE_TEMPLATES.filter((x) => x.kind === "pack").map((tpl) => (
              <motion.button key={tpl.id} whileTap={{ scale: 0.97 }}
                onClick={() => setTemplatePending(tpl)}
                className={`text-left rounded-3xl border p-3 sm:p-4 shadow-xl transition ${th.card} ${th.cardHover} relative`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl drop-shadow">{tpl.emoji}</span>
                  <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${th.accent} ${th.card}`}>
                    {t(`days${tpl.days}`, lang)}
                  </span>
                </div>
                <p className={`font-bold text-sm leading-tight ${th.textPrimary}`}>{t(tpl.nameKey, lang)}</p>
                <p className={`text-[11px] leading-snug mt-1 ${th.textMuted}`}>{t(`${tpl.nameKey}Desc`, lang)}</p>
                <div className={`flex items-center gap-1 mt-2 text-[11px] font-semibold ${th.textSecondary}`}>
                  <span>{tpl.habitEmoji ?? tpl.emoji}</span>
                  <span>{tpl.targetPerDay}</span>
                  <span>{tpl.habitUnit === "minutes" ? t("minutes", lang) : t("times", lang)} / {t("daily", lang).toLowerCase()}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Challenge'larım */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className={th.accent} />
            <h2 className={`font-bold text-lg ${th.textPrimary}`}>{t("challengesTitle", lang)}</h2>
          </div>
          <p className={`text-xs ${th.textMuted} -mt-2`}>{t("challengesSub", lang)}</p>

          {activeChallenges.length === 0 && (
            <button onClick={scrollToChallengePacks}
              className={`w-full text-left rounded-3xl border-2 border-dashed p-5 transition ${th.card} ${th.cardHover}`}>
              <div className="flex items-center gap-4">
                <span className="text-3xl">🏆</span>
                <div>
                  <p className={`font-semibold text-sm ${th.textPrimary}`}>{t("challengesEmpty", lang)}</p>
                  <p className={`text-xs mt-1 ${th.textMuted}`}>{t("challengesEmptyDesc", lang)}</p>
                </div>
              </div>
            </button>
          )}

          {activeChallenges.map((c) => {
            const h = habitFor(c.habitId);
            const prog = getChallengeProgress(c, h, logs, today);
            const cc = h ? colorClass(h, th) : th.accent;
            const risk = !!h && isHabitDue(h, today) && !isHabitComplete(h, logs, today);
            return (
              <motion.button key={c.id} whileTap={{ scale: 0.98 }}
                onClick={() => setChallengeDetail(c)}
                className={`w-full text-left rounded-3xl border p-4 sm:p-5 shadow-xl transition ${th.card} relative overflow-hidden`}>
                <div className="flex items-center gap-4">
                  <span className="text-4xl drop-shadow-lg">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-base truncate ${th.textPrimary}`}>{challengeDisplayName(c, lang)}</p>
                      {c.needsRecovery && (
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-500/40 text-orange-500`}>{t("recoveryBadge", lang)}</span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${th.textMuted}`}>
                      {t("dayNumber", lang, { n: String(Math.min(c.totalDays, prog.doneDays + 1)) })} · {t(prog.leftDays === 1 ? "dayLeft" : "daysLeft", lang, { n: String(prog.leftDays) })}
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-black/15 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${cc} bg-current`} style={{ width: `${prog.pct}%` }} />
                    </div>
                  </div>
                  <ChevronRight size={20} className={`shrink-0 ${th.textMuted} -scale-x-100 rtl:scale-x-100`} />
                </div>
                {risk && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-red-500">
                    <Trophy size={13} /> {t("challengeWarn", lang)}
                  </div>
                )}
              </motion.button>
            );
          })}

          {doneChallenges.length > 0 && (
            <div className="space-y-2">
              {doneChallenges.map((c) => (
                <button key={c.id} onClick={() => setChallengeDetail(c)}
                  className={`w-full text-left rounded-2xl border p-3 opacity-80 ${th.card}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.emoji}</span>
                    <p className={`flex-1 text-sm font-semibold truncate ${th.textPrimary}`}>
                      {challengeDisplayName(c, lang)}
                      <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.status === "completed" ? "border-emerald-500/40 text-emerald-500" : "border-rose-500/40 text-rose-500"}`}>
                        {c.status === "completed" ? t("challengeCompleted", lang) : t("challengeFailed", lang)}
                      </span>
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Özelleştir */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Settings size={18} className={th.accent} />
            <h2 className={`font-bold text-lg ${th.textPrimary}`}>{t("customizeTitle", lang)}</h2>
          </div>
          <p className={`text-xs ${th.textMuted} -mt-2`}>{t("customizeSub", lang)}</p>

          <div className={`rounded-3xl border ${th.card} overflow-hidden`}>
            <button onClick={() => setCustomHabitOpen(!customHabitOpen)}
              className={`w-full flex items-center justify-between gap-3 p-4 text-left transition`}>
              <span className="flex items-center gap-3">
                <span className="text-2xl">✏️</span>
                <span className={`font-bold text-sm ${th.textPrimary}`}>{t("customHabitAcc", lang)}</span>
              </span>
              <ChevronDown size={20} className={`shrink-0 transition-transform ${customHabitOpen ? "rotate-180" : ""} ${th.textMuted}`} />
            </button>
            <AnimatePresence initial={false}>
              {customHabitOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                  <div className="px-4 pb-5 pt-2 border-t">
                    <HabitModal existing={null} onSave={handleSaveHabit} onClose={() => setCustomHabitOpen(false)} th={th} lang={lang} inline />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={`rounded-3xl border ${th.card} overflow-hidden`}>
            <button onClick={() => setCustomChallengeOpen(!customChallengeOpen)}
              className={`w-full flex items-center justify-between gap-3 p-4 text-left transition`}>
              <span className="flex items-center gap-3">
                <span className="text-2xl">🏁</span>
                <span className={`font-bold text-sm ${th.textPrimary}`}>{t("customChallengeAcc", lang)}</span>
              </span>
              <ChevronDown size={20} className={`shrink-0 transition-transform ${customChallengeOpen ? "rotate-180" : ""} ${th.textMuted}`} />
            </button>
            <AnimatePresence initial={false}>
              {customChallengeOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                  <div className="px-4 pb-5 pt-3 border-t">
                    <div className="grid grid-cols-3 gap-2.5">
                      {CHALLENGE_TEMPLATES.filter((x) => x.kind === "days").map((tpl) => (
                        <motion.button key={tpl.id} whileTap={{ scale: 0.97 }}
                          onClick={() => setTemplatePending(tpl)}
                          className={`text-left rounded-2xl border p-3 transition ${th.card} ${th.cardHover}`}>
                          <span className="text-2xl block">{tpl.emoji}</span>
                          <p className={`font-semibold text-xs mt-1.5 leading-tight ${th.textPrimary}`}>{t(tpl.nameKey, lang)}</p>
                          <p className={`text-[10px] mt-0.5 ${th.textMuted}`}>{t(`days${tpl.days}`, lang)}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <p className={`text-center text-xs ${th.textMuted} pt-2 pb-4`}>{t("tagline", lang)}</p>
      </div>

      {/* ---- MODALLER ---- */}
      {showSettings && (
        <SettingsPanel theme={themeKey} setTheme={setTheme} lang={lang} setLang={setLang}
          setFontScale={setFontScale} setState={setStateRaw} onNotify={notify}
          notifPrefs={notifPrefs} setNotifPrefs={setNotifPrefs}
          onClose={() => setShowSettings(false)} th={th} initialTab={settingsTab} />
      )}

      {showHabitModal && (
        <HabitModal existing={editingHabit} onSave={handleSaveHabit}
          onClose={() => { setShowHabitModal(false); setEditingHabit(null); }} th={th} lang={lang} />
      )}

      {templatePending && (
        <TemplateNameModal template={templatePending}
          onSave={(name, unit, targetPerDay) => handlePickTemplate(templatePending, name, unit, targetPerDay)}
          onClose={() => setTemplatePending(null)} th={th} lang={lang} />
      )}

      {challengeDetail && (
        <ChallengeDetailModal challenge={challengeDetail} habit={habitFor(challengeDetail.habitId)}
          logs={logs} today={today} onToggle={handleToggleChallengeDay}
          onRecover={handleRecoverChallenge} recovering={recovering}
          onCancel={() => handleCancelChallenge(challengeDetail.id)}
          onClose={() => setChallengeDetail(null)} th={th} lang={lang} />
      )}

      {showCalendar && (
        <CalendarModal habits={habits} logs={logs} onToggle={handleToggleHabit}
          onClose={() => setShowCalendar(false)} th={th} lang={lang} />
      )}

      {showStats && (
        <StatsModal habits={habits} logs={logs} onClose={() => setShowStats(false)} th={th} lang={lang} />
      )}

      {showDetailStats && (
        <DetailStatsModal habits={habits} logs={logs} onClose={() => setShowDetailStats(false)} th={th} lang={lang} />
      )}

      {habitSetPreview && (
        <Modal onClose={() => setHabitSetPreview(null)} th={th}>
          <ModalHeader title={`${habitSetPreview.emoji} ${t(habitSetPreview.nameKey, lang)}`}
            onClose={() => setHabitSetPreview(null)} th={th} />
          <div className="p-5 space-y-4 flex flex-col min-h-0 flex-1">
            <p className={`text-xs ${th.textMuted}`}>{t(habitSetPreview.descKey, lang)}</p>

            <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
              {habitSetPreview.habits.map((h, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-xl border p-3 ${th.card}`}>
                  <span className="text-2xl">{h.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${th.textPrimary}`}>{t(h.nameKey, lang)}</p>
                    <p className={`text-xs ${th.textMuted}`}>
                      {h.unit === "minutes"
                        ? `${h.targetPerDay} ${t("minutes", lang)} / ${t("daily", lang).toLowerCase()}`
                        : `${h.targetPerDay} ${t("times", lang)} / ${t("daily", lang).toLowerCase()}`}
                      {h.frequency.kind === "weekly" && ` · ${h.frequency.days.length} ${t("weekly", lang).toLowerCase()}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {isHabitSetAdded(state, habitSetPreview.id) ? (
              <button disabled
                className={`w-full shrink-0 py-3 rounded-xl text-sm font-bold border ${th.card} text-green-500`}>
                ✓ {t("habitSetAddedTag", lang)}
              </button>
            ) : (
              <button onClick={() => {
                setStateRaw((prev) => addHabitSet(prev, habitSetPreview));
                setHabitSetPreview(null);
                notify(t("habitSetAdded", lang));
              }}
                className={`w-full shrink-0 py-3 rounded-xl text-sm font-bold ${th.accent}`}>
                {t("habitSetAddBtn", lang)}
              </button>
            )}
          </div>
        </Modal>
      )}

      {confirmDeleteHabit && (
        <Modal onClose={() => setConfirmDeleteHabit(null)} th={th}>
          <ModalHeader title={t("deleteHabitTitle", lang)} onClose={() => setConfirmDeleteHabit(null)} th={th} />
          <div className="p-5 space-y-4">
            <p className={`text-sm ${th.textSecondary}`}>{t("deleteHabitDesc", lang)}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteHabit(null)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border ${th.card} ${th.textSecondary}`}>
                {t("cancel", lang)}
              </button>
              <button onClick={() => {
                setStateRaw((prev) => deleteHabit(prev, confirmDeleteHabit.id));
                setConfirmDeleteHabit(null);
                notify(t("deleted", lang));
              }}
                className={`flex-[2] py-3 rounded-xl text-sm font-bold border-2 border-red-500/40 text-red-500`}>
                {t("delete", lang)}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showGraceModal && (
        <GraceModal recoveryChallenges={gracePayload.recoveryIds} resetChallenges={gracePayload.resetIds}
          completedChallenges={gracePayload.completedIds} challenges={challenges}
          onRecover={handleRecoverChallenge} recovering={recovering}
          onClose={() => setShowGraceModal(false)} th={th} lang={lang} />
      )}
    </div>
  );
}