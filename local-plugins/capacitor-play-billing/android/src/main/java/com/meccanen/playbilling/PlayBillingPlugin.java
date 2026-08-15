package com.meccanen.playbilling;

import android.app.Activity;
import android.util.Log;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Meccanen için özel Google Play Billing entegrasyonu.
 *
 * Amaç: "Destekçi Rozeti" adlı, tek seferlik, tüketilemeyen (non-consumable)
 * iki ürünün ($2.99 / $4.99 karşılığı yerel fiyat) satışını Play Billing
 * Library v9 üzerinden DOĞRUDAN yapmak. Üçüncü parti bir SDK/servis (RevenueCat vb.)
 * kullanılmıyor — sadece Google'ın resmi native kütüphanesi.
 *
 * Not: Bu ürün kritik bir özelliği kilitlemediği için (sadece manevi/görsel bir
 * rozet), sunucu taraflı imza doğrulaması (server-side receipt validation)
 * bilinçli olarak uygulanmadı. queryPurchases() + acknowledge yeterli görüldü.
 */
@CapacitorPlugin(name = "PlayBilling")
public class PlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private static final String TAG = "PlayBillingPlugin";

    private BillingClient billingClient;

    /** purchase() çağrısı sırasında bekleyen PluginCall — sonuç PurchasesUpdatedListener'da gelir. */
    private PluginCall pendingPurchaseCall;

    /** queryProducts() sırasında bulunan ProductDetails'leri saklıyoruz, purchase() burada arıyor. */
    private final Map<String, ProductDetails> productDetailsCache = new HashMap<>();

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
                .setListener(this)
                .enablePendingPurchases(
                        PendingPurchasesParams.newBuilder()
                                .enableOneTimeProducts()
                                .build()
                )
                .build();
    }

    // ---------------------------------------------------------------------
    // Bağlantı yönetimi
    // ---------------------------------------------------------------------

    private interface ConnectionCallback {
        void onReady();
        void onFailure(String message);
    }

    private void ensureConnected(ConnectionCallback callback) {
        if (billingClient.isReady()) {
            callback.onReady();
            return;
        }
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingResponseCode.OK) {
                    callback.onReady();
                } else {
                    callback.onFailure("Play Billing bağlantısı kurulamadı: " + billingResult.getDebugMessage());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                Log.w(TAG, "Billing servisi bağlantısı koptu, bir sonraki çağrıda yeniden denenecek.");
            }
        });
    }

    // Küçük bir kısayol: BillingClient.BillingResponseCode uzun olduğundan
    private static final class BillingResponseCode {
        static final int OK = com.android.billingclient.api.BillingClient.BillingResponseCode.OK;
        static final int USER_CANCELED = com.android.billingclient.api.BillingClient.BillingResponseCode.USER_CANCELED;
        static final int ITEM_ALREADY_OWNED = com.android.billingclient.api.BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED;
    }

    // ---------------------------------------------------------------------
    // queryProducts — fiyatları Play'den çeker (bölgeye göre otomatik formatlı)
    // ---------------------------------------------------------------------

    @PluginMethod
    public void queryProducts(PluginCall call) {
        JSArray productIdsArray = call.getArray("productIds");
        if (productIdsArray == null || productIdsArray.length() == 0) {
            call.reject("productIds parametresi boş olamaz.");
            return;
        }

        List<String> productIds = new ArrayList<>();
        try {
            for (int i = 0; i < productIdsArray.length(); i++) {
                productIds.add(productIdsArray.getString(i));
            }
        } catch (JSONException e) {
            call.reject("productIds ayrıştırılamadı: " + e.getMessage());
            return;
        }

        ensureConnected(new ConnectionCallback() {
            @Override
            public void onReady() {
                List<QueryProductDetailsParams.Product> products = new ArrayList<>();
                for (String id : productIds) {
                    products.add(
                            QueryProductDetailsParams.Product.newBuilder()
                                    .setProductId(id)
                                    .setProductType(BillingClient.ProductType.INAPP)
                                    .build()
                    );
                }

                QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                        .setProductList(products)
                        .build();

                billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsResult) -> {
                    if (billingResult.getResponseCode() != BillingResponseCode.OK) {
                        call.reject("Ürünler alınamadı: " + billingResult.getDebugMessage());
                        return;
                    }

                    List<ProductDetails> detailsList = productDetailsResult.getProductDetailsList();
                    JSArray resultArray = new JSArray();

                    for (ProductDetails details : detailsList) {
                        productDetailsCache.put(details.getProductId(), details);

                        ProductDetails.OneTimePurchaseOfferDetails offer =
                                details.getOneTimePurchaseOfferDetails();

                        JSObject obj = new JSObject();
                        obj.put("productId", details.getProductId());
                        obj.put("title", details.getTitle());
                        obj.put("description", details.getDescription());

                        if (offer != null) {
                            obj.put("formattedPrice", offer.getFormattedPrice());
                            obj.put("priceCurrencyCode", offer.getPriceCurrencyCode());
                        } else {
                            obj.put("formattedPrice", "");
                            obj.put("priceCurrencyCode", "");
                        }

                        resultArray.put(obj);
                    }

                    JSObject ret = new JSObject();
                    ret.put("products", resultArray);
                    call.resolve(ret);
                });
            }

            @Override
            public void onFailure(String message) {
                call.reject(message);
            }
        });
    }

    // ---------------------------------------------------------------------
    // purchase — satın alma ekranını açar, sonuç PurchasesUpdatedListener'da gelir
    // ---------------------------------------------------------------------

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        if (productId == null) {
            call.reject("productId parametresi zorunlu.");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Aktivite bulunamadı.");
            return;
        }

        ensureConnected(new ConnectionCallback() {
            @Override
            public void onReady() {
                ProductDetails details = productDetailsCache.get(productId);

                if (details != null) {
                    launchFlow(activity, call, details);
                } else {
                    // Cache'de yoksa önce tazeden sorgula, sonra satın al
                    List<QueryProductDetailsParams.Product> products = new ArrayList<>();
                    products.add(
                            QueryProductDetailsParams.Product.newBuilder()
                                    .setProductId(productId)
                                    .setProductType(BillingClient.ProductType.INAPP)
                                    .build()
                    );
                    QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                            .setProductList(products)
                            .build();

                    billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsResult) -> {
                        if (billingResult.getResponseCode() != BillingResponseCode.OK
                                || productDetailsResult.getProductDetailsList().isEmpty()) {
                            call.reject("Ürün bulunamadı: " + productId);
                            return;
                        }
                        ProductDetails fresh = productDetailsResult.getProductDetailsList().get(0);
                        productDetailsCache.put(productId, fresh);
                        launchFlow(activity, call, fresh);
                    });
                }
            }

            @Override
            public void onFailure(String message) {
                call.reject(message);
            }
        });
    }

    private void launchFlow(Activity activity, PluginCall call, ProductDetails details) {
        List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = new ArrayList<>();
        productDetailsParamsList.add(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(details)
                        .build()
        );

        BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(productDetailsParamsList)
                .build();

        // Bu çağrının sonucu senkron değil — onPurchasesUpdated() içinde tamamlanacak.
        pendingPurchaseCall = call;
        call.setKeepAlive(true);

        BillingResult result = billingClient.launchBillingFlow(activity, flowParams);
        if (result.getResponseCode() != BillingResponseCode.OK) {
            pendingPurchaseCall = null;
            call.reject("Satın alma başlatılamadı: " + result.getDebugMessage());
        }
        // OK ise burada bir şey yapmıyoruz, sonucu onPurchasesUpdated bekliyoruz.
    }

    // ---------------------------------------------------------------------
    // PurchasesUpdatedListener — Play'in ödeme ekranından dönen sonucu yakalar
    // ---------------------------------------------------------------------

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        PluginCall call = pendingPurchaseCall;
        pendingPurchaseCall = null;

        if (billingResult.getResponseCode() == BillingResponseCode.USER_CANCELED) {
            if (call != null) {
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("message", "Kullanıcı satın almayı iptal etti.");
                call.resolve(ret);
            }
            return;
        }

        if (billingResult.getResponseCode() == BillingResponseCode.ITEM_ALREADY_OWNED) {
            if (call != null) {
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("message", "Bu ürün zaten satın alınmış.");
                call.resolve(ret);
            }
            return;
        }

        if (billingResult.getResponseCode() != BillingResponseCode.OK || purchases == null) {
            if (call != null) {
                call.reject("Satın alma başarısız: " + billingResult.getDebugMessage());
            }
            return;
        }

        for (Purchase purchase : purchases) {
            handlePurchase(purchase, call);
        }
    }

    /**
     * KRİTİK ADIM: acknowledgePurchase() çağrılmazsa Google, satın almayı
     * 3 gün içinde OTOMATİK İADE eder. Her satın alma burada mutlaka acknowledge edilmeli.
     */
    private void handlePurchase(Purchase purchase, PluginCall originatingCall) {
        if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) {
            // PENDING durumu (örn. bekleyen banka transferi) — henüz acknowledge edilmez.
            if (originatingCall != null) {
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("message", "Satın alma beklemede (pending). Ödeme tamamlanınca otomatik onaylanacak.");
                originatingCall.resolve(ret);
            }
            return;
        }

        if (purchase.isAcknowledged()) {
            if (originatingCall != null) {
                resolvePurchaseSuccess(originatingCall, purchase);
            }
            return;
        }

        AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchase.getPurchaseToken())
                .build();

        billingClient.acknowledgePurchase(params, billingResult -> {
            if (billingResult.getResponseCode() == BillingResponseCode.OK) {
                Log.i(TAG, "Satın alma acknowledge edildi: " + purchase.getProducts());
                if (originatingCall != null) {
                    resolvePurchaseSuccess(originatingCall, purchase);
                }
            } else {
                Log.e(TAG, "Acknowledge başarısız: " + billingResult.getDebugMessage());
                if (originatingCall != null) {
                    originatingCall.reject("Satın alma onaylanamadı: " + billingResult.getDebugMessage());
                }
            }
        });
    }

    private void resolvePurchaseSuccess(PluginCall call, Purchase purchase) {
        JSObject ret = new JSObject();
        ret.put("success", true);
        if (!purchase.getProducts().isEmpty()) {
            ret.put("productId", purchase.getProducts().get(0));
        }
        call.resolve(ret);
    }

    // ---------------------------------------------------------------------
    // isSupporter — cihazdaki Google hesabının daha önce satın alıp almadığını kontrol eder
    // ---------------------------------------------------------------------

    @PluginMethod
    public void isSupporter(PluginCall call) {
        ensureConnected(new ConnectionCallback() {
            @Override
            public void onReady() {
                queryOwnedProducts(call, false);
            }

            @Override
            public void onFailure(String message) {
                call.reject(message);
            }
        });
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        ensureConnected(new ConnectionCallback() {
            @Override
            public void onReady() {
                queryOwnedProducts(call, true);
            }

            @Override
            public void onFailure(String message) {
                call.reject(message);
            }
        });
    }

    private void queryOwnedProducts(PluginCall call, boolean isRestoreCall) {
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build();

        billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
            if (billingResult.getResponseCode() != BillingResponseCode.OK) {
                call.reject("Satın almalar sorgulanamadı: " + billingResult.getDebugMessage());
                return;
            }

            List<String> ownedProductIds = new ArrayList<>();
            boolean isSupporter = false;

            for (Purchase purchase : purchases) {
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    isSupporter = true;
                    ownedProductIds.addAll(purchase.getProducts());

                    // Herhangi bir sebeple henüz acknowledge edilmemişse (örn. eski bir
                    // satın alma) burada da bir güvenlik ağı olarak tekrar deneyelim.
                    if (!purchase.isAcknowledged()) {
                        AcknowledgePurchaseParams ackParams = AcknowledgePurchaseParams.newBuilder()
                                .setPurchaseToken(purchase.getPurchaseToken())
                                .build();
                        billingClient.acknowledgePurchase(ackParams, ignoredResult -> {
                            // Sonucu burada ayrıca beklemiyoruz, sıradaki restore/isSupporter
                            // çağrısında zaten acknowledged görünecek.
                        });
                    }
                }
            }

            JSObject ret = new JSObject();
            ret.put("isSupporter", isSupporter);

            JSArray ownedArray = new JSArray();
            for (String id : ownedProductIds) {
                ownedArray.put(id);
            }
            ret.put("ownedProductIds", ownedArray);

            if (isRestoreCall) {
                ret.put("restored", true);
            }

            call.resolve(ret);
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (billingClient != null && billingClient.isReady()) {
            billingClient.endConnection();
        }
        super.handleOnDestroy();
    }
}
