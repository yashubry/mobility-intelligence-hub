# Team 5 Backend - FastAPI MongoDB Authentication

A FastAPI backend with MongoDB integration for user authentication (signup and login).

## Setup

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Update the values in `.env`:
     - `MONGODB_URL`: Your MongoDB connection string
     - `SECRET_KEY`: Generate a secure secret key
     - Other settings as needed

3. **Make sure MongoDB is running:**
   - Install MongoDB locally or use MongoDB Atlas
   - Default connection: `mongodb://localhost:27017`

## Running the Application

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Root
- **GET** `/` - API information and available endpoints

### Authentication
- **POST** `/auth/signup` - Register a new user
  - Body: `{"email": "user@example.com", "username": "username", "password": "password"}`
  
- **POST** `/auth/login` - Login and get access token
  - Body: `{"email": "user@example.com", "password": "password"}`
  - Returns: JWT access token

- **GET** `/auth/me` - Get current user profile (Protected)
  - Headers: `Authorization: Bearer <token>`
  - Returns: Current user's information

### Health Check
- **GET** `/health` - Check API health status

## Interactive API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Notes

- This is a basic authentication setup for development
- The SECRET_KEY should be changed in production
- CORS is currently set to allow all origins - restrict this in production
- MongoDB connection and database operations are handled asynchronously using Motor
