import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

const REPORT_DIR = "reports";

/**
 * Rapor paylaşım servisi. Detaylı istatistik ekranındaki her bir rapor
 * bloğunu (ör. son 30 gün grafiği, alışkanlık serileri) HTML'den görüntüye
 * çevirip PNG veya PDF olarak paylaşım menüsüyle gönderir.
 *
 * Paylaşılan görüntüye, ana arayüze dokunmadan (html2canvas'ın klonlama
 * ortamı üzerinden) üstte başlık + tarih ve altta kaynak satırı eklenir;
 * paylaşım butonları (`.share-row`) görüntüden hariç tutulur.
 *
 * Tüm görüntüleme cihazda yapılır; hiçbir veri sunucuya gönderilmez.
 */

export interface ReportBlockOptions {
  /** Üst başlıkta gösterilen uygulama adı. */
  appName: string;
  /** Üst başlığın sağında gösterilen tarih/metin (yerelleştirilmiş). */
  dateLabel: string;
  /** Görüntünün altında gösterilen kaynak satırı. */
  footer: string;
}

function filename(ext: string): string {
  const d = new Date().toISOString().slice(0, 10);
  return `habit-report-${d}.${ext}`;
}

/** Paylaşım görüntüsünde hariç tutulacak sınıf (butonlar). */
const SHARE_ROW_CLASS = "share-row";

/**
 * Klonlanmış dokümandaki rapor bloğunu "baskı dostu" beyaz temaya dönüştürür:
 * - Tema/klas arka plan renkleri kaldırılır → saf beyaz zemin
 *   (tema sınıflarından gelen geniş koyu/gri alanlar mürekkep israfıdır).
 * - Metinler koyulaştırılır (beyaz zemin üzerinde okunur).
 * - Kenarlıklı hücrelere belirgin gri çizgi verilir (tablo görünümü).
 * - İnline stili olan GERÇEK renkler korunur: grafik barları, ilerleme
 *   şeritleri, takvim/ısı haritası dolguları (rgba) ve SVG grafikleri.
 *   Sadece geçersiz tema sınıfı kalıntıları (ör. "bg-[#020617]") temizlenir.
 */
function applyPrintStyle(target: HTMLElement, clonedDoc: Document): void {
  const keepColor = (s: string) =>
    s.includes("gradient") || /^(rgb|hsl)/i.test(s.trim()) || /^#[0-9a-f]{6}/i.test(s.trim()) || s.trim() === "transparent";
  const all = target.querySelectorAll<HTMLElement>("*");
  all.forEach((el) => {
    const bg = el.style.background;
    if (bg && bg.trim() && !keepColor(bg)) {
      el.style.background = "transparent";
    } else if (el.style.backgroundColor && !keepColor(el.style.backgroundColor)) {
      el.style.backgroundColor = "transparent";
    }
    el.style.color = "#111827";
    const cs = clonedDoc.defaultView?.getComputedStyle(el);
    if (cs && parseFloat(cs.borderTopWidth) > 0) el.style.borderColor = "#d1d5db";
  });
  target.style.backgroundColor = "transparent";
}

/** HTML bloğunu görüntüye çevirir; başlık/kaynak ekler, butonları atlar. */
async function captureCanvas(element: HTMLElement, opts: ReportBlockOptions): Promise<HTMLCanvasElement> {
  element.setAttribute("data-capture", "report");
  try {
    return await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 3,
      useCORS: true,
      logging: false,
      ignoreElements: (el) => el.classList?.contains(SHARE_ROW_CLASS) ?? false,
      onclone: (clonedDoc) => {
        const target = clonedDoc.querySelector("[data-capture='report']") as HTMLElement | null;
        if (!target) return;
        applyPrintStyle(target, clonedDoc);

        const header = clonedDoc.createElement("div");
        header.style.cssText =
          "display:flex;justify-content:center;align-items:center;gap:12px;padding:16px 20px 10px;border-bottom:1px solid #e5e7eb;";
        const left = clonedDoc.createElement("span");
        left.style.cssText = "font-size:16px;font-weight:800;color:#111827;";
        left.textContent = opts.appName;
        const right = clonedDoc.createElement("span");
        right.style.cssText = "font-size:11px;color:#9ca3af;";
        right.textContent = opts.dateLabel;
        header.appendChild(left);
        header.appendChild(right);
        target.prepend(header);

        const footer = clonedDoc.createElement("div");
        footer.style.cssText =
          "padding:8px 18px 12px;margin-top:8px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;";
        footer.textContent = opts.footer;
        target.appendChild(footer);
      },
    });
  } finally {
    element.removeAttribute("data-capture");
  }
}

