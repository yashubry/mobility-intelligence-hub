# CareerRise Economic Mobility Dashboard

## Mission

CareerRise advances economic mobility and workforce development across the Atlanta region by connecting individuals to meaningful employment opportunities and supporting local employers. This dashboard empowers CareerRise to track and analyze key economic mobility metrics—such as income growth, employment rates, educational attainment, and workforce resource access—enabling data-driven decisions about where targeted programming can have the greatest impact.

---

## Project Structure

Full-stack web application with a **FastAPI backend** and **React frontend**.

```
Team-5/
├── backend/              # FastAPI + MongoDB
│   ├── app/
│   │   ├── routes/       # API endpoints (auth)
│   │   ├── models.py     # Data models
│   │   ├── database.py   # MongoDB connection
│   │   └── utils.py      # Auth utilities
│   └── main.py           # Application entry
│
└── frontend/             # React + Vite
    └── src/
        ├── components/   # UI components
        ├── pages/        # Dashboard, Map, Login, etc.
        └── App.jsx       # Main app
```

---

## Tech Stack

**Backend**: FastAPI, MongoDB, JWT authentication, bcrypt password hashing

**Frontend**: React 18, Vite, React Router DOM

---

## Quick Start

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload  # Runs on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

---

## API Endpoints

- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and receive JWT token
- `GET /auth/me` - Get user profile (protected)
- `PUT /auth/change-password` - Update password (protected)
- `DELETE /auth/delete-account` - Delete account (protected)

**API Docs**: http://localhost:8000/docs

---

## Key Features

- JWT-based authentication with secure password requirements
- MongoDB async database with Motor driver
- Responsive design for desktop and mobile
- Economic mobility data visualization (dashboard and map views)
- Saved graphs and reports functionality
