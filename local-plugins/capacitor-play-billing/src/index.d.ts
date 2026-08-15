export interface BillingProduct {
  /** Play Console'da tanımlanan ürün ID'si, örn. "destekci_2_99" */
  productId: string;
  /** Kullanıcının bölgesine göre Google'ın formatladığı fiyat, örn. "₺119,99" veya "$2.99" */
  formattedPrice: string;
  /** ISO 4217 para birimi kodu, örn. "TRY", "USD", "EUR" */
  priceCurrencyCode: string;
  /** Play Console'daki ürün başlığı */
  title: string;
  /** Play Console'daki ürün açıklaması */
  description: string;
}

export interface QueryProductsOptions {
  /** Play Console'da tanımlı, sorgulanacak ürün ID'leri listesi */
  productIds: string[];
}

export interface QueryProductsResult {
  products: BillingProduct[];
}

export interface PurchaseOptions {
  productId: string;
}

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  /** Kullanıcı satın almayı iptal ettiyse veya bir hata oluştuysa açıklama */
  message?: string;
}

export interface IsSupporterResult {
  isSupporter: boolean;
  /** Kullanıcının aldığı destekçi ürünlerin ID'leri (birden fazla olabilir) */
  ownedProductIds?: string[];
}

export interface RestoreResult {
  restored: boolean;
  isSupporter: boolean;
}

export interface PlayBillingPlugin {
  /** Verilen ürün ID'leri için güncel, bölgeye-özel fiyatları Play'den çeker. */
  queryProducts(options: QueryProductsOptions): Promise<QueryProductsResult>;
  /** Satın alma akışını başlatır (Play'in kendi ödeme ekranını açar). */
  purchase(options: PurchaseOptions): Promise<PurchaseResult>;
  /** Cihazdaki Google hesabının daha önce destekçi ürünü alıp almadığını kontrol eder. */
  isSupporter(): Promise<IsSupporterResult>;
  /** Uygulama yeniden yüklendiğinde/farklı cihazda aynı hesapla açıldığında satın almaları geri getirir. */
  restorePurchases(): Promise<RestoreResult>;
}

declare const PlayBilling: PlayBillingPlugin;
export default PlayBilling;
