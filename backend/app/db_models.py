from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base


class User(Base):
    """SQLAlchemy User model for database"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    subscribed = Column(Integer, default=0, nullable=False)  # 1 = subscribed, 0 = not subscribed
    created_at = Column(DateTime, default=datetime.utcnow)
