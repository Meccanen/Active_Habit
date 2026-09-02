import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check, Settings, Palette, X, Plus, Trash2, Pencil, Flame, Calendar,
  BarChart3, Trophy, ChevronRight, ChevronLeft, Zap, Shield,
  Mail, Lock, Star,
} from "lucide-react";
import type { Habit, Challenge, ChallengeTemplate } from "./types";
import { t, detectLanguage, LangCode } from "./utils/i18n";
import {
  HABIT_EMOJIS, HABIT_COLORS, CHALLENGE_TEMPLATES,
  loadState, saveState, addHabit, updateHabit, deleteHabit,
  toggleLog, createChallengeFromTemplate, createCustomChallenge,
  deleteChallenge, toggleChallengeDay,
  getActiveHabits, habitLogFor,
} from "./services/habitService";
import {
  todayStr, addDays, getCurrentStreak, getBestStreak,
  getTodayStats, getCompletionRate, getLastNDays, getMonthCells,
  getChallengeProgress, getChallengeEndDate, isHabitComplete, isHabitDue,
} from "./utils/habitHelper";
import { evaluateChallenges } from "./utils/habitHelper";
import {
  showBannerAd, onBannerHeightChange, unlockWithRewardedInterstitial,
  isRewardedUnlockedThisSession,
} from "./services/adMobService";
import { checkIsSupporter } from "./services/billingService";

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
 * Reklam özellikleri şu an kapalı. İleride açılacak:
 * - CUSTOM_CHALLENGE_REWARD: özel challenge oluşturmak için ödüllü reklam izletecek.
 * - SHOW_BANNER_ADS: ana ekranda altta banner reklam gösterecek.
 */
const CUSTOM_CHALLENGE_REWARD = false;
const SHOW_BANNER_ADS = false;

/** Habit rengi → tema sınıfı çevirici (accent ailesi temaya bağımlı). */
function colorClass(habit: Habit, th: typeof THEMES[ThemeKey]): string {
  switch (habit.color) {
    case "accent": return th.accent;
    case "accent2": return th.accent2;
    case "accent3": return th.accent3;
    default: return habit.color;
  }
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
// AYARLAR PANELİ — Tema / Dil / Hakkında (Destekçi Rozeti dahil)
// ============================================================================
function SettingsPanel({
  theme, setTheme, onClose, th, lang, setLang, initialTab,
}: {
  theme: ThemeKey; setTheme: (k: ThemeKey) => void;
  onClose: () => void; th: typeof THEMES[ThemeKey];
  lang: LangCode; setLang: (l: LangCode) => void;
  initialTab?: "tema" | "dil" | "hakkinda";
}) {
  const [tab, setTab] = useState<"tema" | "dil" | "hakkinda">(initialTab || "tema");
  const [isSupporter, setIsSupporter] = useState(false);
  useEffect(() => { checkIsSupporter().then(setIsSupporter); }, []);

  const LANGUAGES: { code: LangCode; label: string }[] = [
    { code: "tr", label: "Türkçe" }, { code: "en", label: "English" },
    { code: "de", label: "Deutsch" }, { code: "ar", label: "العربية" },
    { code: "ur", label: "اردو" },
  ];

  return (
    <Modal onClose={onClose} th={th}>
      <ModalHeader title={t("settings", lang)} onClose={onClose} th={th} />
      <div className={`flex border-b ${th.header} px-2`}>
        {(["tema", "dil", "hakkinda"] as const).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`flex-1 py-3 text-sm font-medium transition ${tab === tb ? th.accent : th.textMuted}`}>
            {tb === "tema" ? t("themeTab", lang) : tb === "dil" ? t("language", lang) : t("about", lang)}
          </button>
        ))}
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
              <a href="https://meccanen.github.io/Hava_Durumu/privacy-policy-en.html" target="_blank" rel="noopener noreferrer"
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
function HabitModal({ existing, onSave, onClose, th, lang }: {
  existing: Habit | null;
  onSave: (h: { name: string; emoji: string; color: string; frequency: Habit["frequency"]; targetPerDay: number }) => void;
  onClose: () => void; th: typeof THEMES[ThemeKey]; lang: LangCode;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(existing?.name || "");
  const [emoji, setEmoji] = useState(existing?.emoji || HABIT_EMOJIS[0]);
  const [color, setColor] = useState(existing?.color || "accent");
  const [freqKind, setFreqKind] = useState<"daily" | "weekly">(existing?.frequency.kind || "daily");
  const [days, setDays] = useState<number[]>(
    existing?.frequency.kind === "weekly" ? existing.frequency.days : [1, 2, 3, 4, 5]
  );
  const [target, setTarget] = useState(String(existing?.targetPerDay || 1));

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
      targetPerDay: Math.max(1, parseInt(target, 10) || 1),
    });
  };

  const weekdayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const weekdayDayValue: number[] = [1, 2, 3, 4, 5, 6, 0];

  return (
    <Modal onClose={onClose} th={th}>
      <ModalHeader title={existing ? t("editHabit", lang) : t("newHabit", lang)} onClose={onClose} th={th} />
      <div className="overflow-y-auto flex-1 p-5 space-y-5">
        <div className="flex items-center justify-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`h-1.5 rounded-full transition-all ${s === step ? `w-8 ${th.accent} bg-current` : "w-4 bg-black/15"}`} />
          ))}
        </div>

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
              <div className="flex items-center gap-2">
                <input type="text" inputMode="numeric" pattern="[0-9]*" min={1} max={99} value={target}
                  onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))}
                  className={`w-24 px-4 py-3 rounded-xl border bg-transparent text-sm outline-none ${th.card} ${th.textPrimary}`} />
                <span className={`text-sm ${th.textSecondary}`}>{t("timesPerDay", lang)}</span>
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
                    {freqKind === "daily" ? t("daily", lang) : `${days.length} ${t("weekly", lang).toLowerCase()}`} · {Math.max(1, parseInt(target, 10) || 1)} {t("times", lang)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`p-5 border-t ${th.header}`}>
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
      </div>
    </Modal>
  );
}

