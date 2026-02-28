from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

APP_DATABASE_URL = os.getenv("APP_DATABASE_URL", "sqlite:///./users.db")
# If using PostgreSQL later:
# APP_DATABASE_URL = "postgresql://user:password@postgresserver/db"

engine = create_engine(
    APP_DATABASE_URL,
    connect_args={"check_same_thread": False} # Needed only for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
