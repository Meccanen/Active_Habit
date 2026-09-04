import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

const REPORT_DIR = "reports";

/**
 * Rapor paylaşım servisi. Detaylı istatistik ekranındaki her bir rapor
 * bloğunu (ör. son 30 gün grafiği, alışkanlık serileri) HTML'den görüntüye
 * çevirip PNG veya PDF olarak paylaşım menüsüyle gönderir.
 *
 * Tüm görüntüleme cihazda yapılır; hiçbir veri sunucuya gönderilmez.
 */

function filename(ext: string): string {
  const d = new Date().toISOString().slice(0, 10);
  return `habit-report-${d}.${ext}`;
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
  await Filesystem.writeFile({
    path: `${REPORT_DIR}/${name}`,
    data: base64,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
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
      // sonrasını alırız.
      resolve(result.split(",")[1] ?? result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Bir HTML bloğunu PNG görüntüsüne çevirip paylaşır. */
export async function shareReportBlockAsImage(element: HTMLElement): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
  await deliver(blob, filename("png"));
}

/** Bir HTML bloğunu tek sayfalık PDF'e çevirip paylaşır. */
export async function shareReportBlockAsPdf(element: HTMLElement): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
  });
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
