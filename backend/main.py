from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
import os
import json
from groq import Groq
from dotenv import load_dotenv
from typing import List
from pydantic import BaseModel

# Yerel importlar
from database import create_db_and_tables, get_session
from repository import WorkoutRepository, FoodRepository 

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(title="BearTrack - Vanguard OS v4.2")

class AIRequest(BaseModel):
    description: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    print("[VANGUARD] Sistem Online! Operatör: Ahmet Furkan")

@app.get("/")
def read_root():
    return {"status": "Vanguard Online", "system": "BEAR OS", "architecture": "Clean"}

# --- BESLENME (NUTRITION) ENDPOINTLERİ ---

@app.get("/api/food/")
def get_all_foods(session: Session = Depends(get_session)):
    return FoodRepository.get_all(session)

@app.post("/api/food/")
def add_food_entry(data: dict, session: Session = Depends(get_session)):
    try:
        return FoodRepository.add_entry(session, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Kayıt hatası: {str(e)}")

@app.delete("/api/food/{food_id}")
def delete_food_entry(food_id: int, session: Session = Depends(get_session)):
    success = FoodRepository.delete_entry(session, food_id)
    if not success:
        raise HTTPException(status_code=404, detail="Öğün bulunamadı.")
    return {"status": "deleted"}

@app.post("/api/food/ai-analyze")
def analyze_food(req: AIRequest):
    prompt = f"""
    Sen profesyonel bir diyetisyen ve besin analizi uzmanısın. 
    Kullanıcının girdiği şu öğünü analiz et: "{req.description}"

    KURALLAR:
    1. Marka varsa standart porsiyon değerlerini kullan.
    2. JSON formatında döndür: 
    {{
        "food_name": "Özet İsim",
        "calories": kcal_degeri,
        "protein": g,
        "carbs": g,
        "fat": g
    }}
    """
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        res = json.loads(chat_completion.choices[0].message.content)
        # Sağlamlama
        res["calories"] = int((res["protein"] * 4) + (res["carbs"] * 4) + (res["fat"] * 9))
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail="AI Analiz hatası.")

# --- ANTRENMAN (WORKOUT) ENDPOINTLERİ ---

@app.get("/api/workout/ghost/{name}")
def get_ghost_data(name: str, session: Session = Depends(get_session)):
    return {"ghost_sets": WorkoutRepository.get_ghost_sets(session, name)}

@app.post("/api/workout/save-session")
def save_workout_session(data: dict, session: Session = Depends(get_session)):
    try:
        workout_id = WorkoutRepository.save_workout_session(session, data)
        return {"status": "success", "workout_id": workout_id}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/workout/analytics/1rm/{name}")
def get_1rm_history(name: str, session: Session = Depends(get_session)):
    return WorkoutRepository.get_1rm_history(session, name)