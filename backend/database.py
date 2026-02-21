from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

cloud_sql_connection_name = os.getenv("CLOUD_SQL_CONNECTION_NAME")
db_user = os.getenv("DB_USER", "trafficgen_user")
db_password = os.getenv("DB_PASSWORD", "")
db_name = os.getenv("DB_NAME", "trafficgen")
db_host = os.getenv("DB_HOST", "")
db_port = os.getenv("DB_PORT", "5432")

if db_host and db_user and db_password:
    print(f"Connecting using Direct TCP to {db_host}")
    SQLALCHEMY_DATABASE_URL = (
        f"postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    )
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=20,
        max_overflow=40,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True,
    )
elif cloud_sql_connection_name:
    print(f"Connecting using Cloud SQL Socket: {cloud_sql_connection_name}")
    if not db_password:
        print("WARNING: DB_PASSWORD is not set or is empty!")

    SQLALCHEMY_DATABASE_URL = (
        f"postgresql+psycopg2://{db_user}:{db_password}@/{db_name}"
        f"?host=/cloudsql/{cloud_sql_connection_name}&connect_timeout=10"
    )
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=20,
        max_overflow=40,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True,
    )
else:
    print("Connecting using SQLite Fallback")
    db_url = os.getenv("DATABASE_URL", "sqlite:///./traffic_nexus.db")
    connect_args = {}
    if "sqlite" in db_url:
        connect_args = {"check_same_thread": False}
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_size=20,
        max_overflow=40,
        pool_recycle=3600,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
