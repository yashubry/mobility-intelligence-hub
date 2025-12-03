#!/usr/bin/env python3
"""
Initialize KPIs Script
Creates all KPIs in the database using the /api/kpis/ endpoint.

Usage:
    python scripts/init_kpis.py

Requirements:
    - Backend server running on http://localhost:8000
    - Valid JWT token (login first to get token)
    - Or set AUTH_TOKEN environment variable
"""

import requests
import os
import sys
from typing import List, Dict

# API Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
AUTH_TOKEN = os.getenv("AUTH_TOKEN", "")

# All KPIs to initialize
KPIs = [
    {
        "kpi_id": "poverty_rate",
        "name": "Poverty Rate",
        "description": "Percentage of population below poverty line in Atlanta metro counties",
        "unit": "percentage"
    },
    {
        "kpi_id": "unemployment_rate",
        "name": "Unemployment Rate",
        "description": "Unemployment rate for Atlanta metro counties",
        "unit": "percentage"
    },
    {
        "kpi_id": "median_income",
        "name": "Median Household Income",
        "description": "Median household income in Atlanta metro counties",
        "unit": "dollars"
    },
    {
        "kpi_id": "k12_literacy",
        "name": "K-12 Literacy Rate",
        "description": "K-12 literacy rates in Atlanta metro counties",
        "unit": "percentage"
    },
    {
        "kpi_id": "annual_jobs",
        "name": "Annual Jobs",
        "description": "Number of annual jobs available in Atlanta metro",
        "unit": "count"
    },
    {
        "kpi_id": "credential_attainment",
        "name": "Credential Attainment Rate",
        "description": "Rate of credential/degree attainment",
        "unit": "percentage"
    },
    {
        "kpi_id": "income_mobility_index",
        "name": "Income Mobility Index",
        "description": "Economic mobility index for Atlanta metro",
        "unit": "index"
    },
    {
        "kpi_id": "cost_of_living_index",
        "name": "Cost of Living Index",
        "description": "Cost of living index for Atlanta metro",
        "unit": "index"
    },
    {
        "kpi_id": "placement_rate",
        "name": "Job Placement Rate",
        "description": "Job placement success rate",
        "unit": "percentage"
    },
    {
        "kpi_id": "median_wage",
        "name": "Median Wage",
        "description": "Median wage in Atlanta metro",
        "unit": "dollars"
    }
]


def create_kpi(kpi_data: Dict, token: str) -> bool:
    """
    Create a KPI using the API endpoint.
    
    Args:
        kpi_data: Dictionary with KPI information
        token: JWT authentication token
    
    Returns:
        True if successful, False otherwise
    """
    url = f"{API_BASE_URL}/api/kpis/"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=kpi_data, headers=headers)
        
        if response.status_code == 201:
            print(f"✅ Created KPI: {kpi_data['name']} ({kpi_data['kpi_id']})")
            return True
        elif response.status_code == 400:
            error_detail = response.json().get("detail", "Unknown error")
            if "already exists" in error_detail:
                print(f"⚠️  KPI already exists: {kpi_data['name']} ({kpi_data['kpi_id']})")
                return True  # Not an error, just already exists
            else:
                print(f"❌ Error creating {kpi_data['name']}: {error_detail}")
                return False
        else:
            print(f"❌ Failed to create {kpi_data['name']}: Status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error for {kpi_data['name']}: {str(e)}")
        return False


def get_auth_token() -> str:
    """
    Get authentication token from environment or prompt user.
    
    Returns:
        JWT token string
    """
    if AUTH_TOKEN:
        return AUTH_TOKEN
    
    # Try to get token from user input
    print("\n🔐 Authentication required")
    print("Please provide your JWT token (get it by logging in via /auth/login)")
    print("Or set AUTH_TOKEN environment variable")
    token = input("Enter JWT token: ").strip()
    
    if not token:
        print("❌ No token provided. Exiting.")
        sys.exit(1)
    
    return token


def main():
    """Main function to initialize all KPIs."""
    print("🚀 Initializing KPIs in database...")
    print(f"   API Base URL: {API_BASE_URL}\n")
    
    # Get authentication token
    token = get_auth_token()
    
    # Test token by making a simple request
    test_url = f"{API_BASE_URL}/auth/me"
    test_headers = {"Authorization": f"Bearer {token}"}
    try:
        test_response = requests.get(test_url, headers=test_headers)
        if test_response.status_code != 200:
            print(f"❌ Authentication failed. Status: {test_response.status_code}")
            print("   Please check your token and try again.")
            sys.exit(1)
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to API: {str(e)}")
        print(f"   Make sure the backend server is running on {API_BASE_URL}")
        sys.exit(1)
    
    print("✅ Authentication successful\n")
    
    # Create all KPIs
    success_count = 0
    failed_count = 0
    
    for kpi in KPIs:
        if create_kpi(kpi, token):
            success_count += 1
        else:
            failed_count += 1
    
    # Summary
    print(f"\n📊 Summary:")
    print(f"   ✅ Successfully created/verified: {success_count}")
    print(f"   ❌ Failed: {failed_count}")
    print(f"   📝 Total KPIs: {len(KPIs)}")
    
    if failed_count == 0:
        print("\n🎉 All KPIs initialized successfully!")
    else:
        print(f"\n⚠️  {failed_count} KPIs failed to initialize. Check errors above.")


if __name__ == "__main__":
    main()