/** Geçici dosyayı diske yazıp paylaşım menüsüyle gönderir. Web'de indirir. */
async function deliver(blob: Blob, name: string): Promise<void> {
  if (Capacitor.getPlatform() === "web") {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return;
  }
  const base64 = await blobToBase64(blob);
  await Filesystem.mkdir({ path: REPORT_DIR, directory: Directory.Cache, recursive: true }).catch(() => {});
  // encoding verilmez → Android/iOS data'yı base64'ten çözüp gerçek binary
  // olarak yazar. Encoding.UTF8 verilirse base64 METİN olarak kalır ve
  // PNG/PDF dosyası bozulur.
  await Filesystem.writeFile({
    path: `${REPORT_DIR}/${name}`,
    data: base64,
    directory: Directory.Cache,
  });
  const uri = (await Filesystem.getUri({ path: `${REPORT_DIR}/${name}`, directory: Directory.Cache })).uri;
  await Share.share({
    title: "Habit Tracker Report",
    files: [uri],
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      // FileReader base64'i "data:...;base64,...." olarak döndürür; virgülden
      // sonrasını alırız. Satır sonları decode'u bozabilir → temizle.
      const payload = (result.split(",")[1] ?? result).replace(/[\r\n]/g, "");
      resolve(payload);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Bir HTML bloğunu PNG görüntüsüne çevirip paylaşır. */
export async function shareReportBlockAsImage(element: HTMLElement, opts: ReportBlockOptions): Promise<void> {
  const canvas = await captureCanvas(element, opts);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
  await deliver(blob, filename("png"));
}

/** Bir HTML bloğunu tek sayfalık PDF'e çevirip paylaşır. */
export async function shareReportBlockAsPdf(element: HTMLElement, opts: ReportBlockOptions): Promise<void> {
  const canvas = await captureCanvas(element, opts);
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? "landscape" : "portrait",
    unit: "pt",
    format: [canvas.width / 2, canvas.height / 2],
  });
  pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
  const blob = pdf.output("blob");
  await deliver(blob, filename("pdf"));
}

// ---- Düz metin paylaşımı (ör. challenge tamamlama) ---------------------

export interface ShareTextResult {
  /** Genel paylaşım menüsü/panosu ile gönderildi (işlem tamam). */
  shared: boolean;
  /** Native paylaşım kullanılamadı; metin panoya kopyalandı. */
  copied?: boolean;
}

/**
 * Düz metni cihazın paylaşım menüsüyle gönderir. Web'de native paylaşım
 * (navigator.share) yoksa veya kullanıcı iptal ederse panoya kopyalar.
 */
export async function shareText(title: string, text: string): Promise<ShareTextResult> {
  if (Capacitor.getPlatform() === "web") {
    const nav = navigator as Navigator & { share?: (d: { title?: string; text?: string }) => Promise<void> };
    try {
      if (nav.share) {
        await nav.share({ title, text });
        return { shared: true };
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return { shared: false };
      try {
        await copyToClipboard(text);
        return { shared: false, copied: true };
      } catch {
        return { shared: false };
      }
    }
    try {
      await copyToClipboard(text);
      return { shared: false, copied: true };
    } catch {
      return { shared: false };
    }
  }
  try {
    await Share.share({ title, text });
    return { shared: true };
  } catch {
    try {
      await copyToClipboard(text);
      return { shared: false, copied: true };
    } catch {
      return { shared: false };
    }
  }
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

// ---- Challenge Kutlama Kartı (görsel paylaşım) ------------------------

export interface CelebrationDay {
  date: string; // yyyy-mm-dd
  done: boolean;
}

export interface CelebrationOpts {
  appName: string;
  headerDate: string;
  emoji: string;
  title: string;
  startLabel: string;
  endLabel: string;
  startDate: string;
  endDate: string;
  days: CelebrationDay[];
  doneCount: number;
  totalDays: number;
  daysDoneLabel: string;
  sealText: string;
  footer: string;
  /** BCP-47 dil kodu (tarih/metin yerelleştirmesi için). */
  locale: string;
}

const INTL_LOCALES: Record<string, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", ar: "ar-SA", ur: "ur-PK",
};

const isoOf = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parseISO = (s: string): Date => new Date(s + "T00:00:00");

/** Challenge dönemini mini takvim blokları halinde (ay başına bir blok) üretir.
 *  Her gün kutucuğunda GÜN SAYISI gösterilir; tamamlanan günler yeşil (onay ✓),
 *  tamamlanmayanlar kehribar renktedir. Başlangıç/bitiş günleri halkayla
 *  vurgulanır. Challenge birden fazla aya yayılıyorsa bloklar A4 benzeri bir
 *  düzen için 2 sütunlu ızgaraya dizilip sıkışık moda geçer. */
function calendarHTML(opts: CelebrationOpts): string {
  const locale = INTL_LOCALES[opts.locale] || "en-US";
  const monthLabel = (y: number, m: number) =>
    new Date(y, m, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
  const weekdayNarrow = (i: number) =>
    new Date(2021, 0, 4 + i).toLocaleDateString(locale, { weekday: "short" });

  const done = new Set(opts.days.filter((d) => d.done).map((d) => d.date));
  const start = parseISO(opts.startDate);
  const end = parseISO(opts.endDate);

  // Çok ay → sıkışık mod (küçük kutucuklar, 2 sütunlu ızgara).
  let monthCount = 0;
  {
    const c = new Date(start);
    let g = 0;
    while (c <= end && g++ < 60) {
      monthCount += 1;
      c.setMonth(c.getMonth() + 1);
      c.setDate(1);
    }
  }
  const compact = monthCount > 1;
  const fDay = compact ? 20 : 28;
  const fCheck = compact ? 11 : 14;
  const fMonth = compact ? 17 : 22;
  const fWeek = compact ? 11 : 14;
  const circleMax = compact ? 64 : 96;

  const weekdayCell = (label: string) =>
    `<div style="box-sizing:border-box;padding:6px 0;text-align:center;font-size:${fWeek}px;font-weight:700;color:#9ca3af;text-transform:capitalize;">${label}</div>`;
  const emptyCell = () =>
    `<div style="box-sizing:border-box;"></div>`;
  const dayCell = (d: Date, isStart: boolean, isEnd: boolean) => {
    const iso = isoOf(d);
    const isDone = done.has(iso);
    const bg = isDone ? "background:#10b981;" : "background:#fef3c7;";
    const ring = isStart || isEnd ? "box-shadow:0 0 0 3px #065f46;" : "";
    const marker = isStart
      ? `<div style="color:#065f46;font-weight:700;font-size:12px;margin-top:6px;">${opts.startLabel}</div>`
      : isEnd
        ? `<div style="color:#065f46;font-weight:700;font-size:12px;margin-top:6px;">${opts.endLabel}</div>`
        : "";
    return `<div style="box-sizing:border-box;padding:4px;display:flex;flex-direction:column;align-items:center;">
      <div style="box-sizing:border-box;width:100%;max-width:${circleMax}px;aspect-ratio:1/1;border-radius:9999px;${bg}${ring}display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto;">
        <span style="font-size:${fDay}px;font-weight:800;color:${isDone ? "#ffffff" : "#b45309"};line-height:1;">${d.getDate()}</span>
        ${isDone ? `<span style="font-size:${fCheck}px;font-weight:800;color:#ffffff;line-height:1;margin-top:3px;">✓</span>` : ""}
      </div>
      ${marker}
    </div>`;
  };

  const weekdayHeader = Array.from({ length: 7 }, (_, i) => weekdayCell(weekdayNarrow(i))).join("");

  const blocks: string[] = [];
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard++ < 60) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = cursor.getDate();
    const offset = (new Date(y, m, firstDay).getDay() + 6) % 7; // Pazartesi=0

    let cells = "";
    let cellCount = offset;
    for (let i = 0; i < offset; i++) cells += emptyCell();
    const d = new Date(y, m, firstDay);
    for (let i = firstDay; i <= daysInMonth && d <= end; i++) {
      cells += dayCell(d, isoOf(d) === opts.startDate, isoOf(d) === opts.endDate);
      cellCount += 1;
      d.setDate(d.getDate() + 1);
    }
    while (cellCount % 7 !== 0) {
      cells += emptyCell();
      cellCount += 1;
    }

    blocks.push(`
      <div style="min-width:0;padding-top:${compact ? 14 : 20}px;">
        <div style="text-align:center;font-size:${fMonth}px;font-weight:800;color:#0f172a;margin-bottom:${compact ? 8 : 10}px;">${monthLabel(y, m)}</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:${compact ? 4 : 6}px;padding:${compact ? 8 : 10}px ${compact ? 8 : 12}px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
          ${weekdayHeader}
          ${cells}
        </div>
      </div>`);

    cursor.setFullYear(y);
    cursor.setMonth(m + 1);
    cursor.setDate(1);
  }

  const wrap = monthCount > 1
    ? `display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;`
    : "";
  return `<div style="${wrap}">${blocks.join("")}</div>`;
}

/** Kutlama kartı DOM düğümünü (ekran dışında) oluşturur. */
function createCelebrationCard(opts: CelebrationOpts): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;left:-10000px;top:0;width:1080px;background:#ffffff;padding:52px;box-sizing:border-box;" +
    "font-family:system-ui,-apple-system,'Segoe UI','Roboto',sans-serif;";

  const fmtDate = (iso: string) =>
    parseISO(iso).toLocaleDateString(INTL_LOCALES[opts.locale] || "en-US", { day: "numeric", month: "short", year: "numeric" });

  el.innerHTML = `
    <div style="box-sizing:border-box;border:2px solid #d1fae5;border-radius:36px;padding:44px;background:linear-gradient(180deg,#f0fdf9 0%,#ffffff 55%);">
      <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:22px;border-bottom:2px solid #e5e7eb;">
        <span style="font-size:28px;font-weight:800;color:#0f172a;">${opts.appName}</span>
        <span style="font-size:18px;color:#9ca3af;">${opts.headerDate}</span>
      </div>

      <div style="text-align:center;padding:36px 0 10px;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:170px;height:170px;border-radius:9999px;background:linear-gradient(135deg,#34d399,#059669);box-shadow:0 18px 40px -12px rgba(5,150,105,0.55);font-size:92px;">${opts.emoji}</div>
      </div>
      <div style="text-align:center;font-size:46px;font-weight:900;color:#0f172a;line-height:1.15;">${opts.title}</div>

      <div style="text-align:center;margin:20px auto 0;display:inline-block;padding:12px 28px;border-radius:9999px;background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;font-size:22px;font-weight:700;">
        ${opts.startLabel} &nbsp;${fmtDate(opts.startDate)} &nbsp;—&nbsp; ${fmtDate(opts.endDate)}&nbsp; ${opts.endLabel}
      </div>
      <div style="text-align:center;margin-top:12px;font-size:24px;font-weight:700;color:#374151;">
        ${opts.daysDoneLabel.replace("{done}", String(opts.doneCount)).replace("{total}", String(opts.totalDays))}
      </div>

      ${calendarHTML(opts)}

      <div style="text-align:center;padding-top:34px;">
        <div style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:250px;height:250px;border-radius:9999px;border:6px double #059669;color:#047857;background:rgba(16,185,129,0.08);transform:rotate(-10deg);">
          <span style="font-size:52px;line-height:1;">✓</span>
          <span style="font-size:34px;font-weight:900;text-transform:uppercase;letter-spacing:1px;padding:6px 18px;text-align:center;line-height:1.25;">${opts.sealText}</span>
        </div>
      </div>

      <div style="text-align:center;margin-top:34px;padding-top:18px;border-top:1px solid #e5e7eb;font-size:15px;color:#9ca3af;">${opts.footer}</div>
    </div>`;

  document.body.appendChild(el);
  return el;
}

