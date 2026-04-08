from sqlmodel import Session, select, desc
import models
from datetime import datetime, timedelta

# ==========================================
# AUTH (KULLANICI) REPOSITORY
# ==========================================
class AuthRepository:
    @staticmethod
    def get_user_by_email(session: Session, email: str):
        return session.exec(select(models.User).where(models.User.email == email)).first()

    @staticmethod
    def get_user_by_username(session: Session, username: str):
        return session.exec(select(models.User).where(models.User.username == username)).first()

    @staticmethod
    def create_user(session: Session, user: models.User):
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

# ==========================================
# İDMAN (WORKOUT) REPOSITORY
# ==========================================
class WorkoutRepository:
    @staticmethod
    def get_ghost_sets(session: Session, exercise_name: str, user_id: int):
        statement = (
            select(models.ExerciseSet)
            .join(models.WorkoutExercise)
            .join(models.Workout)
            .where(models.WorkoutExercise.name == exercise_name)
            .where(models.Workout.user_id == user_id)
            .order_by(desc(models.ExerciseSet.id))
            .limit(10)
        )
        results = session.exec(statement).all()
        return [f"{r.weight}kg x {r.reps}" for r in results]

    @staticmethod
    def save_workout_session(session: Session, data: dict, user_id: int):
        workout = models.Workout(
            user_id=user_id,
            name=data["name"],
            duration_minutes=int(data.get("duration", 0)),
            total_volume=float(data.get("totalVolume", 0))
        )
        session.add(workout)
        session.commit()
        session.refresh(workout)

        for ex_data in data["exercises"]:
            if not ex_data.get("name"): continue
            exercise = models.WorkoutExercise(workout_id=workout.id, name=ex_data["name"])
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
    def get_1rm_history(session: Session, exercise_name: str, user_id: int):
        statement = (
            select(models.ExerciseSet, models.Workout.date)
            .join(models.WorkoutExercise, models.ExerciseSet.exercise_id == models.WorkoutExercise.id)
            .join(models.Workout, models.WorkoutExercise.workout_id == models.Workout.id)
            .where(models.WorkoutExercise.name == exercise_name)
            .where(models.Workout.user_id == user_id)
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

# ==========================================
# BESLENME (NUTRITION) REPOSITORY
# ==========================================
class FoodRepository:
    @staticmethod
    def get_all(session: Session, user_id: int):
        return session.exec(
            select(models.FoodEntry)
            .where(models.FoodEntry.user_id == user_id)
            .order_by(desc(models.FoodEntry.id))
        ).all()

    @staticmethod
    def add_entry(session: Session, data: dict, user_id: int):
        data["user_id"] = user_id 
        new_food = models.FoodEntry(**data)
        session.add(new_food)
        session.commit()
        session.refresh(new_food)
        return new_food

    @staticmethod
    def delete_entry(session: Session, food_id: int, user_id: int):
        food = session.get(models.FoodEntry, food_id)
        if food and food.user_id == user_id: 
            session.delete(food)
            session.commit()
            return True
        return False

# ==========================================
# RAPOR (REPORT) REPOSITORY
# ==========================================
class ReportRepository:
    @staticmethod
    def get_weekly_data(session: Session, user_id: int):
        seven_days_ago = datetime.now() - timedelta(days=7)
        seven_days_ago_str = seven_days_ago.strftime("%Y-%m-%d")

        foods = session.exec(select(models.FoodEntry).where(models.FoodEntry.user_id == user_id).where(models.FoodEntry.date >= seven_days_ago_str)).all()
        workouts = session.exec(select(models.Workout).where(models.Workout.user_id == user_id).where(models.Workout.date >= seven_days_ago)).all()

        statement = (
            select(models.ExerciseSet)
            .join(models.WorkoutExercise)
            .join(models.Workout)
            .where(models.Workout.user_id == user_id)
            .where(models.Workout.date >= seven_days_ago)
        )
        recent_sets = session.exec(statement).all()

        total_kcal = sum(f.calories for f in foods if f.calories > 0)
        total_protein = sum(f.protein for f in foods)
        
        avg_kcal = round(total_kcal / 7) if total_kcal > 0 else 0
        avg_protein = round(total_protein / 7) if total_protein > 0 else 0

        return {
            "workout_count": len(workouts),
            "total_sets": len(recent_sets),
            "avg_kcal": avg_kcal,
            "avg_protein": avg_protein,
        }