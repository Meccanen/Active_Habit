import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MapPin, Search, X, Settings, Palette, Check, Plus, Trash2,
  Coffee, Navigation, RefreshCw, Droplets, Wind, Eye, Gauge, Sunrise, Sunset,
} from "lucide-react";
import { Location } from "./types";
import { TURKEY_PROVINCES, PAKISTAN_CITIES } from "./utils/cityData";
import { getWeatherMapping } from "./utils/weatherHelper";
import { fetchWeatherBundle, WeatherServiceError } from "./services/weatherService";
import { requestLocationPermission, getCurrentPosition } from "./utils/locationHelper";
import { t, detectLanguage, LangCode } from "./utils/i18n";
import {
  getSupporterProducts, purchaseSupporterBadge, checkIsSupporter, restoreSupporterPurchases,
  SUPPORTER_PRODUCT_IDS, type SupporterProductId,
} from "./services/billingService";
import type { WeatherBundle } from "./types";

/**
 * ============================================================================
 * TEMALAR — Meccanen Namaz Vakti'nden BİREBİR taşındı, hiç değiştirilmedi.
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

function guessTimezone(lng: number): string {
  const offset = Math.round(lng / 15);
  const MAP: Record<string, string> = {
    "-12":"Etc/GMT+12","-11":"Pacific/Midway","-10":"Pacific/Honolulu","-9":"America/Anchorage",
    "-8":"America/Los_Angeles","-7":"America/Denver","-6":"America/Chicago","-5":"America/New_York",
    "-4":"America/Halifax","-3":"America/Sao_Paulo","-2":"Atlantic/South_Georgia","-1":"Atlantic/Azores",
    "0":"Europe/London","1":"Europe/Berlin","2":"Europe/Helsinki","3":"Europe/Istanbul",
    "4":"Asia/Dubai","5":"Asia/Karachi","6":"Asia/Dhaka","7":"Asia/Bangkok",
    "8":"Asia/Singapore","9":"Asia/Tokyo","10":"Australia/Sydney","11":"Pacific/Noumea","12":"Pacific/Auckland",
  };
  return MAP[String(offset)] || "Europe/London";
}

const APP_VERSION = "0.1.0";

const DEFAULT_LOCATION: Location = {
  name: "İstanbul", country: "Türkiye",
  latitude: 41.0082, longitude: 28.9784,
  timezone: "Europe/Istanbul", admin1: "Marmara"
};

/**
 * ============================================================================
 * AYARLAR PANELİ — Tema / Konum / Hakkında (Destekçi Rozeti dahil).
 * ============================================================================
 */
