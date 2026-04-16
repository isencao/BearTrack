from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session
import os
import json
import secrets
import string
from groq import Groq
from dotenv import load_dotenv
from typing import List
from pydantic import BaseModel
from jose import JWTError, jwt
import models
import bear_auth
from database import create_db_and_tables, get_session
from repository import WorkoutRepository, FoodRepository, ReportRepository, AuthRepository
from fastapi import UploadFile, File, Form
from PIL import Image
import pytesseract
import io
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(title="BearTrack - Vanguard OS v5.0 (Secured)")

class AIRequest(BaseModel):
    description: str

class ProfileUpdate(BaseModel):
    weight: float
    height: float
    age: int
    goal: str
    activity_level: str
    target_calories: int
    target_protein: int
    target_carbs: int
    target_fat: int

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class ResetRequest(BaseModel):
    username: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

# --- YENİ EKLENEN: GOOGLE GİRİŞ MODELİ ---
class GoogleAuthRequest(BaseModel):
    token: str

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

@app.post("/api/auth/reset-demo")
def reset_password_email(request: ResetRequest, session: Session = Depends(get_session)):
    user = AuthRepository.get_user_by_username(session, request.username)
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    
    alphabet = string.ascii_letters + string.digits
    temp_password = ''.join(secrets.choice(alphabet) for i in range(8))
    
    hashed_pw = bear_auth.get_password_hash(temp_password)
    user.hashed_password = hashed_pw
    session.add(user)
    session.commit()
    
    sender_email = os.getenv("EMAIL_SENDER")
    sender_password = os.getenv("EMAIL_PASSWORD")
    receiver_email = user.email

    if not sender_email or not sender_password:
        return {
            "success": True, 
            "message": f"Sistem Uyarısı: Mail ayarları eksik! Gecici Sifreniz: {temp_password}"
        }

    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = "BearTrack - Şifre Sıfırlama Talebi"

        body = f"""
        Merhaba {user.username},
        
        BearTrack Vanguard OS hesabın için şifre sıfırlama talebi aldık.
        
        Yeni geçici şifren: {temp_password}
        
        Lütfen sisteme giriş yaptıktan sonra profil (Güvenlik) ayarlarından şifreni değiştirmeyi unutma.
        
        Güvenle kal,
        Bearguard Security Protocol
        """
        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()

        masked_email = f"{receiver_email[:2]}***@{receiver_email.split('@')[1]}"
        return {
            "success": True, 
            "message": f"SİSTEM ONAYI! YENİ ŞİFRENİZ {masked_email} ADRESİNE GÖNDERİLDİ."
        }

    except Exception as e:
        print(f"Mail Error: {e}")
        raise HTTPException(status_code=500, detail="Mail gönderilirken sunucu hatası oluştu.")

@app.post("/api/auth/change-password")
def change_password(
    request: ChangePasswordRequest, 
    session: Session = Depends(get_session), 
    current_user: models.User = Depends(get_current_user)
):
    if not bear_auth.verify_password(request.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mevcut şifreniz yanlış.")
    
    if request.old_password == request.new_password:
        raise HTTPException(status_code=400, detail="Yeni şifreniz eskisiyle aynı olamaz.")

    current_user.hashed_password = bear_auth.get_password_hash(request.new_password)
    session.add(current_user)
    session.commit()
    
    return {"status": "success", "message": "Şifreniz başarıyla güncellendi!"}

# --- YENİ EKLENEN: GOOGLE GİRİŞ UCU ---
@app.post("/api/auth/google")
def google_auth(request: GoogleAuthRequest, session: Session = Depends(get_session)):
    try:
        # 1. Google'dan gelen token'ı doğrula
        idinfo = id_token.verify_oauth2_token(
            request.token, 
            google_requests.Request(), 
            os.getenv("GOOGLE_CLIENT_ID")
        )
        
        email = idinfo['email']
        # Google'dan gelen ismi al, ad/soyad yoksa mailin başını kullan
        name = idinfo.get('given_name', email.split('@')[0])
        # Sistemimiz boşluksuz ve küçük harf seviyor:
        username = name.replace(" ", "").lower()
        
        # 2. Bu maille daha önce kayıt olunmuş mu?
        user = AuthRepository.get_user_by_email(session, email)
        
        if not user:
            # 3. Kullanıcı yoksa YENİ KAYIT oluştur
            random_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
            hashed_pw = bear_auth.get_password_hash(random_password)
            
            # Eğer bu username'den başka biri varsa sonuna rastgele sayı ekle
            existing_user = AuthRepository.get_user_by_username(session, username)
            if existing_user:
                username = f"{username}_{secrets.choice(string.digits)}{secrets.choice(string.digits)}"
            
            user = models.User(
                username=username,
                email=email,
                hashed_password=hashed_pw
            )
            AuthRepository.create_user(session, user)
        
        # 4. Her şey tamamsa, BearTrack'in kendi anahtarını ver ve içeri al!
        access_token = bear_auth.create_access_token(data={"sub": user.username}) 
        return {"access_token": access_token, "token_type": "bearer"}

    except ValueError:
        raise HTTPException(status_code=400, detail="Google doğrulaması başarısız.")
# --------------------------------------

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
        return {"data": data, "ai_comment": "Bearguard AI Çevrimdışı. Ama bahanelere yer yok!"}
    
@app.post("/api/profile")
def update_profile(data: ProfileUpdate, session: Session = Depends(get_session), current_user: models.User = Depends(get_current_user)):
    current_user.weight = data.weight
    current_user.height = data.height
    current_user.age = data.age
    current_user.goal = data.goal
    current_user.activity_level = data.activity_level
    current_user.target_calories = data.target_calories
    current_user.target_protein = data.target_protein
    current_user.target_carbs = data.target_carbs
    current_user.target_fat = data.target_fat
    
    session.add(current_user)
    session.commit()
    return {"status": "success", "message": "Kalibrasyon Bearguard Veritabanına işlendi."}

@app.get("/api/profile")
def get_profile(current_user: models.User = Depends(get_current_user)):
    return current_user

