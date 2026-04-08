from sqlmodel import Session, select, desc
import models
from datetime import datetime

class WorkoutRepository:
    @staticmethod
    def get_ghost_sets(session: Session, exercise_name: str):
        statement = (
            select(models.ExerciseSet)
            .join(models.WorkoutExercise)
            .where(models.WorkoutExercise.name == exercise_name)
            .order_by(desc(models.ExerciseSet.id))
            .limit(10)
        )
        results = session.exec(statement).all()
        return [f"{r.weight}kg x {r.reps}" for r in results]

    @staticmethod
    def save_workout_session(session: Session, data: dict):
        workout = models.Workout(
            name=data["name"],
            duration_minutes=int(data.get("duration", 0)),
            total_volume=float(data.get("totalVolume", 0))
        )
        session.add(workout)
        session.commit()
        session.refresh(workout)

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
        return workout.id

    @staticmethod
    def get_1rm_history(session: Session, exercise_name: str):
        statement = (
            select(models.ExerciseSet, models.Workout.date)
            .join(models.WorkoutExercise, models.ExerciseSet.exercise_id == models.WorkoutExercise.id)
            .join(models.Workout, models.WorkoutExercise.workout_id == models.Workout.id)
            .where(models.WorkoutExercise.name == exercise_name)
            .order_by(models.Workout.date)
        )
        
        results = session.exec(statement).all()
        history = {}
        
        for row in results:
            set_data, date_obj = row[0], row[1]
            date_str = date_obj.strftime("%d %b")
            
            if set_data.reps > 0 and set_data.weight > 0:
                rm = set_data.weight * (1 + set_data.reps / 30)
                if date_str not in history or rm > history[date_str]:
                    history[date_str] = round(rm, 1)
                    
        return [{"date": k, "oneRepMax": v} for k, v in history.items()]


class FoodRepository:
    @staticmethod
    def get_all(session: Session):
        # En yeni öğünler en üstte gelecek şekilde sıralı çekiyoruz
        return session.exec(select(models.FoodEntry).order_by(desc(models.FoodEntry.id))).all()

    @staticmethod
    def add_entry(session: Session, data: dict):
        new_food = models.FoodEntry(**data)
        session.add(new_food)
        session.commit()
        session.refresh(new_food)
        return new_food

    @staticmethod
    def delete_entry(session: Session, food_id: int):
        food = session.get(models.FoodEntry, food_id)
        if food:
            session.delete(food)
            session.commit()
            return True
        return False