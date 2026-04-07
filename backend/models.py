from typing import Optional
from sqlmodel import SQLModel, Field
import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, date as dt_date
from database import Base

# Kullanıcı Bilgileri
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str
    height: float # 1.83
    current_weight: float # 103-105 kg
    age: int

# Beslenme Girişleri (Yazio Tarzı)
class FoodEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    food_name: str # Örn: Tavuk Göğsü (Airfryer)
    calories: float
    protein: float
    carbs: float
    fat: float
    date: dt_date = Field(default_factory=dt_date.today)

# Spor Girişleri (Bodybuilding)
class ExerciseSet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exercise_name: str # Örn: RDL veya Bench Press
    weight: float
    reps: int
    rpe: Optional[int] = None # Zorluk seviyesi (1-10)
    date: dt_date = Field(default_factory=dt_date.today)

class Workout(Base):
    __tablename__ = "workouts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True) # Örn: "Push Day (Göğüs, Omuz, Arka Kol)"
    date = Column(DateTime, default=datetime.utcnow)
    duration_minutes = Column(Integer, nullable=True) # Örn: 75
    total_volume = Column(Float, default=0.0) # Toplam kaldırılan tonaj
    
    # Alt tablolara bağlantı (Bir antrenmanın birden fazla hareketi olur)
    exercises = relationship("WorkoutExercise", back_populates="workout", cascade="all, delete-orphan")  

class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"
    
    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"))
    name = Column(String, index=True) # Örn: "Barbell Bench Press"
    
    workout = relationship("Workout", back_populates="exercises")
    # Bu hareketin altındaki setlere bağlantı
    sets = relationship("ExerciseSet", back_populates="exercise", cascade="all, delete-orphan")

class ExerciseSet(Base):
    __tablename__ = "exercise_sets"
    
    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, ForeignKey("workout_exercises.id"))
    set_number = Column(Integer) # 1. Set, 2. Set vb.
    weight = Column(Float)       # 105.0 kg
    reps = Column(Integer)       # 8 tekrar
    completed = Column(Boolean, default=False)
    
    exercise = relationship("WorkoutExercise", back_populates="sets")