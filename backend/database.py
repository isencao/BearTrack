from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, Session 

DATABASE_URL = "postgresql://postgres:bear123@localhost:5432/postgres"

engine = create_engine(DATABASE_URL, echo=True)


Base = declarative_base()

def create_db_and_tables():
   
    SQLModel.metadata.create_all(engine)

    Base.metadata.create_all(engine)

# Veritabanı ile her işlem yapacağımızda bu session'ı (oturum) kullanacağız
def get_session():
    with Session(engine) as session:
        yield session