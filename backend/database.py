from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, Session 

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres"

engine = create_engine(DATABASE_URL, echo=True)


Base = declarative_base()

def create_db_and_tables():
   
    SQLModel.metadata.create_all(engine)

    Base.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session