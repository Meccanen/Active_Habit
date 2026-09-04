import type { AppState } from "../types";

/**
 * Yedekleme & Geri Yükleme servisi.
 *
 * Uygulama verileri (alışkanlıklar, günlük kayıtlar, challenge'lar) ve
 * kullanıcı tercihleri (tema, dil, yazı boyutu) tek bir JSON dosyasına
 * dışa/ aktarılır ve tekrar içe yüklenir. Bu, cihaz değiştirirken veya
 * veri güvenliği amacıyla kullanıcının kendi verisini taşımasını sağlar.
 *
 * VERİ GİZLİLİĞİ: Tüm veriler yalnızca cihazda saklanır. Yedeği dışa aktarmak
 * dosyayı kullanıcının cihazına indirir; hiçbir sunucuya gönderilmez.
 */

export interface BackupSettings {
  theme: string;
  lang: string;
  fontScale: string;
}

export interface BackupFile {
  version: number;
  app: string;
  exportedAt: string;
  state: AppState;
  settings: BackupSettings;
}

const BACKUP_VERSION = 1;
const APP_ID = "active-habit-tracker";

function validateSettings(s: unknown): BackupSettings {
  const o = (s ?? {}) as Record<string, unknown>;
  const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);
  return {
    theme: str(o.theme, "gece"),
    lang: str(o.lang, "tr"),
    fontScale: str(o.fontScale, "large"),
  };
}

/**
 * Mevcut uygulama state'ini ve kullanıcı tercihlerini doğrulanmış bir
 * yedekleme dosyasına dönüştürür.
 */
export function buildBackup(state: AppState, settings: BackupSettings): BackupFile {
  return {
    version: BACKUP_VERSION,
    app: APP_ID,
    exportedAt: new Date().toISOString(),
    state,
    settings: validateSettings(settings),
  };
}

/**
 * Tipik bir yedekleme dosyasının geçerli olup olmadığını denetler.
 * Bu, import edilen JSON'un bu uygulamadan geldiğinden emin olmak için
 * yapılan hafif ama yeterli bir doğrulamadır.
 */
export function isValidBackupJson(text: string): boolean {
  try {
    const data = JSON.parse(text) as BackupFile;
    if (!data || data.app !== APP_ID) return false;
    if (typeof data.version !== "number") return false;
    if (!data.state || !Array.isArray(data.state.habits)) return false;
    if (!Array.isArray(data.state.logs)) return false;
    if (!Array.isArray(data.state.challenges)) return false;
    if (!data.settings) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Geçerli bir yedekleme JSON metnini uygulamaya geri yüklenebilir
 * { state, settings } nesnesine çevirir. Geçersizse null döner.
 */
export function parseBackup(text: string): { state: AppState; settings: BackupSettings } | null {
  if (!isValidBackupJson(text)) return null;
  try {
    const data = JSON.parse(text) as BackupFile;
    const state: AppState = {
      habits: data.state.habits ?? [],
      logs: data.state.logs ?? [],
      challenges: data.state.challenges ?? [],
    };
    return { state, settings: validateSettings(data.settings) };
  } catch {
    return null;
  }
}

/** Yedekleme dosyasını kullanıcının cihazına indirir (data URI / Blob). */
export function downloadBackupJson(json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `habit-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Yedekleme için güncel kullanıcı tercihlerini localStorage'dan toplar. */
export function readCurrentSettings(): BackupSettings {
  return {
    theme: localStorage.getItem("mht_theme") || "gece",
    lang: localStorage.getItem("mht_lang") || "tr",
    fontScale: localStorage.getItem("mht_font_scale") || "large",
  };
}