/** Kutlama kartı DOM düğümünü (ekran dışında) HTML'den görüntüye çevirir. */
async function captureCelebration(opts: CelebrationOpts): Promise<HTMLCanvasElement> {
  const el = createCelebrationCard(opts);
  try {
    return await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
    });
  } finally {
    el.remove();
  }
}

/**
 * Tamamlanan challenge için görsel kutlama kartı oluşturup PNG olarak paylaşır.
 * Karta raporlardakine benzer üst başlık, gün sayılı çevrimsel mini takvim
 * (başlangıç ve bitiş tarihleri işaretli), emoji rozet ve onay mührü eklenir.
 * Web'de indirir; native'de paylaşım menüsüyle gönderir.
 */
export async function shareChallengeCelebrationAsImage(opts: CelebrationOpts): Promise<boolean> {
  try {
    const canvas = await captureCelebration(opts);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
    });
    const d = new Date();
    const name = `challenge-celebration-${d.toISOString().slice(0, 10)}.png`;
    await deliver(blob, name);
    return true;
  } catch (e) {
    console.error("[reportShare] Kutlama kartı (PNG) paylaşılamadı:", e);
    return false;
  }
}

/**
 * Tamamlanan challenge için aynı kutlama kartını tek sayfalık A4 PDF olarak
 * paylaşır. Görüntü, sayfanın ortasına sığacak şekilde ölçeklenir.
 */
export async function shareChallengeCelebrationAsPdf(opts: CelebrationOpts): Promise<boolean> {
  try {
    const canvas = await captureCelebration(opts);
    const imgData = canvas.toDataURL("image/png");
    const landscape = canvas.width > canvas.height;
    const pdf = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "pt", format: "a4" });
    const pageW = landscape ? 841.89 : 595.28;
    const pageH = landscape ? 595.28 : 841.89;
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    pdf.addImage(imgData, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
    const blob = pdf.output("blob");
    const d = new Date();
    const name = `challenge-celebration-${d.toISOString().slice(0, 10)}.pdf`;
    await deliver(blob, name);
    return true;
  } catch (e) {
    console.error("[reportShare] Kutlama kartı (PDF) paylaşılamadı:", e);
    return false;
  }
}

/** Geriye dönük uyumluluk: görsel (PNG) paylaşım. */
export const shareChallengeCelebration = shareChallengeCelebrationAsImage;
