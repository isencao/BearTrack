# Python 3.11 tabanlı hafif bir imaj kullanıyoruz
FROM python:3.11-slim

# Sistem paketlerini kuruyoruz (Paket isimleri Debian Trixie ile uyumlu hale getirildi)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-tur \
    libgl1 \
    libglib2.0-0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Çalışma dizinini belirliyoruz
WORKDIR /app

# Gerekli dosyaları kopyalıyoruz
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tüm proje dosyalarını kopyalıyoruz
COPY . .

# Render'ın verdiği portu kullanması için komut
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]