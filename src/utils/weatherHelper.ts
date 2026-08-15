import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  Cloudy,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudLightning,
  Tornado,
  HelpCircle,
  LucideIcon,
} from "lucide-react";

export interface WeatherMapping {
  desc: string;
  iconName: LucideIcon;
  colorClass: string;
  bgClass: string;
}

/**
 * OpenWeather "weather.id" kodlarını Türkçe açıklama + Lucide ikon + tema
 * renklerine çevirir. Kod aralıkları OpenWeather'ın resmi "Weather Condition
 * Codes" tablosuna göre gruplanmıştır (https://openweathermap.org/weather-conditions).
 *
 * isDay: OpenWeather'ın kendi gündüz/gece ikon soneki (d/n) yerine, current/hourly
 * verisindeki hesaplanmış gündüz-gece durumu kullanılıyor — böylece güneş/ay ikonu
 * her zaman gerçek yerel saatle tutarlı oluyor.
 */
export function getWeatherMapping(code: number, isDay: boolean = true): WeatherMapping {
  // 2xx — Gökgürültülü Fırtına
  if (code >= 200 && code < 300) {
    return {
      desc: code >= 210 && code < 220 ? "Hafif Gökgürültülü Fırtına" : "Gökgürültülü Fırtına",
      iconName: CloudLightning,
      colorClass: "text-violet-500",
      bgClass: "from-violet-500/15 to-transparent",
    };
  }
  // 3xx — Çiseleme
  if (code >= 300 && code < 400) {
    return {
      desc: "Çiseleyen Yağmur",
      iconName: CloudDrizzle,
      colorClass: "text-sky-300",
      bgClass: "from-sky-300/10 to-transparent",
    };
  }
  // 5xx — Yağmur
  if (code >= 500 && code < 600) {
    if (code === 500) return { desc: "Hafif Yağmurlu", iconName: CloudRain, colorClass: "text-blue-400", bgClass: "from-blue-400/10 to-transparent" };
    if (code === 501) return { desc: "Yağmurlu", iconName: CloudRain, colorClass: "text-blue-500", bgClass: "from-blue-500/10 to-transparent" };
    if (code >= 502 && code <= 504) return { desc: "Kuvvetli Yağmurlu", iconName: CloudRainWind, colorClass: "text-blue-600", bgClass: "from-blue-600/15 to-transparent" };
    if (code === 511) return { desc: "Dondurucu Yağmur", iconName: CloudSnow, colorClass: "text-teal-200", bgClass: "from-teal-200/10 to-transparent" };
    return { desc: "Sağanak Yağışlı", iconName: CloudRainWind, colorClass: "text-sky-500", bgClass: "from-sky-500/15 to-transparent" };
  }
  // 6xx — Kar
  if (code >= 600 && code < 700) {
    if (code === 600) return { desc: "Hafif Karlı", iconName: CloudSnow, colorClass: "text-sky-100", bgClass: "from-sky-100/15 to-transparent" };
    if (code === 601) return { desc: "Karlı", iconName: CloudSnow, colorClass: "text-white", bgClass: "from-white/10 to-transparent" };
    if (code === 602) return { desc: "Kuvvetli Karlı", iconName: CloudSnow, colorClass: "text-zinc-200", bgClass: "from-zinc-200/15 to-transparent" };
    return { desc: "Karla Karışık Yağmurlu", iconName: CloudSnow, colorClass: "text-slate-200", bgClass: "from-slate-200/10 to-transparent" };
  }
  // 7xx — Atmosferik (sis, pus, toz, duman vb.)
  if (code >= 700 && code < 800) {
    if (code === 731 || code === 751 || code === 761) {
      return { desc: "Tozlu", iconName: CloudFog, colorClass: "text-amber-200", bgClass: "from-amber-200/10 to-transparent" };
    }
    if (code === 771 || code === 781) {
      return { desc: "Kuvvetli Rüzgâr / Hortum", iconName: Tornado, colorClass: "text-red-400", bgClass: "from-red-400/15 to-transparent" };
    }
    return { desc: "Sisli / Puslu", iconName: CloudFog, colorClass: "text-zinc-400", bgClass: "from-zinc-400/10 to-transparent" };
  }
  // 800 — Açık
  if (code === 800) {
    return isDay
      ? { desc: "Açık, Güneşli", iconName: Sun, colorClass: "text-amber-500", bgClass: "from-amber-500/10 to-transparent" }
      : { desc: "Açık Gece", iconName: Moon, colorClass: "text-indigo-300", bgClass: "from-indigo-300/10 to-transparent" };
  }
  // 80x — Bulutlu (farklı yoğunluklar)
  if (code > 800 && code < 900) {
    if (code === 801) {
      return isDay
        ? { desc: "Az Bulutlu", iconName: CloudSun, colorClass: "text-amber-400", bgClass: "from-amber-400/10 to-transparent" }
        : { desc: "Az Bulutlu Gece", iconName: CloudMoon, colorClass: "text-indigo-300", bgClass: "from-indigo-300/10 to-transparent" };
    }
    if (code === 802) {
      return isDay
        ? { desc: "Parçalı Bulutlu", iconName: CloudSun, colorClass: "text-sky-400", bgClass: "from-sky-400/10 to-transparent" }
        : { desc: "Parçalı Bulutlu Gece", iconName: CloudMoon, colorClass: "text-sky-300", bgClass: "from-sky-300/10 to-transparent" };
    }
    if (code === 803) return { desc: "Çoğunlukla Bulutlu", iconName: Cloudy, colorClass: "text-slate-400", bgClass: "from-slate-400/10 to-transparent" };
    return { desc: "Kapalı, Bulutlu", iconName: Cloud, colorClass: "text-slate-400", bgClass: "from-slate-400/10 to-transparent" };
  }
  return { desc: "Bilinmiyor", iconName: HelpCircle, colorClass: "text-slate-400", bgClass: "from-slate-400/10 to-transparent" };
}
