# Meccanen Habit Tracker

Meccanen Namaz Vakti / Hava Durumu'nun çerçevesi (16 tema, 5 dil desteği,
font ölçeği, Destekçi Rozeti) korunarak oluşturulan **yerel (localStorage)**
alışkanlık takip uygulaması. Veri telefonda kalır, internet gerekmez.

## Özellikler

- **Günlük alışkanlık takibi** — kontrol listesi, hedef (günde kaç kez) ve
  seri (streak) sayacı
- **Hazır Challenge'lar** — 7 / 21 / 75 gün, ana ekranda öne çıkan kartlar
- **Özel Challenge** — kendi adını, süresini ve hedefini belirle
- **Gizli mazeret hakkı** — bir gün kaçırılırsa challenge affedilir ve kullanıcı
  uyarılır; ikinci kaçırmada challenge sıfırlanır
- **İstatistik** — haftalık/aylık tamamlanma, en uzun seri, son 7 gün grafiği
- **Takvim** — aylık ızgara, geçmiş günlere de giriş yapılabilir
- **16 tema** + 5 dil (Türkçe, İngilizce, Almanca, Arapça, Urduca) + RTL desteği
- **Büyük puntolu font ölçeği** (Normal / Büyük / Çok Büyük)

## GitHub'a yükleme sırası

1. Bu klasördeki tüm dosya ve klasörleri repo köküne yükle, klasör yapısını
   birebir koru (`src/`, `local-plugins/`, `.github/workflows/`).
2. **public/meccanen-logo.png** dosyasını ekle (1024×1024 PNG, şeffaf zemin) —
   workflow ikon üretimi için bu dosyayı arıyor, yoksa build hata verir.
3. (İsteğe bağlı, imzalı AAB için) `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`,
   `KEY_ALIAS`, `KEY_PASSWORD` secret'larını repo Settings → Secrets and
   variables → Actions altına ekle.
4. **Actions** sekmesinden workflow'u tetikle (`workflow_dispatch`) veya `main`
   dalına push yaparak otomatik build'i başlat.

> Reklam secret'ları (`ADMOB_*`) şu an **opsiyonel** — app'in `App.tsx`
> içindeki `CUSTOM_CHALLENGE_REWARD` / `SHOW_BANNER_ADS` bayrakları kapalı
> olduğu için reklam gösterilmez. İleride açmak istediğinde bayrakları `true`
> yapıp secret'ları eklemen yeterli.

## Bilinçli olarak henüz eklenmedi

- Play Console ürün ID'leri (`billingService.ts` içinde `SUPPORTER_PRODUCT_IDS`
  örnek ID'lerle dolu — yeni appId için Play Console'da ürünler oluşturulup
  buradan güncellenmeli)
- App ikonu / feature graphic
- Gizlilik politikası sayfası (TR/EN) — uygulama yerel çalıştığı için zorunlu
  değil ama Play Store isteyebilir# Active_Habit
# Active_Habit
