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
 * - İnline stili olan renkli öğeler (grafik barları, ilerleme şeritleri)
 *   korunur — grafik desteği ve renkli ikon/zenginlik kaybolmaz.
 */
function applyPrintStyle(target: HTMLElement, clonedDoc: Document): void {
  const all = target.querySelectorAll<HTMLElement>("*");
  all.forEach((el) => {
    const bg = el.style.background;
    if (bg) {
      // İnline düz renk (blok/kart arka planı) → beyaza; gradyan (bar) → korunur.
      if (!bg.includes("gradient")) el.style.background = "transparent";
    } else if (!el.style.backgroundColor || el.style.backgroundColor.startsWith("rgba")) {
      // Class'tan gelen arka planlar veya ilerleme şeridi izi → beyaza.
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
      scale: 2,
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
