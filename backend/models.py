from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime

# ==========================================
# KULLANICI (USER) TABLOSU
# ==========================================
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    
    # Kullanıcının idmanları ve yemekleri
    workouts: List["Workout"] = Relationship(back_populates="user")
    foods: List["FoodEntry"] = Relationship(back_populates="user")

# ==========================================
# İDMAN (WORKOUT) TABLOLARI
# ==========================================
class Workout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id") # YENİ: İdmanın sahibi
    name: str
    date: datetime = Field(default_factory=datetime.now)
    duration_minutes: int = 0
    total_volume: float = 0.0
    
    user: Optional[User] = Relationship(back_populates="workouts")
    exercises: List["WorkoutExercise"] = Relationship(back_populates="workout")

class WorkoutExercise(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    workout_id: int = Field(foreign_key="workout.id")
    name: str
    
    workout: Workout = Relationship(back_populates="exercises")
    sets: List["ExerciseSet"] = Relationship(back_populates="exercise")

class ExerciseSet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exercise_id: int = Field(foreign_key="workoutexercise.id")
    set_number: int
    weight: float
    reps: int
    completed: bool = False
    
    exercise: WorkoutExercise = Relationship(back_populates="sets")

# ==========================================
# BESLENME (NUTRITION) TABLOSU
# ==========================================
class FoodEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id") # YENİ: Yemeğin sahibi
    food_name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    date: str
    
    user: Optional[User] = Relationship(back_populates="foods")