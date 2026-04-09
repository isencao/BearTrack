# 🐻 BearGuard OS (BearTrack & BearIron)

Yapay Zeka (LLaMA) destekli, full-stack fitness, beslenme ve antrenman takip sistemi. Kullanıcıların günlük makro hedeflerini, su tüketimlerini ve antrenman performanslarını dinamik bir arayüzle yönetmelerini sağlayan kapsamlı bir SaaS (Software as a Service) projesidir.

🚀 **Canlı Demo:** [bear-track.vercel.app](https://bear-track.vercel.app)

---

## 🛠️ Mimari & Teknoloji Yığını (Tech Stack)

Bu proje, modern web standartlarına uygun, modüler ve ölçeklenebilir bir mikroservis mimarisi ile inşa edilmiştir.

### Frontend (İstemci - Client)
* **Framework:** Next.js (React)
* **Dil:** TypeScript
* **Stil:** Tailwind CSS (Modern, cam efektli karanlık tema)
* **Yayınlama (Deployment):** Vercel

### Backend (Sunucu - API)
* **Framework:** FastAPI (Python)
* **Yapay Zeka Entegrasyonu:** Groq API (LLaMA 3 - Doğal dil işleme ile besin analizi)
* **Güvenlik:** JWT (JSON Web Token) tabanlı kimlik doğrulama, CORS yönetimi
* **Yayınlama (Deployment):** Render

### Veritabanı
* **Altyapı:** PostgreSQL (Neon.tech Serverless Cloud)
* **ORM:** SQLAlchemy

---

## ✨ Temel Özellikler

* 🧠 **Yapay Zeka Destekli Besin Analizi (Bear AI):** Kullanıcı "200 gram tavuk göğsü yedim" yazdığında, sistem LLaMA modelini kullanarak bunu parse eder, kalori ve makro değerlerini otomatik hesaplayıp veritabanına işler.
* 📊 **Dinamik Kalibrasyon & Dashboard:** Kullanıcının boy, kilo, yaş ve aktivite seviyesine göre BMR ve TDEE (Günlük Kalori İhtiyacı) değerlerini hesaplar. Hedefe (Bulk/Definasyon) göre makro hedeflerini anlık günceller.
* 💧 **Hidrasyon Takibi:** Günlük su tüketimini görsel animasyonlarla takip etme imkanı.
* 🏋️ **Antrenman Yönetimi (BearIron):** Dinamik setler, tekrar ve ağırlık takibi.
* 📈 **Haftalık Askeri Rapor:** Haftalık ortalama kalori, makro ve antrenman verilerini baz alarak AI tarafından üretilen motivasyonel durum raporu.

---

## 💻 Kurulum (Local Development)

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyebilirsiniz.

### 1. Repoyu Klonlayın
```bash
git clone [https://github.com/isencao/BearTrack.git](https://github.com/isencao/BearTrack.git)
cd BearTrack
```

### 2. Backend Kurulumu
```bash
cd backend
python -m venv venv
# Windows için: venv\Scripts\activate
# macOS/Linux için: source venv/bin/activate
pip install -r requirements.txt
```
Backend dizininde bir .env dosyası oluşturun ve gerekli ortam değişkenlerini (DATABASE_URL, SECRET_KEY, GROQ_API_KEY) ekleyin. Ardından sunucuyu başlatın:
```
uvicorn main:app --reload
```

### 3. Frontend Kurulumu
```bash
cd ../frontend
npm install
npm run dev
```














