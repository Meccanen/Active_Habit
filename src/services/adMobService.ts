import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
  AdmobConsentStatus,
  type BannerAdOptions,
  type AdMobBannerSize,
} from '@capacitor-community/admob';

/**
 * Meccanen Hava Durumu — AdMob banner servisi.
 *
 * Bu dosya UI ile native AdMob plugin'i arasındaki TEK temas noktasıdır.
 * App.tsx hiçbir zaman @capacitor-community/admob'u doğrudan import etmemeli.
 *
 * NOT: Ad Unit ID derleme zamanında VITE_ADMOB_BANNER_ID ortam değişkeninden
 * gelir (bkz. .github/workflows/build-apk.yml — ADMOB_BANNER_ID secret'ı).
 * AdMob App ID ise JS tarafında kullanılmaz; sadece native
 * AndroidManifest.xml'e meta-data olarak enjekte edilir (yine CI'da).
 */

const BANNER_AD_UNIT_ID = import.meta.env.VITE_ADMOB_BANNER_ID;

// Virgülle ayrılmış test cihaz ID listesi (opsiyonel). Boşsa normal üretim
// modunda çalışılır. Bir cihaz burada kayıtlıysa, o cihaza GERÇEK reklam
// biriminden "test" olarak işaretlenmiş, tıklanması güvenli reklamlar gelir
// — AdMob hesabını geçersiz trafik riskine sokmadan gerçek entegrasyonu
// test etmenin resmi yöntemi budur.
// Kendi cihazının ID'sini öğrenmek için: uygulamayı logcat açıkken çalıştır,
// "Use RequestConfiguration.Builder().setTestDeviceIds(...)" satırındaki
// ID'yi kopyala (adb logcat | grep -i "test device").
const TEST_DEVICE_IDS = (import.meta.env.VITE_ADMOB_TEST_DEVICE_IDS ?? '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

let initialized = false;
let bannerVisible = false;

/**
 * SDK'yı başlatır ve (AB/EEA kullanıcıları için) gerekiyorsa UMP onay
 * formunu gösterir. Uygulama açılışında bir kez, banner gösterilmeden
 * ÖNCE çağrılmalı.
 */
export async function initializeAds(): Promise<void> {
  if (initialized) return;
  try {
    await AdMob.initialize(
      TEST_DEVICE_IDS.length > 0
        ? { testingDevices: TEST_DEVICE_IDS, initializeForTesting: true }
        : undefined
    );

    const consentInfo = await AdMob.requestConsentInfo();
    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdmobConsentStatus.REQUIRED
    ) {
      await AdMob.showConsentForm();
    }

    initialized = true;
  } catch (error) {
    console.error('[adMobService] Başlatma başarısız:', error);
  }
}

/**
 * Alt banner reklamını gösterir. Destekçi Rozeti sahibi kullanıcılar için
 * ÇAĞRILMAMALI — çağıran taraf (App.tsx) bu kontrolü yapar.
 */
export async function showBannerAd(): Promise<void> {
  if (!BANNER_AD_UNIT_ID) {
    console.warn('[adMobService] VITE_ADMOB_BANNER_ID tanımlı değil, banner atlanıyor.');
    return;
  }
  if (bannerVisible) return;

  await initializeAds();

  const options: BannerAdOptions = {
    adId: BANNER_AD_UNIT_ID,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    // NOT: isTesting burada bilinçli olarak kullanılmıyor — o, ad unit'i
    // Google'ın paylaşımlı örnek reklam birimiyle DEĞİŞTİRİR (kendi birimin
    // hiç test edilmemiş olur). Güvenli test için yukarıdaki
    // testingDevices/initializeForTesting mekanizması kullanılıyor.
  };

  try {
    await AdMob.showBanner(options);
    bannerVisible = true;
  } catch (error) {
    console.error('[adMobService] Banner gösterilemedi:', error);
  }
}

/** Banner'ı gizler (ör. kullanıcı Destekçi Rozeti satın aldığında). */
export async function hideBannerAd(): Promise<void> {
  if (!bannerVisible) return;
  try {
    await AdMob.hideBanner();
  } catch (error) {
    console.error('[adMobService] Banner gizlenemedi:', error);
  } finally {
    bannerVisible = false;
  }
}

/** Banner'ı tamamen kaldırır (bellek/native view temizliği). */
export async function removeBannerAd(): Promise<void> {
  try {
    await AdMob.removeBanner();
  } catch {
    // Banner zaten yoksa sessizce geç.
  } finally {
    bannerVisible = false;
  }
}

/**
 * Banner native ekranda WebView'in ÜSTÜNE oturur, HTML içeriği kapatabilir.
 * Bu yüzden App.tsx, banner'ın gerçek yüksekliği kadar alt boşluk bırakmalı.
 * Yükseklik cihaza/genişliğe göre değiştiği için (ADAPTIVE_BANNER) sabit bir
 * px tahmini yerine gerçek zamanlı SizeChanged event'i dinleniyor.
 * Döndürülen fonksiyon aboneliği iptal eder.
 */
export function onBannerHeightChange(callback: (heightPx: number) => void): () => void {
  const loadedHandle = AdMob.addListener(BannerAdPluginEvents.Loaded, () => {});
  const sizeHandle = AdMob.addListener(
    BannerAdPluginEvents.SizeChanged,
    (size: AdMobBannerSize) => callback(size.height)
  );
  return () => {
    loadedHandle.then((h) => h.remove());
    sizeHandle.then((h) => h.remove());
  };
}
