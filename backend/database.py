from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, Session 
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, echo=True)


Base = declarative_base()

def create_db_and_tables():
   
    SQLModel.metadata.create_all(engine)

    Base.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session