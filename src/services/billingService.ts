import PlayBilling, {
  type BillingProduct,
  type PurchaseResult,
} from 'capacitor-play-billing';

/**
 * Meccanen "Destekçi Rozeti" satın alma servisi.
 *
 * Bu dosya UI (SettingsPanel vb.) ile native billing detayları arasındaki
 * TEK temas noktasıdır. UI hiçbir zaman PlayBilling plugin'ini doğrudan
 * import etmemeli — ileride iOS/StoreKit eklendiğinde sadece bu dosya
 * içindeki platform seçimi değişecek, UI ve arayüz aynı kalacak.
 */

/** Play Console'da tanımlı, tek seferlik "Destekçi Rozeti" ürün ID'leri. */
export const SUPPORTER_PRODUCT_IDS = ['destekci_2_99', 'destekci_4_99'] as const;

export type SupporterProductId = (typeof SUPPORTER_PRODUCT_IDS)[number];

const SUPPORTER_STATUS_CACHE_KEY = 'meccanen_is_supporter';

/**
 * Destekçi ürünlerinin güncel, kullanıcının bölgesine göre formatlanmış
 * fiyatlarını Play'den çeker. Cache'lenmez — döviz kuru/fiyat güncellemeleri
 * her zaman güncel yansısın diye Ayarlar ekranı her açıldığında tekrar çağrılmalı.
 */
export async function getSupporterProducts(): Promise<BillingProduct[]> {
  try {
    const result = await PlayBilling.queryProducts({
      productIds: [...SUPPORTER_PRODUCT_IDS],
    });
    return result.products;
  } catch (error) {
    console.error('[billingService] Ürünler alınamadı:', error);
    return [];
  }
}

/**
 * Satın alma akışını başlatır. Play'in kendi ödeme ekranı açılır,
 * kullanıcı tamamlayınca (veya iptal edince) sonuç burada döner.
 */
export async function purchaseSupporterBadge(
  productId: SupporterProductId
): Promise<PurchaseResult> {
  try {
    const result = await PlayBilling.purchase({ productId });
    if (result.success) {
      await setCachedSupporterStatus(true);
    }
    return result;
  } catch (error) {
    console.error('[billingService] Satın alma başarısız:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Bilinmeyen hata',
    };
  }
}

/**
 * Kullanıcının daha önce bir destekçi ürünü alıp almadığını kontrol eder.
 * Uygulama her açıldığında bir kez çağrılmalı (App.tsx içinde).
 */
export async function checkIsSupporter(): Promise<boolean> {
  try {
    const result = await PlayBilling.isSupporter();
    await setCachedSupporterStatus(result.isSupporter);
    return result.isSupporter;
  } catch (error) {
    console.error('[billingService] Destekçi durumu kontrol edilemedi:', error);
    // Ağ/servis hatası durumunda son bilinen (cache'lenmiş) durumu döndür,
    // rozeti gereksiz yere kaybettirmeyelim.
    return getCachedSupporterStatus();
  }
}

/**
 * Kullanıcı "Satın Almaları Geri Yükle" butonuna bastığında çağrılır
 * (örn. uygulamayı silip yeniden yükledikten veya cihaz değiştirdikten sonra).
 */
export async function restoreSupporterPurchases(): Promise<boolean> {
  try {
    const result = await PlayBilling.restorePurchases();
    await setCachedSupporterStatus(result.isSupporter);
    return result.isSupporter;
  } catch (error) {
    console.error('[billingService] Satın almalar geri yüklenemedi:', error);
    return false;
  }
}

// ---------------------------------------------------------------------
// Yerel cache — Play'e her erişilemediğinde rozeti anlık kaybettirmemek için.
// Not: Bu, satın alma doğrulaması DEĞİL, sadece çevrimdışı/geçici hata
// durumunda son bilinen UI durumu. Gerçek doğrulama her zaman
// PlayBilling.isSupporter() üzerinden Play'e sorulur.
// ---------------------------------------------------------------------

async function setCachedSupporterStatus(isSupporter: boolean): Promise<void> {
  try {
    localStorage.setItem(SUPPORTER_STATUS_CACHE_KEY, isSupporter ? '1' : '0');
  } catch {
    // localStorage erişilemez durumdaysa sessizce geç.
  }
}

function getCachedSupporterStatus(): boolean {
  try {
    return localStorage.getItem(SUPPORTER_STATUS_CACHE_KEY) === '1';
  } catch {
    return false;
  }
}