function SettingsPanel({
  theme, setTheme, location, setLocation,
  savedLocations, setSavedLocations,
  onClose, th, lang, setLang,
  onFindLocation, isDetectingLocation,
  autoLocationEnabled, onToggleAutoLocation,
  initialTab,
  isSupporterUser, supporterLoading, purchasingId,
  onSupporterPurchase, onSupporterRestore,
}: {
  theme: ThemeKey; setTheme: (k: ThemeKey) => void;
  location: Location; setLocation: (l: Location) => void;
  savedLocations: Location[]; setSavedLocations: (locs: Location[]) => void;
  onClose: () => void; th: typeof THEMES[ThemeKey];
  lang: LangCode; setLang: (l: LangCode) => void;
  onFindLocation: () => void; isDetectingLocation: boolean;
  autoLocationEnabled: boolean; onToggleAutoLocation: (val: boolean) => void;
  initialTab?: "tema" | "konum" | "hakkinda";
  isSupporterUser: boolean; supporterLoading: boolean; purchasingId: string | null;
  onSupporterPurchase: (productId: SupporterProductId) => void;
  onSupporterRestore: () => void;
}) {
  const [tab, setTab] = useState<"tema" | "konum" | "hakkinda">(initialTab || "tema");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [notification, setNotification] = useState("");
  const MAX_LOCATIONS = 33;

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(""), 3000); };

  const performSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true); setSearchError(""); setSearchResults([]);
    try {
      const apiLang = lang === "ur" ? "ar" : lang;
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=${apiLang}`);
      const data = await res.json();
      if (data.results?.length) {
        setSearchResults(data.results.map((r: any) => ({
          name: r.name, country: r.country || t("unknown", lang),
          latitude: r.latitude, longitude: r.longitude,
          timezone: r.timezone && r.timezone !== "GMT" && r.timezone !== "UTC"
            ? r.timezone : guessTimezone(r.longitude),
          admin1: r.admin1 || ""
        })));
      } else setSearchError(t("noResults", lang));
    } catch { setSearchError(t("searchError", lang)); }
    finally { setIsSearching(false); }
  };

  const addAndSelectCity = (loc: Location) => {
    const exists = savedLocations.some(l =>
      l.latitude.toFixed(2) === loc.latitude.toFixed(2) &&
      l.longitude.toFixed(2) === loc.longitude.toFixed(2)
    );
    if (!exists && savedLocations.length >= MAX_LOCATIONS) {
      notify(t("maxLocations", lang, { n: String(MAX_LOCATIONS) }));
      return;
    }
    const newList = exists ? savedLocations : [...savedLocations, loc];
    setSavedLocations(newList);
    setLocation(loc);
    localStorage.setItem("mhd_auto_location", "false");
    onToggleAutoLocation(false);
    setSearchResults([]); setSearchQuery("");
    notify(t("citySelected", lang, { city: loc.name, country: loc.country }));
  };

  const selectSaved = (loc: Location) => { setLocation(loc); notify(t("citySelected", lang, { city: loc.name, country: loc.country })); };

  const deleteSaved = (idx: number) => {
    const next = savedLocations.filter((_, i) => i !== idx);
    setSavedLocations(next);
    if (location.latitude === savedLocations[idx].latitude) setLocation(next[0] || DEFAULT_LOCATION);
  };

  const LANGUAGES: { code: LangCode; label: string }[] = [
    { code: "tr", label: "Türkçe" }, { code: "en", label: "English" },
    { code: "de", label: "Deutsch" }, { code: "ar", label: "العربية" },
    { code: "ur", label: "اردو" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl border ${th.settingsCard} max-h-[90vh] flex flex-col`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${th.header}`}>
          <h2 className={`font-semibold text-lg ${th.textPrimary}`}>{t("settings", lang)}</h2>
          <button onClick={onClose} className={`p-2 rounded-full ${th.cardHover} ${th.textSecondary}`}><X size={18}/></button>
        </div>

        <div className={`flex border-b ${th.header} px-2`}>
          {(["tema","konum","hakkinda"] as const).map(tb => (
            <button key={tb} onClick={() => setTab(tb)}
              className={`flex-1 py-3 text-sm font-medium transition ${tab === tb ? th.accent : th.textMuted}`}>
              {tb === "tema" ? t("themeTab", lang) : tb === "konum" ? t("location", lang) : t("about", lang)}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {notification && (
            <div className={`text-sm px-3 py-2 rounded-xl ${th.card} ${th.accent} animate-fadeIn`}>{notification}</div>
          )}

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

          {tab === "konum" && (
            <div className="space-y-4">
              <button onClick={onFindLocation} disabled={isDetectingLocation}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border ${th.card} ${th.cardHover} ${th.accent} font-medium text-sm`}>
                <Navigation size={16} className={isDetectingLocation ? "animate-spin" : ""} />
                {t("findMyLocation", lang)}
              </button>

              <div className="flex gap-2">
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && performSearch()}
                  placeholder={t("searchCity", lang)}
                  className={`flex-1 px-3 py-2 rounded-xl border bg-transparent text-sm ${th.card} ${th.textPrimary} outline-none`} />
                <button onClick={performSearch} disabled={isSearching}
                  className={`px-3 rounded-xl border ${th.card} ${th.accent}`}><Search size={16}/></button>
              </div>
              {searchError && <p className={`text-xs ${th.textMuted}`}>{searchError}</p>}
              {searchResults.length > 0 && (
                <div className="space-y-1">
                  {searchResults.map((r, i) => (
                    <button key={i} onClick={() => addAndSelectCity(r)}
                      className={`w-full text-left px-3 py-2 rounded-xl border ${th.card} ${th.cardHover} text-sm ${th.textPrimary}`}>
                      {r.name}, {r.admin1 ? r.admin1 + ", " : ""}{r.country}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-1">
                <p className={`text-xs uppercase tracking-wide ${th.textMuted}`}>{t("location", lang)}</p>
                {savedLocations.map((l, i) => (
                  <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${th.card} ${location.latitude === l.latitude && location.longitude === l.longitude ? th.accent : th.textPrimary}`}>
                    <button onClick={() => selectSaved(l)} className="flex items-center gap-2 text-sm flex-1 text-left">
                      <MapPin size={14} /> {l.name}, {l.country}
                    </button>
                    <button onClick={() => deleteSaved(i)} className={th.textMuted}><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-2">
                <p className={`text-xs uppercase tracking-wide ${th.textMuted}`}>Türkiye</p>
                <select onChange={e => {
                  const p = TURKEY_PROVINCES.find(x => x.name === e.target.value);
                  if (p) addAndSelectCity({ name: p.name, country: "Türkiye", latitude: p.latitude, longitude: p.longitude, timezone: "Europe/Istanbul", admin1: "Türkiye" });
                }} className={`w-full px-3 py-2 rounded-xl border bg-transparent text-sm ${th.card} ${th.textPrimary}`}>
                  <option value="">İl seçin…</option>
                  {TURKEY_PROVINCES.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {tab === "hakkinda" && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h3 className={`font-semibold ${th.textPrimary}`}>{t("appName", lang)}</h3>
                <p className={`text-xs ${th.textMuted}`}>v{APP_VERSION} · {t("adFree", lang)}</p>
              </div>

              <div className={`rounded-2xl border p-4 space-y-3 ${th.card}`}>
                <div className="flex items-center gap-2">
                  <Coffee size={18} className={th.accent} />
                  <h4 className={`font-medium text-sm ${th.textPrimary}`}>{t("supporterTitle", lang)}</h4>
                </div>
                <p className={`text-xs ${th.textSecondary}`}>{t("supporterDesc", lang)}</p>

                {isSupporterUser ? (
                  <p className={`text-sm font-medium ${th.accent}`}>{t("supporterOwned", lang)}</p>
                ) : (
                  <div className="space-y-2">
                    <button disabled={supporterLoading || purchasingId !== null}
                      onClick={() => onSupporterPurchase(SUPPORTER_PRODUCT_IDS[0])}
                      className={`w-full py-2.5 rounded-xl text-sm font-medium border ${th.card} ${th.cardHover} ${th.accent}`}>
                      {purchasingId === SUPPORTER_PRODUCT_IDS[0] ? "…" : t("supporterButtonSilver", lang)}
                    </button>
                    <button disabled={supporterLoading || purchasingId !== null}
                      onClick={() => onSupporterPurchase(SUPPORTER_PRODUCT_IDS[1])}
                      className={`w-full py-2.5 rounded-xl text-sm font-medium border ${th.card} ${th.cardHover} ${th.accent}`}>
                      {purchasingId === SUPPORTER_PRODUCT_IDS[1] ? "…" : t("supporterButtonGold", lang)}
                    </button>
                  </div>
                )}
                <button onClick={onSupporterRestore} className={`w-full text-xs underline ${th.textMuted}`}>
                  {t("supporterRestore", lang)}
                </button>
              </div>

              <div className="space-y-1">
                <p className={`text-xs uppercase tracking-wide ${th.textMuted}`}>{t("themeTab", lang)}</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => setLang(l.code)}
                      className={`px-3 py-1.5 rounded-full text-xs border ${th.card} ${lang === l.code ? th.accent : th.textMuted}`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * ANA UYGULAMA
 * ============================================================================
 */
export default function App() {
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    const saved = localStorage.getItem("mhd_theme") as ThemeKey;
    return saved && THEMES[saved] ? saved : "gece";
  });
  const setTheme = (key: ThemeKey) => { setThemeKey(key); localStorage.setItem("mhd_theme", key); };
  const th = THEMES[themeKey];

  const [lang, setLangState] = useState<LangCode>(
    () => (localStorage.getItem("mhd_lang") as LangCode) || detectLanguage()
  );
  const setLang = (l: LangCode) => { setLangState(l); localStorage.setItem("mhd_lang", l); };

  const [location, setLocationState] = useState<Location>(() => {
    try { const s = localStorage.getItem("mhd_location"); return s ? JSON.parse(s) : DEFAULT_LOCATION; }
    catch { return DEFAULT_LOCATION; }
  });
  const setLocationAndSave = (loc: Location) => { setLocationState(loc); localStorage.setItem("mhd_location", JSON.stringify(loc)); };

  const [savedLocations, setSavedLocationsState] = useState<Location[]>(() => {
    try { const s = localStorage.getItem("mhd_saved_locations"); return s ? JSON.parse(s) : [DEFAULT_LOCATION]; }
    catch { return [DEFAULT_LOCATION]; }
  });
  const setSavedLocations = (locs: Location[]) => { setSavedLocationsState(locs); localStorage.setItem("mhd_saved_locations", JSON.stringify(locs)); };

  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"tema"|"konum"|"hakkinda">("tema");

  const [autoLocationEnabled, setAutoLocationEnabled] = useState(
    () => localStorage.getItem("mhd_auto_location") === "true"
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(
    () => !localStorage.getItem("mhd_location_prompted")
  );

  // ---- Hava durumu verisi ----
  const [weather, setWeather] = useState<WeatherBundle | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const loadWeather = async () => {
    setWeatherLoading(true); setWeatherError(null);
    try {
      const bundle = await fetchWeatherBundle(location.latitude, location.longitude, lang);
      setWeather(bundle);
    } catch (e) {
      const msg = e instanceof WeatherServiceError ? e.message : t("wxError", lang);
      setWeatherError(msg);
      console.log("[Meccanen HD] Hava durumu alınamadı:", e);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => { loadWeather(); }, [location.latitude, location.longitude, lang]);

  // ---- Destekçi Rozeti ----
  const [isSupporterUser, setIsSupporterUser] = useState(false);
  const [supporterLoading, setSupporterLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    checkIsSupporter().then(setIsSupporterUser).finally(() => setSupporterLoading(false));
  }, []);

  const handleSupporterPurchase = async (productId: SupporterProductId) => {
    setPurchasingId(productId);
    try {
      const result = await purchaseSupporterBadge(productId);
      if (result.success) setIsSupporterUser(true);
    } finally {
      setPurchasingId(null);
    }
  };

  const handleSupporterRestore = async () => {
    setSupporterLoading(true);
    try {
      const restored = await restoreSupporterPurchases();
      setIsSupporterUser(restored);
    } finally {
      setSupporterLoading(false);
    }
  };

  // ---- Konum tespiti (namaz vaktindeki mantıkla birebir) ----
  const detectAndUpdateLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const coords = await getCurrentPosition();
      const latDiff = Math.abs(coords.latitude - location.latitude);
      const lonDiff = Math.abs(coords.longitude - location.longitude);
      if (latDiff < 0.05 && lonDiff < 0.05) { setIsDetectingLocation(false); return; }

      let name = `${coords.latitude.toFixed(2)}°N ${coords.longitude.toFixed(2)}°E`;
      let country = t("unknown", lang);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=${lang === "ur" ? "ar" : lang}`,
          { headers: { "Accept": "application/json" } }
        );
        const data = await res.json();
        if (data?.address) {
          const addr = data.address;
          name = addr.city || addr.town || addr.village || addr.county || addr.state || name;
          country = addr.country || country;
        }
      } catch (geoErr) {
        console.log("[Meccanen HD] Reverse geocoding başarısız, koordinatlarla devam:", geoErr);
      }

      const newLoc: Location = {
        name, country, latitude: coords.latitude, longitude: coords.longitude,
        timezone: guessTimezone(coords.longitude),
      };
      setLocationAndSave(newLoc);
      const exists = savedLocations.some(l => l.latitude.toFixed(2) === newLoc.latitude.toFixed(2));
      if (!exists) setSavedLocations([...savedLocations, newLoc]);
    } catch (e) {
      console.log("[Meccanen HD] Konum tespiti hatası:", e);
    }
    setIsDetectingLocation(false);
  };

  useEffect(() => {
    if (autoLocationEnabled) detectAndUpdateLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoLocationEnabled) return;
    const interval = setInterval(() => detectAndUpdateLocation(), 30 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLocationEnabled]);

  const handleFindLocation = async () => {
    localStorage.setItem("mhd_auto_location", "true");
    setAutoLocationEnabled(true);
    setShowLocationPrompt(true);
  };

  const handleToggleAutoLocation = (val: boolean) => {
    localStorage.setItem("mhd_auto_location", String(val));
    setAutoLocationEnabled(val);
    if (val) detectAndUpdateLocation();
  };

  const handleLocationAllowed = async () => {
    setShowLocationPrompt(false);
    localStorage.setItem("mhd_location_prompted", "true");
    setIsDetectingLocation(true);
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setIsDetectingLocation(false);
      alert(t("locationDenied", lang));
      return;
    }
    await detectAndUpdateLocation();
  };

  const handleLocationDenied = () => {
    setShowLocationPrompt(false);
    localStorage.setItem("mhd_location_prompted", "true");
  };

  // ---- Türetilmiş görünüm verisi ----
  const currentMapping = useMemo(
    () => weather ? getWeatherMapping(weather.current.weatherId, weather.current.isDay) : null,
    [weather]
  );

  const formatHour = (dt: number) => new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit", minute: "2-digit", timeZone: location.timezone || "Europe/Istanbul",
  }).format(new Date(dt * 1000));

  const formatDay = (dt: number) => new Intl.DateTimeFormat("tr-TR", {
    weekday: "short", day: "numeric", month: "short", timeZone: location.timezone || "Europe/Istanbul",
  }).format(new Date(dt * 1000));

  return (
    <div className={`min-h-screen ${th.bg} ${th.textPrimary} relative overflow-hidden`}>
      <div className={`pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl ${th.blob1}`} />
      <div className={`pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl ${th.blob2}`} />

      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b ${th.header} relative z-10`}>
        <button onClick={() => { setSettingsTab("konum"); setShowSettings(true); }}
          className="flex items-center gap-1.5 text-sm">
          <MapPin size={16} className={th.accent} />
          <span className="font-medium">{location.name}</span>
        </button>
        <button onClick={() => { setSettingsTab("tema"); setShowSettings(true); }}
          className={`p-2 rounded-full ${th.cardHover}`}>
          <Settings size={18} className={th.textSecondary} />
        </button>
      </div>

      {/* Ana içerik */}
      <div className="relative z-10 px-5 py-6 space-y-6 max-w-xl mx-auto">
        {weatherLoading && !weather && (
          <p className={`text-center text-sm ${th.textMuted} py-10`}>{t("wxLoading", lang)}</p>
        )}
        {weatherError && !weather && (
          <div className={`text-center text-sm ${th.textMuted} py-10 space-y-2`}>
            <p>{weatherError}</p>
            <button onClick={loadWeather} className={`text-xs underline ${th.accent}`}>{t("wxRefresh", lang)}</button>
          </div>
        )}

        {weather && currentMapping && (
          <>
            <div className={`rounded-3xl border p-6 text-center space-y-2 ${th.card}`}>
              <currentMapping.iconName size={56} className={`mx-auto ${currentMapping.colorClass}`} />
              <div className="text-5xl font-light">{weather.current.temperature}°</div>
              <p className={`text-sm ${th.textSecondary}`}>{currentMapping.desc}</p>
              <p className={`text-xs ${th.textMuted}`}>{t("wxFeelsLike", lang)} {weather.current.apparentTemperature}°</p>

              <div className="grid grid-cols-4 gap-2 pt-4 text-xs">
                <div className="flex flex-col items-center gap-1">
                  <Droplets size={14} className={th.textMuted} />
                  <span>{weather.current.humidity}%</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Wind size={14} className={th.textMuted} />
                  <span>{Math.round(weather.current.windSpeed)} m/s</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Gauge size={14} className={th.textMuted} />
                  <span>{weather.current.pressure} hPa</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Eye size={14} className={th.textMuted} />
                  <span>{Math.round(weather.current.visibility / 1000)} km</span>
                </div>
              </div>

              <div className="flex justify-center gap-6 pt-2 text-xs">
                <div className="flex items-center gap-1"><Sunrise size={14} className={th.textMuted} />{formatHour(weather.current.sunrise)}</div>
                <div className="flex items-center gap-1"><Sunset size={14} className={th.textMuted} />{formatHour(weather.current.sunset)}</div>
              </div>
            </div>

            <div>
              <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("wxHourlyTitle", lang)}</p>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {weather.hourly.map((h, i) => {
                  const m = getWeatherMapping(h.weatherId, h.isDay);
                  return (
                    <div key={i} className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 min-w-[64px] ${th.card}`}>
                      <span className="text-xs">{i === 0 ? t("wxNow", lang) : formatHour(h.dt)}</span>
                      <m.iconName size={20} className={m.colorClass} />
                      <span className="text-sm font-medium">{h.temperature}°</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className={`text-xs uppercase tracking-wide mb-2 ${th.textMuted}`}>{t("wxDailyTitle", lang)}</p>
              <div className={`rounded-2xl border divide-y divide-white/5 ${th.card}`}>
                {weather.daily.map((d, i) => {
                  const m = getWeatherMapping(d.weatherId, true);
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="w-24 shrink-0">{i === 0 ? t("wxToday", lang) : formatDay(d.dt)}</span>
                      <m.iconName size={18} className={m.colorClass} />
                      <span className={`text-xs ${th.textMuted} w-16 text-right`}>{Math.round(d.pop * 100)}%</span>
                      <span className="w-20 text-right font-medium">{d.tempMax}° / {d.tempMin}°</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {showLocationPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className={`w-full max-w-sm rounded-3xl border p-6 text-center space-y-4 ${th.settingsCard}`}>
            <Navigation size={32} className={`mx-auto ${th.accent}`} />
            <h3 className="font-semibold">{t("locationPermission", lang)}</h3>
            <p className={`text-sm ${th.textSecondary}`}>{t("findMyLocation", lang)}?</p>
            <div className="flex gap-2">
              <button onClick={handleLocationDenied} className={`flex-1 py-2.5 rounded-xl border text-sm ${th.card} ${th.textMuted}`}>
                {t("change", lang)}
              </button>
              <button onClick={handleLocationAllowed} disabled={isDetectingLocation}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium ${th.card} ${th.accent}`}>
                {isDetectingLocation ? "…" : t("findMyLocation", lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsPanel
          theme={themeKey} setTheme={setTheme}
          location={location} setLocation={setLocationAndSave}
          savedLocations={savedLocations} setSavedLocations={setSavedLocations}
          onClose={() => setShowSettings(false)} th={th}
          lang={lang} setLang={setLang}
          onFindLocation={handleFindLocation} isDetectingLocation={isDetectingLocation}
          autoLocationEnabled={autoLocationEnabled} onToggleAutoLocation={handleToggleAutoLocation}
          initialTab={settingsTab}
          isSupporterUser={isSupporterUser} supporterLoading={supporterLoading} purchasingId={purchasingId}
          onSupporterPurchase={handleSupporterPurchase} onSupporterRestore={handleSupporterRestore}
        />
      )}
    </div>
  );
}
