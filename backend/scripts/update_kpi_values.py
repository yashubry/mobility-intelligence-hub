#!/usr/bin/env python3
"""
Update KPI Values Script
Updates KPI values from CSV files or manual input, triggering notifications.

Usage:
    # Update from CSV file
    python scripts/update_kpi_values.py --csv database/poverty_rate_atlanta.csv --kpi-id poverty_rate --value-column value
    
    # Update single value manually
    python scripts/update_kpi_values.py --kpi-id unemployment_rate --value 5.2 --date-range "January 2024"
    
    # Update all KPIs from CSV directory
    python scripts/update_kpi_values.py --csv-dir database/ --auto-map

Requirements:
    - Backend server running on http://localhost:8000
    - Valid JWT token (set AUTH_TOKEN environment variable or login first)
"""

import requests
import pandas as pd
import os
import sys
import argparse
from pathlib import Path
from typing import Optional, Dict

# API Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
AUTH_TOKEN = os.getenv("AUTH_TOKEN", "")

# Mapping of CSV filenames to KPI IDs
CSV_TO_KPI_MAP = {
    "poverty_rate_atlanta.csv": "poverty_rate",
    "unemployment_rate.csv": "unemployment_rate",
    "median_income.csv": "median_income",
    "k12_literacy.csv": "k12_literacy",
    "annual_jobs.csv": "annual_jobs",
    "credential_attainment.csv": "credential_attainment",
    "income_mobility_index.csv": "income_mobility_index",
    "cost_of_living.csv": "cost_of_living_index",
    "unemployment_rate.csv": "unemployment_rate"
}


def update_kpi_value(
    kpi_id: str,
    value: float,
    token: str,
    date_range: Optional[str] = None
) -> Dict:
    """
    Update a KPI value using the API endpoint.
    This will trigger notification checks.
    
    Args:
        kpi_id: ID of the KPI to update
        value: New value for the KPI
        token: JWT authentication token
        date_range: Optional date range string
    
    Returns:
        Dictionary with update results
    """
    url = f"{API_BASE_URL}/api/kpis/{kpi_id}/update"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {"value": value}
    if date_range:
        payload["date_range"] = date_range
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            notifications_triggered = result.get("notifications_triggered", 0)
            
            print(f"✅ Updated {kpi_id}: {value}")
            if notifications_triggered > 0:
                print(f"   📧 Triggered {notifications_triggered} notification(s)")
            else:
                print(f"   ℹ️  No notifications triggered")
            
            return {"success": True, "result": result}
        else:
            error_detail = response.json().get("detail", "Unknown error")
            print(f"❌ Failed to update {kpi_id}: {error_detail}")
            return {"success": False, "error": error_detail}
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error for {kpi_id}: {str(e)}")
        return {"success": False, "error": str(e)}


def update_from_csv(
    csv_path: str,
    kpi_id: str,
    value_column: str,
    token: str,
    date_range: Optional[str] = None
):
    """
    Update KPI value from CSV file.
    
    Args:
        csv_path: Path to CSV file
        kpi_id: KPI ID to update
        value_column: Name of column containing values
        token: JWT authentication token
        date_range: Optional date range
    """
    try:
        df = pd.read_csv(csv_path)
        
        if value_column not in df.columns:
            print(f"❌ Column '{value_column}' not found in CSV")
            print(f"   Available columns: {', '.join(df.columns)}")
            return
        
        # Get the latest value (last row, or average, or sum - depends on KPI)
        # For most KPIs, we'll use the latest value or average
        if len(df) == 0:
            print(f"❌ CSV file is empty")
            return
        
        # Try to get latest value (if there's a date/year column)
        if 'year' in df.columns:
            latest_row = df.loc[df['year'].idxmax()]
            value = float(latest_row[value_column])
            if date_range is None:
                date_range = f"{int(latest_row['year'])}"
        elif 'date' in df.columns:
            latest_row = df.loc[df['date'].idxmax()]
            value = float(latest_row[value_column])
        else:
            # No date column, use average or last value
            values = df[value_column].dropna()
            if len(values) == 0:
                print(f"❌ No valid values found in column '{value_column}'")
                return
            value = float(values.iloc[-1])  # Use last value
        
        print(f"📊 Reading from CSV: {csv_path}")
        print(f"   Found value: {value}")
        
        # Update KPI
        result = update_kpi_value(kpi_id, value, token, date_range)
        
    except FileNotFoundError:
        print(f"❌ CSV file not found: {csv_path}")
    except Exception as e:
        print(f"❌ Error reading CSV: {str(e)}")


