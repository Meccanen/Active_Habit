import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudRainWind,
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
 * WMO (World Meteorological Organization) hava durumu kodlarını Türkçe
 * açıklama + Lucide ikon + tema renklerine çevirir. Open-Meteo bu kod
 * setini kullanıyor — namaz vaktindeki geocoding ile aynı aile.
 * isDay: gündüz/gece için güneş/ay ikonu farkı (0/1/2 kodlarında).
 */
export function getWeatherMapping(code: number, isDay: boolean = true): WeatherMapping {
  switch (code) {
    case 0:
      return isDay
        ? { desc: "Açık, Güneşli", iconName: Sun, colorClass: "text-amber-500", bgClass: "from-amber-500/10 to-transparent" }
        : { desc: "Açık Gece", iconName: Moon, colorClass: "text-indigo-300", bgClass: "from-indigo-300/10 to-transparent" };
    case 1:
      return isDay
        ? { desc: "Çoğunlukla Açık", iconName: CloudSun, colorClass: "text-amber-400", bgClass: "from-amber-400/10 to-transparent" }
        : { desc: "Çoğunlukla Açık Gece", iconName: CloudMoon, colorClass: "text-indigo-300", bgClass: "from-indigo-300/10 to-transparent" };
    case 2:
      return isDay
        ? { desc: "Parçalı Bulutlu", iconName: CloudSun, colorClass: "text-sky-400", bgClass: "from-sky-400/10 to-transparent" }
        : { desc: "Parçalı Bulutlu Gece", iconName: CloudMoon, colorClass: "text-sky-300", bgClass: "from-sky-300/10 to-transparent" };
    case 3:
      return { desc: "Kapalı, Bulutlu", iconName: Cloud, colorClass: "text-slate-400", bgClass: "from-slate-400/10 to-transparent" };
    case 45:
    case 48:
      return { desc: "Sisli", iconName: CloudFog, colorClass: "text-zinc-400", bgClass: "from-zinc-400/10 to-transparent" };
    case 51:
    case 53:
    case 55:
      return { desc: "Hafif Çiseleyen Yağmur", iconName: CloudDrizzle, colorClass: "text-sky-300", bgClass: "from-sky-300/10 to-transparent" };
    case 56:
    case 57:
      return { desc: "Dondurucu Çiseleme", iconName: CloudSnow, colorClass: "text-blue-200", bgClass: "from-blue-200/10 to-transparent" };
    case 61:
      return { desc: "Hafif Yağmurlu", iconName: CloudRain, colorClass: "text-blue-400", bgClass: "from-blue-400/10 to-transparent" };
    case 63:
      return { desc: "Yağmurlu", iconName: CloudRain, colorClass: "text-blue-500", bgClass: "from-blue-500/10 to-transparent" };
    case 65:
      return { desc: "Kuvvetli Yağmurlu", iconName: CloudRainWind, colorClass: "text-blue-600", bgClass: "from-blue-600/10 to-transparent" };
    case 66:
    case 67:
      return { desc: "Dondurucu Yağmurlu", iconName: CloudSnow, colorClass: "text-teal-200", bgClass: "from-teal-200/10 to-transparent" };
    case 71:
      return { desc: "Hafif Karlı", iconName: CloudSnow, colorClass: "text-sky-100", bgClass: "from-sky-100/15 to-transparent" };
    case 73:
      return { desc: "Karlı", iconName: CloudSnow, colorClass: "text-white", bgClass: "from-white/10 to-transparent" };
    case 75:
      return { desc: "Kuvvetli Karlı", iconName: CloudSnow, colorClass: "text-zinc-200", bgClass: "from-zinc-200/15 to-transparent" };
    case 77:
      return { desc: "Kar Atıştırması", iconName: CloudSnow, colorClass: "text-slate-200", bgClass: "from-slate-200/10 to-transparent" };
    case 80:
    case 81:
    case 82:
      return { desc: "Yer Yer Sağanak Yağışlı", iconName: CloudRain, colorClass: "text-sky-500", bgClass: "from-sky-500/15 to-transparent" };
    case 85:
    case 86:
      return { desc: "Sağanak Kar Yağışlı", iconName: CloudSnow, colorClass: "text-indigo-200", bgClass: "from-indigo-200/15 to-transparent" };
    case 95:
      return { desc: "Gökgürültülü Sağanak Yağış", iconName: CloudLightning, colorClass: "text-violet-500", bgClass: "from-violet-500/15 to-transparent" };
    case 96:
    case 99:
      return { desc: "Dolu Yağışlı ve Gökgürültülü", iconName: CloudLightning, colorClass: "text-purple-600", bgClass: "from-purple-600/15 to-transparent" };
    default:
      return { desc: "Bilinmiyor", iconName: HelpCircle, colorClass: "text-slate-400", bgClass: "from-slate-400/10 to-transparent" };
  }
}
