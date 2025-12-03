# KPI Notification Scripts

This directory contains scripts to manage KPIs and notifications in the database.

## Prerequisites

1. Backend server running on `http://localhost:8000` (or set `API_BASE_URL` environment variable)
2. Valid JWT authentication token (get by logging in via `/auth/login`)
3. Python packages: `requests`, `pandas` (for CSV updates)

## Scripts

### 1. `init_kpis.py` - Initialize KPIs

Creates all KPIs in the database. Run this once to set up all available KPIs.

**Usage:**
```bash
# Set your auth token
export AUTH_TOKEN="your-jwt-token-here"

# Run the script
python scripts/init_kpis.py
```

**Or:**
```bash
python scripts/init_kpis.py
# Will prompt for token
```

**What it does:**
- Creates 10 KPIs:
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

---

### 2. `update_kpi_values.py` - Update KPI Values

Updates KPI values from CSV files or manual input. This triggers notification checks.

**Usage:**

**Manual update:**
```bash
export AUTH_TOKEN="your-jwt-token-here"

# Update a single KPI value
python scripts/update_kpi_values.py --kpi-id unemployment_rate --value 5.2 --date-range "January 2024"
```

**Update from CSV:**
```bash
# Update from a specific CSV file
python scripts/update_kpi_values.py --csv database/poverty_rate_atlanta.csv --kpi-id poverty_rate --value-column value
```

**Batch update from directory:**
```bash
# Update all KPIs from CSV files in a directory (auto-maps filenames to KPI IDs)
python scripts/update_kpi_values.py --csv-dir database/ --auto-map
```

**Options:**
- `--kpi-id`: KPI ID to update
- `--value`: Value to set (for manual updates)
- `--date-range`: Date range string (e.g., "January 2024")
- `--csv`: Path to CSV file
- `--value-column`: Column name containing values (default: "value")
- `--csv-dir`: Directory containing CSV files
- `--auto-map`: Automatically map CSV files to KPIs

---

### 3. `manage_notifications.py` - Manage Notification Preferences

Create, list, and manage notification preferences for users.

**Usage:**

**Create a notification preference:**
```bash
export AUTH_TOKEN="your-jwt-token-here"

# Alert when poverty rate is less than 15%
python scripts/manage_notifications.py create \
  --kpi-id poverty_rate \
  --threshold 15.0 \
  --email user@example.com \
  --operator less_than

# Alert when unemployment rate is greater than 5%
python scripts/manage_notifications.py create \
  --kpi-id unemployment_rate \
  --threshold 5.0 \
  --email user@example.com \
  --operator greater_than \
  --cooldown 12
```

**List all preferences:**
```bash
python scripts/manage_notifications.py list
```

**Delete a preference:**
```bash
python scripts/manage_notifications.py delete --kpi-id poverty_rate
```

**View notification history:**
```bash
python scripts/manage_notifications.py history --limit 20
```

**Options:**
- `create`: Create a new notification preference
  - `--kpi-id`: KPI ID to monitor (required)
  - `--threshold`: Threshold value (required)
  - `--email`: Email address (required)
  - `--operator`: Threshold operator (default: "less_than")
    - Options: `less_than`, `less_than_or_equal`, `greater_than`, `greater_than_or_equal`, `equal`
  - `--enabled`: Enable/disable (default: True)
  - `--cooldown`: Cooldown hours (default: 24)
  - `--date-range`: Date range string
  - `--alert-frequency`: Alert frequency (default: "daily")
- `list`: List all notification preferences
- `delete`: Delete a notification preference
  - `--kpi-id`: KPI ID (required)
- `history`: Get notification history
  - `--limit`: Number of records (default: 20)

---

## Getting Your Auth Token

1. Start your backend server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. Login via API:
   ```bash
   curl -X POST "http://localhost:8000/auth/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=your-email@example.com&password=your-password"
   ```

3. Copy the `access_token` from the response and set it:
   ```bash
   export AUTH_TOKEN="your-access-token-here"
   ```

---

## Example Workflow

1. **Initialize KPIs:**
   ```bash
   export AUTH_TOKEN="your-token"
   python scripts/init_kpis.py
   ```

2. **Set up notification preferences:**
   ```bash
   python scripts/manage_notifications.py create \
     --kpi-id poverty_rate \
     --threshold 15.0 \
     --email admin@careerrise.org \
     --operator less_than
   ```

3. **Update KPI values (triggers notifications):**
   ```bash
   # Manual update
   python scripts/update_kpi_values.py --kpi-id poverty_rate --value 14.5 --date-range "January 2024"
   
   # Or from CSV
   python scripts/update_kpi_values.py --csv-dir database/ --auto-map
   ```

4. **Check notification history:**
   ```bash
   python scripts/manage_notifications.py history
   ```

---

## Environment Variables

- `API_BASE_URL`: Backend API URL (default: `http://localhost:8000`)
- `AUTH_TOKEN`: JWT authentication token (can also be entered interactively)

---

## Notes

- All scripts require authentication
- KPI updates automatically trigger notification checks
- Notifications respect cooldown periods
- CSV files should have a `value` column (or specify with `--value-column`)

