from typing import Optional
from sqlmodel import SQLModel, Field
import datetime

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
    date: datetime.date = Field(default_factory=datetime.date.today)

# Spor Girişleri (Bodybuilding)
class ExerciseSet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exercise_name: str # Örn: RDL veya Bench Press
    weight: float
    reps: int
    rpe: Optional[int] = None # Zorluk seviyesi (1-10)
    date: datetime.date = Field(default_factory=datetime.date.today)