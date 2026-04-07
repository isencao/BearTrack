from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
import os
import json
from groq import Groq
from dotenv import load_dotenv
from typing import List
from database import create_db_and_tables, get_session
import models
from models import FoodEntry, ExerciseSet, User, Workout, WorkoutExercise
from pydantic import BaseModel

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(title="BearTrack - Vanguard OS v3.6")

class AIRequest(BaseModel):
    description: str
# 1. ADIM: CORS'U FULL AÇ (Tarayıcı engellini kaldırır)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Her yerden gelen isteğe izin ver
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    print("\n[VANGUARD] Veritabanı tabloları kontrol ediliyor...")
    create_db_and_tables()
    print("[VANGUARD] Sistem Online!\n")

@app.get("/")
def read_root():
    return {"status": "Vanguard Online", "operator": "Ahmet Furkan"}

# ---------------------------------------------------------
# BESLENME KATMANI (KURŞUN GEÇİRMEZ VERSİYON)
# ---------------------------------------------------------

@app.post("/api/food/")
def add_food_entry(data: dict, session: Session = Depends(get_session)):
    print(f"\n[RECEIVE] Beslenme Verisi Geldi: {data}") # Log ekledik!
    try:
        new_food = FoodEntry(**data)
        session.add(new_food)
        session.commit()
        session.refresh(new_food)
        print(f"[SUCCESS] Öğün kaydedildi: ID {new_food.id}")
        return new_food
    except Exception as e:
        print(f"[ERROR] Kayıt hatası: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/food/")
def get_all_foods(session: Session = Depends(get_session)):
    print("[FETCH] Tüm öğünler listeleniyor...")
    return session.exec(select(FoodEntry)).all()

@app.delete("/api/food/{food_id}")
def delete_food_entry(food_id: int, session: Session = Depends(get_session)):
    print(f"[DELETE] Siliniyor: ID {food_id}")
    food = session.get(FoodEntry, food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Bulunamadı")
    session.delete(food)
    session.commit()
    return {"status": "deleted"}

@app.post("/api/food/ai-analyze", tags=["AI Katmanı"])
def analyze_food(req: AIRequest):
    description = req.description # Veriyi güvenli kutudan (body) çıkarıyoruz
    print(f"[AI] Analiz isteği: {description}")
    

    prompt = f"""
    Sen bir Türk beslenme uzmanı ve veri analizcisisin. Kullanıcının girdiği şu öğünü analiz et: "{description}"
    
    ÇOK ÖNEMLİ KURALLAR: 
    1. Kullanıcı birden fazla yiyecek girdiyse Hepsini toplayarak SADECE TEK BİR JSON OBJESİ döndür. Liste döndürme!
    2. Gram/ölçü belirtilmediyse standart porsiyon kullan (Örn: 1 ölçek protein tozu = 30g toz, ~24g protein).
    3. MATEMATİK SAĞLAMASI ZORUNLUDUR: Toplam kalori, makroların formülüne uymak zorundadır!
       Formül: (protein * 4) + (carbs * 4) + (fat * 9) = Toplam Kalori
       Önce makroları bul, sonra bu formülle kaloriyi ÇARPARAK hesapla. Asla kafadan kalori uydurma!
    
    JSON FORMATI:
    {{
        "food_name": "Kısa Özet (Örn: Protein Tozu & Pirinç Unu)",
        "calories": hesaplanan_toplam_kalori_sayi,
        "protein": toplam_protein_sayi,
        "carbs": toplam_karbo_sayi,
        "fat": toplam_yag_sayi,
        "calculation_logic": "Matematik formülünü göster (Örn: 24p*4 + 30c*4 + 3y*9 = 243 kcal)"
    }}
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile", 
            response_format={"type": "json_object"},
            temperature=0.0 
        )
        
        result = json.loads(chat_completion.choices[0].message.content)
        print(f"[AI SUCCESS] Hesap Mantığı: {result.get('calculation_logic')}")
        return result
    except Exception as e:
        print(f"[AI ERROR] {str(e)}")
        raise HTTPException(status_code=400, detail="AI bu öğünü anlayamadı.")

# ---------------------------------------------------------
# ANTRENMAN KATMANI (KURŞUN GEÇİRMEZ VERSİYON)
# ---------------------------------------------------------

@app.post("/api/workout/")
def add_workout_set(data: dict, session: Session = Depends(get_session)):
    print(f"\n[RECEIVE] Antrenman Verisi Geldi: {data}")
    try:
        new_set = ExerciseSet(**data)
        session.add(new_set)
        session.commit()
        session.refresh(new_set)
        print(f"[SUCCESS] Set kaydedildi: ID {new_set.id}")
        return new_set
    except Exception as e:
        print(f"[ERROR] Antrenman kayıt hatası: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/workout/")
def get_all_sets(session: Session = Depends(get_session)):
    return session.exec(select(ExerciseSet)).all()

@app.post("/api/workout/save-session", tags=["Antrenman Katmanı"])
def save_workout_session(data: dict, session: Session = Depends(get_session)):
    """
    Tüm antrenmanı, hareketleri ve setleri hiyerarşik olarak tek seferde kaydeder.
    """
    try:
        # 1. Antrenman Oturumunu Oluştur
        workout = models.Workout(
            name=data["name"],
            duration_minutes=int(data.get("duration", 0)),
            total_volume=float(data.get("totalVolume", 0))
        )
        session.add(workout)
        session.commit()
        session.refresh(workout)

        # 2. Hareketleri ve Setleri Döngüyle Kaydet
        for ex_data in data["exercises"]:
            exercise = models.WorkoutExercise(
                workout_id=workout.id,
                name=ex_data["name"]
            )
            session.add(exercise)
            session.commit()
            session.refresh(exercise)

            for set_data in ex_data["sets"]:
                # Sadece tamamlanmış veya veri girilmiş setleri kaydedelim
                if set_data.get("weight") or set_data.get("reps"):
                    new_set = models.ExerciseSet(
                        exercise_id=exercise.id,
                        set_number=set_data["setNo"],
                        weight=float(set_data["weight"] or 0),
                        reps=int(set_data["reps"] or 0),
                        completed=set_data.get("completed", False)
                    )
                    session.add(new_set)
        
        session.commit()
        return {"status": "success", "workout_id": workout.id}
    except Exception as e:
        session.rollback()
        print(f"SAVE ERROR: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))