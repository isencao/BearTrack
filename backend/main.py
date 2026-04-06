from fastapi import FastAPI
from database import create_db_and_tables
import models 
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select
from database import create_db_and_tables, get_session
from models import User, FoodEntry, ExerciseSet
from fastapi.middleware.cors import CORSMiddleware
import os
from groq import Groq
from dotenv import load_dotenv
import json

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(
    title="BearTrack - Vanguard OS",
    description="Spor ve Beslenme Takip Sistemi",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uygulama başladığında çalışacak olan 'Startup' fonksiyonu
@app.on_event("startup")
def on_startup():
    # Bu komut database.py'daki engine'i kullanarak tabloları oluşturur
    print("Sistem Başlatılıyor: Veritabanı tabloları kontrol ediliyor...")
    create_db_and_tables()
    print("Sistem Hazır: Tablolar oluşturuldu/doğrulandı.")

@app.get("/")
def read_root():
    return {
        "mesaj": "BearTrack Sistemi Aktif!",
        "durum": "Vanguard Online",
        "ada": "Ahmet Furkan"
    }

# Yazio tarzı beslenme özeti için ilk taslak endpoint
@app.get("/summary")
def get_daily_summary():
    return {
        "hedef_kalori": 2500,
        "alinan_kalori": 0,
        "kalan_kalori": 2500,
        "protein_g": 0,
        "karbonhidrat_g": 0,
        "yag_g": 0
    }

@app.post("/api/food/", response_model=FoodEntry, tags=["Beslenme Katmanı"])
def add_food_entry(food: FoodEntry, session: Session = Depends(get_session)):
    """
    Airfryer tavuk veya yulaf ezmesi gibi öğünleri veritabanına kaydeder.
    """
    session.add(food)
    session.commit() # Veriyi kalıcı olarak kaydet
    session.refresh(food) # Veritabanındaki ID'si ile birlikte geri getir
    return food

@app.get("/api/food/", response_model=list[FoodEntry], tags=["Beslenme Katmanı"])
def get_all_foods(session: Session = Depends(get_session)):
    """
    Bugüne kadar girilmiş tüm öğünleri listeler.
    """
    foods = session.exec(select(FoodEntry)).all()
    return foods

# -----------------------------------------
# SPOR (BODYBUILDING MODÜLÜ) UÇ NOKTALARI
# -----------------------------------------

@app.post("/api/workout/", response_model=ExerciseSet, tags=["Antrenman Katmanı"])
def add_workout_set(workout: ExerciseSet, session: Session = Depends(get_session)):
    """
    Bench Press, RDL gibi idman setlerini ve RPE (zorluk) seviyelerini kaydeder.
    """
    session.add(workout)
    session.commit()
    session.refresh(workout)
    return workout

@app.post("/api/food/ai-analyze")
def analyze_food(description: str):
    prompt = f"""
    Sen bir Türk beslenme uzmanı ve matematik profesörüsün. "{description}" öğününü analiz et.
    
    HESAPLAMA ADIMLARI (ZORUNLU):
    1. Önce yiyeceğin 100 gram çiğ/pişmiş (kullanıcı hangisini dediyse) değerlerini hatırla.
    2. Kullanıcının girdiği miktarı (Örn: 500g) belirle.
    3. (100g değeri / 100) * miktar formülünü uygula.
    4. KESİNLİKLE porsiyon veya 100g verisini direkt döndürme, kullanıcı 500g diyorsa 5 katını hesapla!

    JSON FORMATI:
    {{
        "food_name": "Miktarı içeren isim (Örn: 500g Airfryer Tavuk)",
        "calories": toplam_kalori_sayi,
        "protein": toplam_protein_sayi,
        "carbs": toplam_karbo_sayi,
        "fat": toplam_yag_sayi,
        "calculation_logic": "Buraya hesaplamayı nasıl yaptığını kısaca yaz (Örn: 100g tavukta 23p vardı, 500g olduğu için 5 ile çarptım 115p buldum)"
    }}
    """
    
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile", 
        response_format={"type": "json_object"},
        temperature=0.0 
    )
    
    
    result = json.loads(chat_completion.choices[0].message.content)
    
    print(f"AI HESAP MANTIĞI: {result.get('calculation_logic')}")
    return result

@app.delete("/api/food/{food_id}", tags=["Beslenme Katmanı"])
def delete_food_entry(food_id: int, session: Session = Depends(get_session)):
    """
    Girilen bir öğünü veritabanından kalıcı olarak siler.
    """
    food = session.get(FoodEntry, food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Öğün bulunamadı")
    
    session.delete(food)
    session.commit()
    return {"mesaj": "Öğün başarıyla silindi"}
    
    
   
