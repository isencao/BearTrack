# models.py
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
import datetime

class FoodEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    food_name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    date: datetime.date = Field(default_factory=datetime.date.today)

class Workout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    date: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    duration_minutes: Optional[int] = None
    total_volume: float = 0.0
    exercises: List["WorkoutExercise"] = Relationship(back_populates="workout")

class WorkoutExercise(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    workout_id: int = Field(foreign_key="workout.id")
    name: str
    workout: Optional[Workout] = Relationship(back_populates="exercises")
    sets: List["ExerciseSet"] = Relationship(back_populates="exercise")

class ExerciseSet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exercise_id: int = Field(foreign_key="workoutexercise.id")
    set_number: int
    weight: float
    reps: int
    completed: bool = False
    exercise: Optional[WorkoutExercise] = Relationship(back_populates="sets")