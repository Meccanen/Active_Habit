import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
  RewardInterstitialAdPluginEvents,
  AdmobConsentStatus,
  type BannerAdOptions,
  type AdMobBannerSize,
  type RewardInterstitialAdOptions,
} from '@capacitor-community/admob';

/**
 * Meccanen Hava Durumu — AdMob banner servisi.
 *
 * Bu dosya UI ile native AdMob plugin'i arasındaki TEK temas noktasıdır.
 * App.tsx hiçbir zaman @capacitor-community/admob'u doğrudan import etmemeli.
 *
 * NOT: Ad Unit ID derleme zamanında VITE_ADMOB_BANNER_ID ortam değişkeninden
 * gelir (bkz. .github/workflows/build-apk.yml — ADMOB_BANNER_ID secret'ı).
 * Tanımlı değilse Google'ın resmi paylaşımlı TEST banner ad unit'i
 * (ca-app-pub-3940256099942544/6300978111) kullanılır — bu ID ile AdMob
 * otomatik test modunda çalışır, gerçek hesap/reklam gerekmez ve tıklamalar
 * güvenlidir. Gerçek reklam ID'si secret olarak eklendiğinde otomatik olarak
 * test ID'sinin yerini alır.
 * AdMob App ID ise JS tarafında kullanılmaz; sadece native
 * AndroidManifest.xml'e meta-data olarak enjekte edilir (yine CI'da).
 */

const BANNER_AD_UNIT_ID = import.meta.env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111';
const REWARDED_INTERSTITIAL_AD_UNIT_ID = import.meta.env.VITE_ADMOB_REWARDED_INTERSTITIAL_ID;

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

// ---- Ödüllü Geçiş Reklamı (Rewarded Interstitial) ----
// Kullanım: UV/Hava Kalitesi/Ay Evresi/Hava Uyarısı gibi ekstra detay
// ekranlarını açmadan önce.
//
// KoolDown kuralı: kullanıcı bir reklam izleyip ödülü kazandıktan sonra,
// AYNI OTURUMDA 5 dakika boyunca başka ödüllü reklam gösterilmez (kilit
// açık sayılır). Uygulama kapatılıp yeniden açılırsa bu oturum-içi sayaç
// (bellek) sıfırlanır → ödüllü reklam gösterimleri yeniden aktif olur.
//
// NOT: Bu sayaç bilinçli olarak bellekte tutulur (localStorage'a yazılmaz);
// böylece "uygulamadan çıkıp girince yeniden aktif" davranışı sağlanır.
const REWARD_COOLDOWN_MS = 5 * 60 * 1000; // 5 dakika

let rewardedUntil = 0;

/**
 * Bu oturumda reklam izlenip kilidin açık olduğunu (koolDown içinde) döner.
 * Oturum içinde 5 dk geçmemişse true döner — böylece yeni ödüllü reklam
 * gösterilmez.
 */
export function isRewardedUnlockedThisSession(): boolean {
  return rewardedUntil > Date.now();
}

/** KoolDown'ı manuel olarak başlatır (oturum içinde 5 dk). */
export function markRewardedUnlocked(): void {
  rewardedUntil = Date.now() + REWARD_COOLDOWN_MS;
}

/** KoolDown'ın geri kalanını saniye cinsinden döner (0 ise yeni reklam gösterilebilir). */
export function getRewardCooldownLeft(): number {
  return Math.max(0, Math.ceil((rewardedUntil - Date.now()) / 1000));
}

/**
 * Detay ekranı açılmadan önce çağrılır.
 * - Oturumda zaten açılmışsa: hemen true döner, reklam göstermez.
 * - Ad unit tanımlı değilse veya reklam herhangi bir sebeple
 *   yüklenemez/gösterilemezse: "fail-open" — içerik yine de açılır
 *   (kötü bir reklam doluluk oranı yüzünden kullanıcıyı özellikten tamamen
 *   mahrum bırakmamak tercih edildi; bu bilinçli bir ürün kararıdır).
 * - Kullanıcı reklamı ödül kazanmadan kapatırsa: false döner, içerik AÇILMAZ.
 */
export async function unlockWithRewardedInterstitial(): Promise<boolean> {
  if (rewardedUntil > Date.now()) return true;

  if (!REWARDED_INTERSTITIAL_AD_UNIT_ID) {
    console.warn('[adMobService] VITE_ADMOB_REWARDED_INTERSTITIAL_ID tanımlı değil, kilit açık bırakılıyor.');
    markRewardedUnlocked();
    return true;
  }

  await initializeAds();

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const handles: Promise<{ remove: () => void }>[] = [];

    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      handles.forEach((h) => h.then((x) => x.remove()));
      resolve(result);
    };

    handles.push(
      AdMob.addListener(RewardInterstitialAdPluginEvents.Rewarded, () => {
        markRewardedUnlocked();
        finish(true);
      })
    );
    handles.push(
      AdMob.addListener(RewardInterstitialAdPluginEvents.Dismissed, () => finish(false))
    );
    handles.push(
      AdMob.addListener(RewardInterstitialAdPluginEvents.FailedToLoad, (error) => {
        console.error('[adMobService] Ödüllü reklam yüklenemedi, kilit açık bırakılıyor:', error);
        markRewardedUnlocked();
        finish(true); // fail-open
      })
    );
    handles.push(
      AdMob.addListener(RewardInterstitialAdPluginEvents.FailedToShow, (error) => {
        console.error('[adMobService] Ödüllü reklam gösterilemedi, kilit açık bırakılıyor:', error);
        markRewardedUnlocked();
        finish(true); // fail-open
      })
    );

    (async () => {
      try {
        const options: RewardInterstitialAdOptions = { adId: REWARDED_INTERSTITIAL_AD_UNIT_ID };
        await AdMob.prepareRewardInterstitialAd(options);
        await AdMob.showRewardInterstitialAd();
      } catch (error) {
        console.error('[adMobService] Ödüllü reklam akışı hata verdi, kilit açık bırakılıyor:', error);
        markRewardedUnlocked();
        finish(true); // fail-open
      }
    })();
  });
}
