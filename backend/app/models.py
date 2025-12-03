from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    username: str
    subscribed: int = 0  # 1 = subscribed, 0 = not subscribed


class UserCreate(UserBase):
    password: str
    subscribed: int = 0  # Optional during signup, defaults to 0
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        errors = []
        if len(v) < 8:
            errors.append('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            errors.append('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            errors.append('Password must contain at least one uppercase letter')
        
        if errors:
            raise ValueError('; '.join(errors))
        return v


class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class UserResponse(UserBase):
    id: str
    subscribed: int
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v):
        errors = []
        if len(v) < 8:
            errors.append('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            errors.append('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            errors.append('Password must contain at least one uppercase letter')
        
        if errors:
            raise ValueError('; '.join(errors))
        return v
