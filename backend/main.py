from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, desc
import os
import json
from groq import Groq
from dotenv import load_dotenv
from typing import List
from database import create_db_and_tables, get_session
import models  # models.py dosyanın doğru yapılandırıldığından emin ol
from pydantic import BaseModel

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(title="BearTrack - Vanguard OS v4.0")

class AIRequest(BaseModel):
    description: str

# CORS AYARLARI (Frontend'in bağlanabilmesi için şart)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    # Veritabanı tablolarını oluşturur
    create_db_and_tables()
    print("[VANGUARD] Sistem Online! Operatör: Ahmet Furkan")

@app.get("/")
def read_root():
    return {"status": "Vanguard Online", "system": "BEAR OS"}

# --- BESLENME KATMANI ---

@app.get("/api/food/")
def get_all_foods(session: Session = Depends(get_session)):
    return session.exec(select(models.FoodEntry)).all()

@app.post("/api/food/")
def add_food_entry(data: dict, session: Session = Depends(get_session)):
    try:
        new_food = models.FoodEntry(**data)
        session.add(new_food)
        session.commit()
        session.refresh(new_food)
        return new_food
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Kayıt hatası: {str(e)}")

@app.delete("/api/food/{food_id}")
def delete_food_entry(food_id: int, session: Session = Depends(get_session)):
    food = session.get(models.FoodEntry, food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Öğün bulunamadı.")
    session.delete(food)
    session.commit()
    return {"status": "deleted"}

@app.post("/api/food/ai-analyze")
def analyze_food(req: AIRequest):
    prompt = f"""
    Kullanıcının girdiği şu öğünü analiz et: "{req.description}"
    JSON formatında döndür: 
    {{
        "food_name": "Özet İsim",
        "calories": toplam_kcal,
        "protein": g,
        "carbs": g,
        "fat": g,
        "calculation_logic": "mantık açıklaması"
    }}
    """
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail="AI Analiz hatası.")

# --- ANTRENMAN KATMANI (GHOST NUMBERS & SESSION SAVE) ---

@app.get("/api/workout/ghost/{name}")
def get_ghost_data(name: str, session: Session = Depends(get_session)):
    """Frontend'deki 'Geçmiş' (Ghost) sütunu için verileri getirir."""
    # Bu harekete ait en son girilen setleri bulur
    statement = (
        select(models.ExerciseSet)
        .join(models.WorkoutExercise)
        .where(models.WorkoutExercise.name == name)
        .order_by(desc(models.ExerciseSet.id))
        .limit(10)
    )
    results = session.exec(statement).all()
    
    if not results:
        return {"ghost_sets": []}
    
    # "100kg x 8" formatında listeler
    ghost_list = [f"{r.weight}kg x {r.reps}" for r in results]
    return {"ghost_sets": ghost_list}

@app.post("/api/workout/save-session")
def save_workout_session(data: dict, session: Session = Depends(get_session)):
    """İdmanı, hareketleri ve tüm setleri tek seferde kaydeder."""
    try:
        # 1. Antrenman Başlığını Oluştur
        workout = models.Workout(
            name=data["name"],
            duration_minutes=int(data.get("duration", 0)),
            total_volume=float(data.get("totalVolume", 0))
        )
        session.add(workout)
        session.commit()
        session.refresh(workout)

        # 2. Hareketleri ve Setleri İç İçe Kaydet
        for ex_data in data["exercises"]:
            if not ex_data.get("name"): continue
            
            exercise = models.WorkoutExercise(
                workout_id=workout.id,
                name=ex_data["name"]
            )
            session.add(exercise)
            session.commit()
            session.refresh(exercise)

            for set_data in ex_data["sets"]:
                # Sadece ağırlık veya tekrar girilmişse kaydet
                if set_data.get("weight") or set_data.get("reps"):
                    new_set = models.ExerciseSet(
                        exercise_id=exercise.id,
                        set_number=int(set_data.get("setNo", 1)),
                        weight=float(set_data.get("weight") or 0),
                        reps=int(set_data.get("reps") or 0),
                        completed=True
                    )
                    session.add(new_set)
        
        session.commit()
        return {"status": "success", "workout_id": workout.id}
    except Exception as e:
        session.rollback()
        print(f"[ERROR] Kayıt Başarısız: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))