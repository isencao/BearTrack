from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session
import os
import json
from groq import Groq
from dotenv import load_dotenv
from typing import List
from pydantic import BaseModel
from jose import JWTError, jwt
import models
import bear_auth
from database import create_db_and_tables, get_session
from repository import WorkoutRepository, FoodRepository, ReportRepository, AuthRepository

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(title="BearTrack - Vanguard OS v5.0 (Secured)")

class AIRequest(BaseModel):
    description: str

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz kimlik bilgileri veya oturum süresi dolmuş.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, bear_auth.SECRET_KEY, algorithms=[bear_auth.ALGORITHM]) 
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = AuthRepository.get_user_by_username(session, username=username)
    if user is None:
        raise credentials_exception
    return user

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    print("[BEARGUARD] Sistem Online! Multi-tenant Güvenlik Aktif.")

@app.get("/")
def read_root():
    return {"status": "Bearguard Secured", "system": "BEAR OS"}

@app.post("/register")
def register_user(user_data: UserRegister, session: Session = Depends(get_session)):
    db_user = AuthRepository.get_user_by_username(session, user_data.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış.")
    
    db_email = AuthRepository.get_user_by_email(session, user_data.email)
    if db_email:
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kayıtlı.")

    # bear_auth çağrılıyor
    hashed_pw = bear_auth.get_password_hash(user_data.password) 
    
    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pw
    )
    AuthRepository.create_user(session, new_user)
    return {"message": "Kayıt başarılı. Bearguard'a hoş geldin!"}

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = AuthRepository.get_user_by_username(session, form_data.username)
    
    if not user or not bear_auth.verify_password(form_data.password, user.hashed_password): 
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yanlış kullanıcı adı veya şifre.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = bear_auth.create_access_token(data={"sub": user.username}) 
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/food/")
def get_all_foods(session: Session = Depends(get_session), current_user: models.User = Depends(get_current_user)):
    return FoodRepository.get_all(session, current_user.id)

@app.post("/api/food/")
def add_food_entry(data: dict, session: Session = Depends(get_session), current_user: models.User = Depends(get_current_user)):
    try:
        return FoodRepository.add_entry(session, data, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Kayıt hatası: {str(e)}")

@app.delete("/api/food/{food_id}")
def delete_food_entry(food_id: int, session: Session = Depends(get_session), current_user: models.User = Depends(get_current_user)):
    success = FoodRepository.delete_entry(session, food_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Öğün bulunamadı veya silme yetkiniz yok.")
    return {"status": "deleted"}

@app.post("/api/food/ai-analyze")
def analyze_food(req: AIRequest, current_user: models.User = Depends(get_current_user)):
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
        res["calories"] = int((res["protein"] * 4) + (res["carbs"] * 4) + (res["fat"] * 9))
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail="AI Analiz hatası.")

@app.get("/api/workout/ghost/{name}")
def get_ghost_data(name: str, session: Session = Depends(get_session), current_user: models.User = Depends(get_current_user)):
    return {"ghost_sets": WorkoutRepository.get_ghost_sets(session, name, current_user.id)}

@app.post("/api/workout/save-session")
def save_workout_session(data: dict, session: Session = Depends(get_session), current_user: models.User = Depends(get_current_user)):
    try:
        workout_id = WorkoutRepository.save_workout_session(session, data, current_user.id)
        return {"status": "success", "workout_id": workout_id}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/workout/analytics/1rm/{name}")
def get_1rm_history(name: str, session: Session = Depends(get_session), current_user: models.User = Depends(get_current_user)):
    return WorkoutRepository.get_1rm_history(session, name, current_user.id)

@app.get("/api/report/weekly")
def get_weekly_report(session: Session = Depends(get_session), current_user: models.User = Depends(get_current_user)):
    data = ReportRepository.get_weekly_data(session, current_user.id)

    prompt = f"""
    Sen Bearguard adında, hardcore bir vücut geliştirme (bodybuilding) koçusun.
    Kullanıcın {current_user.username.upper()}'ın son 7 günlük hipertrofi ve beslenme performansı:
    - Antrenman Gün Sayısı: {data['workout_count']} gün
    - Haftalık Toplam Çalışma Seti: {data['total_sets']} set
    - Ortalama Günlük Enerji: {data['avg_kcal']} kcal
    - Ortalama Günlük Protein: {data['avg_protein']} g

    Bu verilere bakarak {current_user.username}'a bodybuilding odaklı, sert ve net bir değerlendirme yap. 
    Eğer haftalık toplam set sayısı düşükse (örneğin 40-50'nin altıysa) hacmi artırmasını emret.
    Ortalama günlük protein 150g'ın altındaysa kas yıkımı uyarısı yap.
    Askeri ve motive edici bir dil kullan. Asla 4 cümleyi geçme.
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
        )
        ai_comment = chat_completion.choices[0].message.content
        return {"data": data, "ai_comment": ai_comment, "username": current_user.username}
    except Exception as e:
        return {"data": data, "ai_comment": "Bearguard AI Çevrimdışı. Ama bahanelere yer yok, setleri doldur!"}