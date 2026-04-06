from sqlmodel import create_engine, Session, SQLModel

# Docker'da çalıştırdığımız PostgreSQL'in adresi
# postgres: kullanıcı adı, alpha123: şifre, localhost: senin bilgisayarın
DATABASE_URL = "postgresql://postgres:bear123@localhost:5432/postgres"

# Engine: Veritabanına emirleri gönderen motor
# echo=True: Terminalde arka planda dönen SQL sorgularını görmeni sağlar (Hata ayıklarken hayat kurtarır)
engine = create_engine(DATABASE_URL, echo=True)

# Tabloları oluşturacak fonksiyon
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Veritabanı ile her işlem yapacağımızda bu session'ı (oturum) kullanacağız
def get_session():
    with Session(engine) as session:
        yield session