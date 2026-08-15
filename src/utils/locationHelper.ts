import { Geolocation } from "@capacitor/geolocation";

// Capacitor Geolocation API var mı? (APK'da var, web'de fallback kullanılır)
function isNativeAvailable(): boolean {
  try {
    const available = typeof Geolocation !== "undefined" &&
      typeof Geolocation.requestPermissions === "function";
    console.log("[Meccanen] Geolocation native available:", available);
    return available;
  } catch (e) {
    console.log("[Meccanen] Geolocation native check failed:", e);
    return false;
  }
}

// Native (Android) konum izni iste — sistem pop-up'ını tetikler
export async function requestLocationPermission(): Promise<boolean> {
  if (isNativeAvailable()) {
    try {
      console.log("[Meccanen] Requesting native location permission...");
      const result = await Geolocation.requestPermissions();
      console.log("[Meccanen] Permission result:", JSON.stringify(result));
      return result.location === "granted" || result.coarseLocation === "granted";
    } catch (e) {
      console.log("[Meccanen] Permission request failed:", e);
      return false;
    }
  }
  // Web fallback (tarayıcıda test ederken)
  if (!navigator.geolocation) return false;
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
}

// Mevcut izin durumunu kontrol et (pop-up göstermeden)
export async function checkLocationPermission(): Promise<boolean> {
  if (isNativeAvailable()) {
    try {
      const result = await Geolocation.checkPermissions();
      return result.location === "granted" || result.coarseLocation === "granted";
    } catch {
      return false;
    }
  }
  return false;
}

// Konum koordinatlarını al
export async function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  if (isNativeAvailable()) {
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000,
      });
      console.log("[Meccanen] Got position:", pos.coords.latitude, pos.coords.longitude);
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch (e) {
      console.log("[Meccanen] getCurrentPosition failed:", e);
      throw e;
    }
  }
  // Web fallback
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
}
