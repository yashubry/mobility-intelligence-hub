# Economic Mobility Intelligence Hub

**Geospatial analytics dashboard for exploring economic mobility metrics across counties.**

A full-stack web application that visualizes economic mobility data, provides AI-powered career guidance, and enables data-driven workforce development decisions across the Atlanta metro area.

---

## Overview

The Economic Mobility Intelligence Hub empowers organizations to track, visualize, and act on key economic mobility indicators—including income growth, employment rates, educational attainment, and workforce resource access. Built for **Code for Good - JPMorgan Chase**, this platform enables targeted programming decisions that maximize impact across 38+ Atlanta communities.

---

## Key Features

### Interactive Geospatial Visualization
- **Real-time heatmap** displaying county-level economic metrics (literacy rates, poverty rates, income mobility)
- **Interactive hover interactions** with detailed county statistics
- **Multi-metric switching** for comprehensive data exploration
- Built with **React-Leaflet** for seamless map interactions

### AI-Powered Career Guidance
- **CareerBot** powered by OpenAI GPT-4 API
- Personalized career pathway recommendations across 5 priority sectors:
  - Information Technology
  - Construction
  - Manufacturing
  - Transportation & Logistics
  - Healthcare
- Salary ranges, training pathways, and credential requirements

### Secure Payment Processing
- **Stripe Payment Intents API** integration
- Embedded payment forms with 4-step checkout flow
- Secure billing address collection
- Success animations and confirmation flows

### Natural Language to Visualization (NL4DV)
- Generate data visualizations from CSV datasets using **plain English queries**
- Powered by Stanford's NL4DV library
- Supports multiple visualization types (bar charts, scatter plots, line graphs, etc.)

### Authentication & Security
- **JWT-based authentication** with secure token management
- **bcrypt password hashing** with 72-byte truncation handling
- Protected routes and user profile management
- CORS configuration for secure API access

### Responsive Dashboard
- Multi-tile data visualization system
- Saved graphs and reports functionality
- Real-time notifications
- Modern, animated UI with chart-like visualizations

---

## Tech Stack

### Frontend
- **React 18** with **Vite** for fast development
- **React Router DOM** for client-side routing
- **React-Leaflet** for interactive mapping
- **Stripe Elements** for payment processing
- **React Icons** for scalable iconography
- Modern CSS with animations and responsive design

### Backend
- **FastAPI** for high-performance API development
- **SQLite** with **SQLAlchemy** ORM
- **JWT** for authentication
- **bcrypt** for password hashing
- **Stripe API** for payment processing
- **OpenAI API** for AI-powered features
- **NL4DV** library for natural language visualization

### Infrastructure
- RESTful API design
- Async/await patterns for optimal performance
- Environment variable management
- Comprehensive error handling

---

## Quick Start

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.9+
- **Git**

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file (see backend/.env.example)
# Add your OpenAI API key, Stripe keys, etc.

# Initialize database
python init_db.py

# Run the server
uvicorn main:app --reload
# Backend runs on http://localhost:8000
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env file
# Add: VITE_OPENAI_API_KEY=your_key_here
# Add: VITE_STRIPE_PUBLISHABLE_KEY=your_key_here

npm run dev
# Frontend runs on http://localhost:5173
```

### Environment Variables

**Backend** (`backend/.env`):
```env
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
JWT_SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///./atlanta_data.db
```

**Frontend** (`frontend/.env`):
```env
VITE_OPENAI_API_KEY=sk-...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8000
```

---

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and receive JWT token
- `GET /auth/me` - Get user profile (protected)
- `PUT /auth/change-password` - Update password (protected)
- `DELETE /auth/delete-account` - Delete account (protected)

### Payments
- `POST /payments/create-intent` - Create Stripe payment intent
- `POST /payments/confirm` - Confirm payment

### KPIs & Data
- `GET /kpis` - Get KPI metrics
- `GET /kpis/{kpi_id}` - Get specific KPI

**Interactive API Documentation**: http://localhost:8000/docs (Swagger UI)

---

## Project Structure

```
mobility-intelligence-hub/
├── backend/
│   ├── app/
│   │   ├── routes/          # API endpoints (auth, payments, kpis)
│   │   ├── services/        # Business logic (KPI monitoring)
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── database.py      # Database connection
│   │   ├── utils.py         # Auth utilities (JWT, bcrypt)
│   │   └── config.py        # Configuration
│   ├── nl4dv/               # Natural Language to Visualization library
│   ├── scripts/             # Database initialization scripts
│   ├── main.py              # FastAPI application entry
│   └── requirements.txt     # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── components/      # Reusable UI components
    │   │   ├── NavBar.jsx
    │   │   ├── GraphTile.jsx
    │   │   ├── MapTile.jsx
    │   │   └── paymentModal.jsx
    │   ├── pages/           # Page components
    │   │   ├── Home.jsx     # Landing page
    │   │   ├── Dashboard.jsx
    │   │   ├── Map.jsx      # Interactive map
    │   │   ├── CareerBot.jsx
    │   │   └── login.jsx
    │   ├── services/        # API clients
    │   │   ├── careerBotClient.js
    │   │   ├── nl4dv.js
    │   │   └── csvDataService.js
    │   └── App.jsx          # Main application
    ├── public/              # Static assets
    └── package.json         # Node dependencies
```

---

## Data Storytelling Highlights

### Visual Design
- **Chart-like dioramas** in the stats section with animated bar charts and circular progress rings
- **Step-by-step visualizations** showing the user journey
- **Interactive hover effects** and smooth animations throughout
- **Responsive design** optimized for desktop, tablet, and mobile

### User Experience
- **Intuitive navigation** with clear information architecture
- **Real-time feedback** on user actions
- **Educational resources** section linking to external economic mobility resources
- **Accessible design** with proper contrast and keyboard navigation

---

## Security Features

- **Password Security**: bcrypt hashing with automatic truncation for passwords >72 bytes
- **JWT Tokens**: Secure token-based authentication with expiration
- **CORS**: Configured for secure cross-origin requests
- **Environment Variables**: Sensitive keys stored in `.env` files (gitignored)
- **Stripe Security**: PCI-compliant payment processing with embedded forms

---

## Additional Documentation

- **[API Configuration Guide](API_CONFIGURATION_GUIDE.md)** - Detailed API setup instructions
- **[Stripe Setup Guide](STRIPE_SETUP.md)** - Payment integration walkthrough
- **[AWS Deployment](AWS_DEPLOYMENT.md)** - Production deployment guide
- **[Resume Section](RESUME_SECTION.md)** - Professional project description for resumes

---
---

## License

This project is part of the Code for Good initiative. Please refer to the original repository for licensing information.

---

## Acknowledgments

- **CareerRise** for the mission and data
- **Stanford NL4DV** team for the natural language visualization library
- **OpenAI** for GPT-4 API
- **Stripe** for payment processing infrastructure

---

## Contact

For questions or support, please open an issue in this repository.

---

**Built for economic mobility and workforce development**
