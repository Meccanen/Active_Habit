# Meccanen Hava Durumu (Reklamsız)

Meccanen Namaz Vakti'nin çerçevesi (tema sistemi, dil desteği, konum yönetimi,
Destekçi Rozeti) korunarak oluşturulan reklamsız hava durumu uygulaması.
Saatlik ve 7 günlük tahmin OpenWeather One Call API 3.0'dan alınıyor.

## GitHub'a yükleme sırası

1. Bu klasördeki tüm dosya ve klasörleri repo köküne (`Reklamsiz_Hava_Durumu`) yükle,
   klasör yapısını birebir koru (`src/`, `local-plugins/`, `.github/workflows/`).
2. **public/meccanen-logo.png** dosyasını ekle (1024×1024 PNG, şeffaf zemin) —
   workflow ikon üretimi için bu dosyayı arıyor, yoksa build hata verir.
3. Repo **Settings → Secrets and variables → Actions** altına şu secret'ı ekle:
   - `OPENWEATHER_API_KEY` — OpenWeather One Call API 3.0 anahtarın
4. (İsteğe bağlı, imzalı AAB için) `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`,
   `KEY_ALIAS`, `KEY_PASSWORD` secret'larını ekle.
5. **Actions** sekmesinden workflow'u tetikle (`workflow_dispatch`) veya `main`
   dalına push yaparak otomatik build'i başlat.

## Bilinçli olarak henüz eklenmedi

- Ana ekranın nihai görsel tasarımı (şu an fonksiyonel ama sade bir arayüz var,
  namaz vaktindeki gibi zenginleştirilecek)
- Play Console ürün ID'leri (`billingService.ts` içinde `SUPPORTER_PRODUCT_IDS`
  namaz vaktindeki ID'lerle aynı — yeni appId için Play Console'da yeni ürünler
  oluşturulup ID'ler burada güncellenmeli)
- App ikonu / feature graphic
- Gizlilik politikası sayfası (TR/EN)
