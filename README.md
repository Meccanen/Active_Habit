# Meccanen Hava Durumu (Reklamsız)

Meccanen Namaz Vakti'nin çerçevesi (tema sistemi, dil desteği, konum yönetimi,
Destekçi Rozeti) korunarak oluşturulan reklamsız hava durumu uygulaması.
Saatlik ve 7 günlük tahmin **Open-Meteo**'dan alınıyor (key gerektirmiyor,
namaz vaktindeki geocoding ile aynı sağlayıcı ailesi).

⚠️ Open-Meteo'nun ücretsiz katmanı **ticari olmayan kullanım** için ve
günde 10.000 / saatte 5.000 / dakikada 600 çağrı limitli
(https://open-meteo.com/en/terms). Kullanıcı sayısı büyüdükçe (kabaca birkaç
bin aktif kullanıcı sonrası) bu limitlere takılma ihtimali var — o noktada
ya paid plan (Standard $29/ay, 1M çağrı/ay) ya da kendi VPS'inde bir cache
proxy (n8n ile şehir başına 10-15 dakikada bir Open-Meteo'yu çağırıp
sonucu önbelleğe alan basit bir endpoint) kurulması gerekecek.

## GitHub'a yükleme sırası

1. Bu klasördeki tüm dosya ve klasörleri repo köküne (`Reklamsiz_Hava_Durumu`) yükle,
   klasör yapısını birebir koru (`src/`, `local-plugins/`, `.github/workflows/`).
2. **public/meccanen-logo.png** dosyasını ekle (1024×1024 PNG, şeffaf zemin) —
   workflow ikon üretimi için bu dosyayı arıyor, yoksa build hata verir.
3. (İsteğe bağlı, imzalı AAB için) `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`,
   `KEY_ALIAS`, `KEY_PASSWORD` secret'larını repo Settings → Secrets and
   variables → Actions altına ekle.
4. **Actions** sekmesinden workflow'u tetikle (`workflow_dispatch`) veya `main`
   dalına push yaparak otomatik build'i başlat.

## Bilinçli olarak henüz eklenmedi

- Ana ekranın nihai görsel tasarımı (şu an fonksiyonel ama sade bir arayüz var,
  namaz vaktindeki gibi zenginleştirilecek)
- Play Console ürün ID'leri (`billingService.ts` içinde `SUPPORTER_PRODUCT_IDS`
  namaz vaktindeki ID'lerle aynı — yeni appId için Play Console'da yeni ürünler
  oluşturulup ID'ler burada güncellenmeli)
- App ikonu / feature graphic
- Gizlilik politikası sayfası (TR/EN)
