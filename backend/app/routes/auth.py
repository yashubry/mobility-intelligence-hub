from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.models import UserCreate, UserResponse, Token, PasswordChange, LoginRequest
from app.database import get_db
from app.db_models import User
from app.utils import get_password_hash, verify_password, create_access_token
from app.dependencies import get_current_user_response, get_current_user
from datetime import timedelta, datetime
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/check-username/{username}")
def check_username_availability(username: str, db: Session = Depends(get_db)):
    """
    Check if a username is available.
    Returns available: true/false
    """
    existing_username = db.query(User).filter(User.username == username).first()
    return {
        "username": username,
        "available": existing_username is None
    }


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = db.query(User).filter(User.username == user.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Hash the password
    hashed_password = get_password_hash(user.password)
    
    # Create new user
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        subscribed=user.subscribed,  # User can choose subscription during signup
        created_at=datetime.utcnow()
    )
    
    # Add to database
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Return user response
    return UserResponse(
        id=str(db_user.id),
        email=db_user.email,
        username=db_user.username,
        subscribed=db_user.subscribed,
        created_at=db_user.created_at
    )


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Login and get access token.
    """
    # Find user by email
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_user_profile(current_user: UserResponse = Depends(get_current_user_response)):
    """
    Get current authenticated user's profile.
    Requires a valid JWT token in the Authorization header.
    """
    return current_user


@router.put("/change-password")
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change the current user's password.
    Requires valid current password and new password that meets strength requirements.
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Check if new password is different from current
    if verify_password(password_data.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Hash new password
    new_hashed_password = get_password_hash(password_data.new_password)
    
    # Update password in database
    current_user.hashed_password = new_hashed_password
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.delete("/delete-account")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete the current user's account permanently.
    This action cannot be undone.
    """
    # Delete user from database
    db.delete(current_user)
    db.commit()
    
    return {"message": "Account deleted successfully"}
