from fastapi import FastAPI  # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware  # pyright: ignore[reportMissingImports]
from app.routes import auth, payments
from app.database import engine, Base
from app.db_models import User

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Team 5 Authentication API",
    description="FastAPI backend with SQLite for user authentication",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(payments.router)


@app.get("/")
async def root():
    return {
        "message": "Team 5 Authentication API",
        "status": "running",
        "endpoints": {
            "signup": "/auth/signup",
            "login": "/auth/login",
            "profile": "/auth/me",
            "check_username": "/auth/check-username/{username}",
            "change_password": "/auth/change-password",
            "delete_account": "/auth/delete-account"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