def update_from_directory(csv_dir: str, token: str, auto_map: bool = False):
    """
    Update all KPIs from CSV files in a directory.
    
    Args:
        csv_dir: Directory containing CSV files
        token: JWT authentication token
        auto_map: If True, automatically map CSV files to KPIs
    """
    csv_path = Path(csv_dir)
    
    if not csv_path.exists():
        print(f"❌ Directory not found: {csv_dir}")
        return
    
    csv_files = list(csv_path.glob("*.csv"))
    
    if not csv_files:
        print(f"❌ No CSV files found in {csv_dir}")
        return
    
    print(f"📁 Found {len(csv_files)} CSV file(s)\n")
    
    for csv_file in csv_files:
        filename = csv_file.name
        
        if auto_map and filename in CSV_TO_KPI_MAP:
            kpi_id = CSV_TO_KPI_MAP[filename]
            print(f"🔄 Processing {filename} → {kpi_id}")
            update_from_csv(str(csv_file), kpi_id, "value", token)
        else:
            print(f"⚠️  Skipping {filename} (not in auto-map)")


def get_auth_token() -> str:
    """Get authentication token from environment or prompt user."""
    if AUTH_TOKEN:
        return AUTH_TOKEN
    
    print("\n🔐 Authentication required")
    print("Please provide your JWT token (get it by logging in via /auth/login)")
    print("Or set AUTH_TOKEN environment variable")
    token = input("Enter JWT token: ").strip()
    
    if not token:
        print("❌ No token provided. Exiting.")
        sys.exit(1)
    
    return token


def main():
    """Main function."""
    parser = argparse.ArgumentParser(
        description="Update KPI values and trigger notifications"
    )
    
    parser.add_argument(
        "--kpi-id",
        type=str,
        help="KPI ID to update"
    )
    parser.add_argument(
        "--value",
        type=float,
        help="Value to set for the KPI"
    )
    parser.add_argument(
        "--date-range",
        type=str,
        help="Date range string (e.g., 'January 2024')"
    )
    parser.add_argument(
        "--csv",
        type=str,
        help="Path to CSV file"
    )
    parser.add_argument(
        "--value-column",
        type=str,
        default="value",
        help="Column name containing values (default: 'value')"
    )
    parser.add_argument(
        "--csv-dir",
        type=str,
        help="Directory containing CSV files"
    )
    parser.add_argument(
        "--auto-map",
        action="store_true",
        help="Automatically map CSV files to KPIs"
    )
    
    args = parser.parse_args()
    
    # Get authentication token
    token = get_auth_token()
    
    # Test authentication
    test_url = f"{API_BASE_URL}/auth/me"
    test_headers = {"Authorization": f"Bearer {token}"}
    try:
        test_response = requests.get(test_url, headers=test_headers)
        if test_response.status_code != 200:
            print(f"❌ Authentication failed. Status: {test_response.status_code}")
            sys.exit(1)
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to API: {str(e)}")
        print(f"   Make sure the backend server is running on {API_BASE_URL}")
        sys.exit(1)
    
    print("✅ Authentication successful\n")
    
    # Handle different update modes
    if args.csv_dir:
        update_from_directory(args.csv_dir, token, args.auto_map)
    elif args.csv and args.kpi_id:
        update_from_csv(args.csv, args.kpi_id, args.value_column, token, args.date_range)
    elif args.kpi_id and args.value is not None:
        update_kpi_value(args.kpi_id, args.value, token, args.date_range)
    else:
        parser.print_help()
        print("\n❌ Please provide either:")
        print("   --kpi-id and --value (for manual update)")
        print("   --csv and --kpi-id (for CSV update)")
        print("   --csv-dir and --auto-map (for batch update)")


if __name__ == "__main__":
    main()

