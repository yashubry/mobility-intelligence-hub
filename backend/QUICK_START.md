# Quick Start Guide - KPI Notification System

## ✅ What's Been Set Up

1. **Email Notification System** - Complete with SendGrid integration
2. **KPI Management** - API endpoints for creating and updating KPIs
3. **Notification Preferences** - Users can set up alerts for KPIs
4. **Automation Scripts** - Three scripts to manage everything

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Set Up Environment Variables

Create `backend/.env` file:
```env
SECRET_KEY=your-secret-key-here
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=team5_db
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@careerrise.org
SENDGRID_FROM_NAME=CareerRise
DASHBOARD_URL=https://dashboard.careerrise.org
```

### Step 3: Start the Backend Server

```bash
cd backend
uvicorn main:app --reload
```

### Step 4: Get Your Auth Token

Login via API or Swagger UI (`http://localhost:8000/docs`):
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your-email@example.com&password=your-password"
```

Copy the `access_token` from the response.

### Step 5: Initialize KPIs

```bash
export AUTH_TOKEN="your-access-token-here"
python scripts/init_kpis.py
```

This creates all 10 KPIs:
- `poverty_rate` - Poverty Rate
- `unemployment_rate` - Unemployment Rate  
- `median_income` - Median Household Income
- `k12_literacy` - K-12 Literacy Rate
- `annual_jobs` - Annual Jobs
- `credential_attainment` - Credential Attainment Rate
- `income_mobility_index` - Income Mobility Index
- `cost_of_living_index` - Cost of Living Index
- `placement_rate` - Job Placement Rate
- `median_wage` - Median Wage

### Step 6: Set Up Notification Preferences

```bash
# Alert when poverty rate drops below 15%
python scripts/manage_notifications.py create \
  --kpi-id poverty_rate \
  --threshold 15.0 \
  --email admin@careerrise.org \
  --operator less_than
```

### Step 7: Update KPI Values (Triggers Notifications)

```bash
# Manual update
python scripts/update_kpi_values.py \
  --kpi-id poverty_rate \
  --value 14.5 \
  --date-range "January 2024"

# Or batch update from CSV files
python scripts/update_kpi_values.py \
  --csv-dir ../database/ \
  --auto-map
```

## 📋 Available Scripts

See `scripts/README.md` for detailed documentation:

1. **`init_kpis.py`** - Initialize all KPIs in database
2. **`update_kpi_values.py`** - Update KPI values from CSV or manually
3. **`manage_notifications.py`** - Create/list/delete notification preferences

## 🔧 API Endpoints

All endpoints are documented at `http://localhost:8000/docs` when server is running.

### KPI Endpoints
- `POST /api/kpis/` - Create a KPI
- `GET /api/kpis/` - List all KPIs
- `GET /api/kpis/{kpi_id}` - Get specific KPI
- `POST /api/kpis/{kpi_id}/update` - Update KPI value (triggers notifications)

### Notification Endpoints
- `POST /api/notifications/preferences` - Create notification preference
- `GET /api/notifications/preferences` - List all preferences
- `GET /api/notifications/preferences/{kpi_id}` - Get specific preference
- `DELETE /api/notifications/preferences/{kpi_id}` - Delete preference
- `GET /api/notifications/history` - Get notification history

## 📧 How Notifications Work

1. User creates a notification preference with:
   - KPI ID to monitor
   - Threshold value
   - Comparison operator (less than, greater than, etc.)
   - Email address

2. When a KPI value is updated via `/api/kpis/{kpi_id}/update`:
   - System checks all enabled preferences for that KPI
   - If threshold condition is met, sends email via SendGrid
   - Respects cooldown periods (default: 24 hours)
   - Logs notification in history

3. Email includes:
   - KPI name
   - Current value
   - Threshold value
   - Date range
   - Link to dashboard

## 🐛 Troubleshooting

**"SendGrid API key not configured"**
- Make sure `SENDGRID_API_KEY` is set in `.env`

**"Authentication failed"**
- Get a fresh token by logging in again
- Token expires after 30 minutes (configurable)

**"KPI not found"**
- Run `init_kpis.py` to create all KPIs

**"Cannot connect to API"**
- Make sure backend server is running on `http://localhost:8000`
- Or set `API_BASE_URL` environment variable

## 📚 More Information

- See `scripts/README.md` for detailed script documentation
- See `EMAIL_NOTIFICATIONS_README.md` for system architecture
- API docs available at `http://localhost:8000/docs`

