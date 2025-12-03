# SQL Branch - SQLite Implementation

This branch uses **SQLite** with **SQLAlchemy** instead of MongoDB.

## Changes from Main Branch

- **Database**: SQLite (file-based) instead of MongoDB
- **ORM**: SQLAlchemy for database operations
- **No async**: Synchronous database operations (simpler for SQLite)
- **Auto-initialization**: Database tables created automatically on server startup

## Setup

1. **Install dependencies**:
```bash
cd backend
pip install -r requirements.txt
```

2. **Create `.env` file** with:
```
SECRET_KEY=your-secret-key-here
```

3. **Run the server**:
```bash
uvicorn main:app --reload
```

The SQLite database file (`team5.db`) will be created automatically on first run.

## Database Location

The SQLite database is stored in: `backend/team5.db`

## Manual Database Initialization

If needed, you can manually initialize the database:
```bash
cd backend
python init_db.py
```

## Key Files Changed

- `requirements.txt` - Replaced `motor` and `pymongo` with `sqlalchemy`
- `app/database.py` - SQLAlchemy engine and session configuration
- `app/db_models.py` - SQLAlchemy User model (NEW)
- `app/config.py` - Removed MongoDB settings
- `app/dependencies.py` - Updated for SQLAlchemy queries
- `app/routes/auth.py` - Updated all routes for SQLAlchemy
- `main.py` - Auto-creates tables on startup

## Testing

Test the API at: http://localhost:8000/docs

All authentication endpoints remain the same:
- POST `/auth/signup`
- POST `/auth/login`
- GET `/auth/me`
- GET `/auth/check-username/{username}`
- PUT `/auth/change-password`
- DELETE `/auth/delete-account`