// ============================================================================
// CHALLENGE SEÇİCİ — şablonlar + özel
// ============================================================================
function ChallengePicker({ onPickTemplate, onCustom, onClose, th, lang, customUnlocked }: {
  onPickTemplate: (tpl: ChallengeTemplate) => void;
  onCustom: () => void;
  onClose: () => void; th: typeof THEMES[ThemeKey]; lang: LangCode;
  customUnlocked: boolean;
}) {
  return (
    <Modal onClose={onClose} th={th}>
      <ModalHeader title={t("newChallenge", lang)} onClose={onClose} th={th} />
      <div className="overflow-y-auto flex-1 p-5 space-y-4">
        <p className={`text-xs uppercase tracking-wide ${th.textMuted}`}>{t("templatesTitle", lang)}</p>
        {CHALLENGE_TEMPLATES.map((tpl) => (
          <button key={tpl.id} onClick={() => onPickTemplate(tpl)}
            className={`w-full text-left rounded-2xl border p-4 transition active:scale-[0.98] ${th.card} ${th.cardHover}`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{tpl.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${th.textPrimary}`}>{t(tpl.nameKey, lang)}</p>
                <p className={`text-xs mt-0.5 ${th.textMuted}`}>
                  {t(`${tpl.nameKey}Desc`, lang)}
                </p>
              </div>
              <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border ${th.accent} ${th.card}`}>
                {t(`days${tpl.days}`, lang)}
              </span>
            </div>
          </button>
        ))}

        <div className="pt-2">
          <button onClick={onCustom}
            className={`w-full text-left rounded-2xl border p-4 transition active:scale-[0.98] ${th.card} ${th.cardHover}`}>
            <div className="flex items-center gap-3">
              {customUnlocked ? (
                <span className="text-3xl">✨</span>
              ) : (
                <span className={`w-9 h-9 flex items-center justify-center rounded-xl ${th.accent} bg-current/10`}><Lock size={16} /></span>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${th.textPrimary}`}>{t("customChallenge", lang)}</p>
                <p className={`text-xs mt-0.5 ${th.textMuted}`}>{t("customChallengeDesc", lang)}</p>
              </div>
              {!customUnlocked && (
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-full border ${th.accent}`}>
                  {t("rewardSkipHint", lang)}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// ŞABLON CHALLENGE ADI MODALI
// ============================================================================
function TemplateNameModal({ template, onSave, onClose, th, lang }: {
  template: ChallengeTemplate;
  onSave: (name: string) => void;
  onClose: () => void; th: typeof THEMES[ThemeKey]; lang: LangCode;
}) {
  const [name, setName] = useState(t(template.nameKey, lang));

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
                {t(`days${template.days}`, lang)} · {template.targetPerDay} {t("timesPerDay", lang)}
              </p>
            </div>
          </div>
        </div>
        <div>
          <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("challengeName", lang)}</p>
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={60}
            placeholder={t(template.nameKey, lang)}
            className={`w-full px-4 py-3 rounded-xl border bg-transparent text-sm outline-none ${th.card} ${th.textPrimary}`} />
          <p className={`text-xs mt-1.5 ${th.textMuted}`}>{t("challengeNameHint", lang)}</p>
        </div>
      </div>
      <div className={`p-5 border-t ${th.header}`}>
        <button onClick={() => onSave(name)}
          className={`w-full py-3 rounded-xl text-sm font-bold border ${th.card} ${th.accent}`}>
          {t("startChallenge", lang)}
        </button>
      </div>
    </Modal>
  );
}

// ============================================================================
// ÖZEL CHALLENGE MODALI
// ============================================================================
function CustomChallengeModal({ onSave, onClose, th, lang }: {
  onSave: (o: { name: string; emoji: string; totalDays: number; startDate: string; targetPerDay: number; color: string }) => void;
  onClose: () => void; th: typeof THEMES[ThemeKey]; lang: LangCode;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [customDays, setCustomDays] = useState("30");
  const [startDate, setStartDate] = useState(todayStr());
  const [target, setTarget] = useState("1");
  const [color, setColor] = useState("accent");

  return (
    <Modal onClose={onClose} th={th}>
      <ModalHeader title={t("customChallenge", lang)} onClose={onClose} th={th} />
      <div className="overflow-y-auto flex-1 p-5 space-y-4">
        <div>
          <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("habitName", lang)}</p>
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
            className={`w-full px-4 py-3 rounded-xl border bg-transparent text-sm outline-none ${th.card} ${th.textPrimary}`} />
        </div>
        <div>
          <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("chooseIcon", lang)}</p>
          <div className="grid grid-cols-6 gap-2">
            {HABIT_EMOJIS.slice(0, 18).map((e) => (
              <button key={e} onClick={() => setEmoji(e)}
                className={`h-12 rounded-xl border text-xl transition ${emoji === e ? th.accent + " ring-2 ring-offset-2 " : th.card + " " + th.cardHover}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("daysTotal", lang).replace("{n}", "").trim()}</p>
          <div className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            <input type="text" inputMode="numeric" pattern="[0-9]*" min={3} max={365} value={customDays}
              onChange={(e) => setCustomDays(e.target.value.replace(/[^0-9]/g, ""))}
              className={`w-28 px-4 py-2.5 rounded-xl border bg-transparent text-sm outline-none ${th.card} ${th.textPrimary}`} />
            <span className={`text-sm ${th.textMuted}`}>{t("days", lang)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("startsOn", lang)}</p>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm outline-none ${th.card} ${th.textPrimary}`} />
          </div>
          <div>
            <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("targetPerDay", lang)}</p>
            <input type="text" inputMode="numeric" pattern="[0-9]*" min={1} max={99} value={target}
              onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))}
              className={`w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm outline-none ${th.card} ${th.textPrimary}`} />
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
      </div>
      <div className={`p-5 border-t ${th.header}`}>
        <button onClick={() => onSave({
          name: name.trim(),
          emoji,
          totalDays: Math.max(3, parseInt(customDays, 10) || 30),
          startDate,
          targetPerDay: Math.max(1, parseInt(target, 10) || 1),
          color,
        })}
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
function ChallengeDetailModal({ challenge, habit, logs, today, onToggle, onCancel, onClose, th, lang }: {
  challenge: Challenge;
  habit: Habit | undefined;
  logs: Parameters<typeof habitLogFor>[1];
  today: string;
  onToggle: (date: string) => void;
  onCancel: () => void;
  onClose: () => void; th: typeof THEMES[ThemeKey]; lang: LangCode;
}) {
  const [confirming, setConfirming] = useState(false);
  const progress = habit
    ? getChallengeProgress(challenge, habit, logs, today)
    : { doneDays: 0, leftDays: challenge.totalDays, pct: 0 };
  const end = getChallengeEndDate(challenge);
  const cc = habit ? colorClass(habit, th) : th.accent;

  return (
    <Modal onClose={onClose} th={th}>
      <ModalHeader title={challenge.name} onClose={onClose} th={th} />
      <div className="overflow-y-auto flex-1 p-5 space-y-4">
        <div className={`rounded-2xl border p-4 ${th.card}`}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{challenge.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${th.textPrimary}`}>{challenge.name}</p>
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

        {challenge.usedGrace && (
          <div className={`rounded-2xl border-2 border-orange-500/40 bg-orange-500/10 p-4 flex items-start gap-2`}>
            <Trophy size={18} className="text-orange-500 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-orange-500">
              {t("graceUsedDesc1", lang)} {t("graceUsedDesc2", lang)}
            </p>
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
                <p className={`text-sm font-semibold truncate ${th.textPrimary}`}>{habit.emoji} {habit.name}</p>
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

      <div className="p-5 space-y-4">
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
                  <span className={`flex-1 text-left text-sm truncate ${th.textPrimary}`}>{h.emoji} {h.name}</span>
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
// MAZERET / SIFIRLAMA UYARI MODALI
// ============================================================================
function GraceModal({ usedGraceChallenges, resetChallenges, completedChallenges, challenges, onClose, th, lang }: {
  usedGraceChallenges: string[];
  resetChallenges: string[];
  completedChallenges: string[];
  challenges: Challenge[];
  onClose: () => void; th: typeof THEMES[ThemeKey]; lang: LangCode;
}) {
  const nameOf = (id: string) => challenges.find((c) => c.id === id)?.name || "";
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
        {usedGraceChallenges.length > 0 && (
          <div className={`rounded-2xl border-2 border-orange-500/40 bg-orange-500/10 p-4 flex items-start gap-2`}>
            <Zap size={18} className="text-orange-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-orange-500">{t("graceUsedTitle", lang)}</p>
              {usedGraceChallenges.map((id) => (
                <p key={id} className="text-xs leading-relaxed text-orange-500"><b>{nameOf(id)}</b> — {t("graceUsedDesc1", lang)} {t("graceUsedDesc2", lang)}</p>
              ))}
            </div>
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

  // stateRef her zaman en güncel state'i tutar; otomatik kaydetme effect'i
  // her değişiklikte localStorage'a yazar.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
    saveState(state);
  }, [state]);

  const activeHabits = useMemo(() => getActiveHabits(state), [state]);

  // ---- Modaller ----
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"tema" | "dil" | "hakkinda">("tema");
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showChallengePicker, setShowChallengePicker] = useState(false);
  const [templatePending, setTemplatePending] = useState<ChallengeTemplate | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [challengeDetail, setChallengeDetail] = useState<Challenge | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [confirmDeleteHabit, setConfirmDeleteHabit] = useState<Habit | null>(null);
  const [showGraceModal, setShowGraceModal] = useState(false);
  const [gracePayload, setGracePayload] = useState<{ usedGraceIds: string[]; resetIds: string[]; completedIds: string[] }>({ usedGraceIds: [], resetIds: [], completedIds: [] });
  const [toast, setToast] = useState("");

  // Ödüllü reklamla kilit: oturum başına 1 kere. Reklam kapalıyken herkese açık.
  const [customUnlocked, setCustomUnlocked] = useState(isRewardedUnlockedThisSession());

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3200); };

  // ---- Challenge değerlendirmesi (mazeret / sıfırlama / tamamlama) ----
  // Yalnızca GERÇEK geçişlerde (grace false→true, status değişimi, startDate
  // ileri taşınması) uyarı gösterilir — her açılışta aynı uyarı tekrarlanmaz.
  const runEvaluation = () => {
    const s = stateRef.current;
    const before = new Map(s.challenges.map((c) => [c.id, c] as const));
    const { challenges: nextCh, evals } = evaluateChallenges(s.challenges, s.habits, s.logs, todayStr());
    if (nextCh !== s.challenges) {
      setStateRaw((prev) => ({ ...prev, challenges: nextCh }));
    }
    const usedGraceIds: string[] = [];
    const resetIds: string[] = [];
    const completedIds: string[] = [];
    for (const c of nextCh) {
      const beforeC = before.get(c.id);
      if (!beforeC) continue;
      if (beforeC.status === "active" && c.status === "completed") completedIds.push(c.id);
      if (!beforeC.usedGrace && c.usedGrace) usedGraceIds.push(c.id);
      if (beforeC.status === "active" && c.status === "active" && beforeC.startDate !== c.startDate) resetIds.push(c.id);
    }
    if (usedGraceIds.length || resetIds.length || completedIds.length) {
      setGracePayload({ usedGraceIds, resetIds, completedIds });
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

  // ---- Türetilmiş görünüm verisi ----
  const todayStats = useMemo(() => getTodayStats(habits, logs, today), [habits, logs, today]);
  const last7 = useMemo(() => getLastNDays(habits, logs, 7, today), [habits, logs, today]);
  const activeChallenges = useMemo(() => challenges.filter((c) => c.status === "active"), [challenges]);
  const doneChallenges = useMemo(() => challenges.filter((c) => c.status !== "active"), [challenges]);

  const intlLocale = { tr: "tr-TR", en: "en-US", de: "de-DE", ar: "ar-SA", ur: "ur-PK" }[lang] || "en-US";
  const todayLabel = new Intl.DateTimeFormat(intlLocale, { weekday: "short", day: "numeric", month: "short" }).format(new Date());

  const habitFor = (id: string) => habits.find((h) => h.id === id);
  const challengeHabitName = (c: Challenge) => {
    const h = habitFor(c.habitId);
    return h ? `${h.emoji} ${h.name}` : c.name;
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

  const handleSaveHabit = (data: { name: string; emoji: string; color: string; frequency: Habit["frequency"]; targetPerDay: number }) => {
    if (editingHabit) {
      setStateRaw((prev) => updateHabit(prev, editingHabit.id, data));
      notify(t("saved", lang));
    } else {
      setStateRaw((prev) => addHabit(prev, data));
      notify(t("added", lang));
    }
    setShowHabitModal(false);
    setEditingHabit(null);
  };

  const handlePickTemplate = (tpl: ChallengeTemplate, name?: string) => {
    const finalName = (name || "").trim() || t(tpl.nameKey, lang);
    const next = createChallengeFromTemplate(stateRef.current, tpl, finalName, todayStr(), lang);
    setStateRaw(next);
    setTemplatePending(null);
    setShowChallengePicker(false);
    notify(t("startChallenge", lang));
  };

  const handleSaveCustom = (o: { name: string; emoji: string; totalDays: number; startDate: string; targetPerDay: number; color: string }) => {
    setStateRaw(createCustomChallenge(stateRef.current, o));
    setShowCustomModal(false);
    setShowChallengePicker(false);
    notify(t("startChallenge", lang));
  };

  const handleOpenCustom = async () => {
    if (!CUSTOM_CHALLENGE_REWARD) { setCustomUnlocked(true); setShowCustomModal(true); return; }
    if (customUnlocked) { setShowCustomModal(true); return; }
    const granted = await unlockWithRewardedInterstitial();
    if (granted) {
      setCustomUnlocked(true);
      setShowCustomModal(true);
    }
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

  const hdrBtnBg = isLight(themeKey) ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10";
  const hdrBtnText = th.textSecondary;

  return (
    <div dir={lang === "ar" || lang === "ur" ? "rtl" : "ltr"}
      style={{ paddingBottom: bannerHeight ? bannerHeight + 12 : undefined }}
      className={`min-h-screen ${th.bg} ${th.textPrimary} relative overflow-hidden p-3 sm:p-6 md:p-8 transition-colors duration-700`}>
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

        {/* Alışkanlıklar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className={`font-bold text-lg ${th.textPrimary}`}>{t("habitsTitle", lang)}</h2>
            <button onClick={() => { setEditingHabit(null); setShowHabitModal(true); }}
              className={`inline-flex items-center gap-1.5 h-[40px] px-4 rounded-full border text-sm font-bold ${th.accent} ${hdrBtnBg} active:scale-95 transition`}>
              <Plus size={16} /> {t("addHabit", lang)}
            </button>
          </div>

          {activeHabits.length === 0 && (
            <div className={`rounded-3xl border-2 border-dashed p-6 text-center ${th.card}`}>
              <p className="text-4xl">🌱</p>
              <p className={`font-semibold text-sm mt-2 ${th.textPrimary}`}>{t("noHabits", lang)}</p>
              <p className={`text-xs mt-1 ${th.textMuted}`}>{t("noHabitsDesc", lang)}</p>
            </div>
          )}

          <div className="space-y-2.5">
            {activeHabits.map((h) => {
              const info = habitLogFor(h, logs, today);
              const streak = getCurrentStreak(h, logs, today);
              const cc = colorClass(h, th);
              return (
                <motion.div key={h.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-4 ${th.card}`}>
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
                        <p className={`text-sm font-semibold truncate ${th.textPrimary}`}>{h.name}</p>
                        {h.frequency.kind === "weekly" && (
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                              <span key={d} className={`w-1.5 h-1.5 rounded-full ${h.frequency.days.includes(d) ? cc + " bg-current" : "bg-black/15"}`} />
                            ))}
                          </div>
                        )}
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
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Challenge'lar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={18} className={th.accent} />
              <h2 className={`font-bold text-lg ${th.textPrimary}`}>{t("challengesTitle", lang)}</h2>
            </div>
            <button onClick={() => setShowChallengePicker(true)}
              className={`inline-flex items-center gap-1.5 h-[40px] px-4 rounded-full border text-sm font-bold ${th.accent} ${hdrBtnBg} active:scale-95 transition`}>
              <Plus size={16} /> {t("newChallenge", lang)}
            </button>
          </div>
          <p className={`text-xs ${th.textMuted} -mt-2`}>{t("challengesSub", lang)}</p>

          {activeChallenges.length === 0 && (
            <button onClick={() => setShowChallengePicker(true)}
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
                      <p className={`font-bold text-base truncate ${th.textPrimary}`}>{c.name}</p>
                      {c.usedGrace && (
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-500/40 text-orange-500`}>º1</span>
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
                      {c.name}
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

        <p className={`text-center text-xs ${th.textMuted} pt-2 pb-4`}>{t("tagline", lang)}</p>
      </div>

      {/* ---- MODALLER ---- */}
      {showSettings && (
        <SettingsPanel theme={themeKey} setTheme={setTheme} lang={lang} setLang={setLang}
          onClose={() => setShowSettings(false)} th={th} initialTab={settingsTab} />
      )}

      {showHabitModal && (
        <HabitModal existing={editingHabit} onSave={handleSaveHabit}
          onClose={() => { setShowHabitModal(false); setEditingHabit(null); }} th={th} lang={lang} />
      )}

      {showChallengePicker && (
        <ChallengePicker customUnlocked={customUnlocked}
          onPickTemplate={(tpl) => setTemplatePending(tpl)}
          onCustom={handleOpenCustom}
          onClose={() => setShowChallengePicker(false)} th={th} lang={lang} />
      )}

      {templatePending && (
        <TemplateNameModal template={templatePending}
          onSave={(name) => handlePickTemplate(templatePending, name)}
          onClose={() => setTemplatePending(null)} th={th} lang={lang} />
      )}

      {showCustomModal && (
        <CustomChallengeModal onSave={handleSaveCustom} onClose={() => setShowCustomModal(false)} th={th} lang={lang} />
      )}

      {challengeDetail && (
        <ChallengeDetailModal challenge={challengeDetail} habit={habitFor(challengeDetail.habitId)}
          logs={logs} today={today} onToggle={handleToggleChallengeDay}
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

      {confirmDeleteHabit && (
        <Modal onClose={() => setConfirmDeleteHabit(null)} th={th}>
          <ModalHeader title={t("deleteHabitTitle", lang)} onClose={() => setConfirmDeleteHabit(null)} th={th} />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
        <GraceModal usedGraceChallenges={gracePayload.usedGraceIds} resetChallenges={gracePayload.resetIds}
          completedChallenges={gracePayload.completedIds} challenges={challenges}
          onClose={() => setShowGraceModal(false)} th={th} lang={lang} />
      )}
    </div>
  );
}