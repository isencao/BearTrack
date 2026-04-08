from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime

class Workout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    date: datetime = Field(default_factory=datetime.now)
    duration_minutes: int = 0
    total_volume: float = 0.0
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

class FoodEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    food_name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    date: str