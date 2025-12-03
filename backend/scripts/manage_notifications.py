#!/usr/bin/env python3
"""
Manage Notification Preferences Script
Helper script to create, list, and manage notification preferences.

Usage:
    # Create a notification preference
    python scripts/manage_notifications.py create --kpi-id poverty_rate --threshold 15.0 --email user@example.com
    
    # List all preferences
    python scripts/manage_notifications.py list
    
    # Delete a preference
    python scripts/manage_notifications.py delete --kpi-id poverty_rate
    
    # Get notification history
    python scripts/manage_notifications.py history

Requirements:
    - Backend server running on http://localhost:8000
    - Valid JWT token (set AUTH_TOKEN environment variable)
"""

import requests
import os
import sys
import argparse
from typing import Dict, Optional

# API Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
AUTH_TOKEN = os.getenv("AUTH_TOKEN", "")

# Threshold operators
OPERATORS = {
    "less_than": "less_than",
    "less_than_or_equal": "less_than_or_equal",
    "greater_than": "greater_than",
    "greater_than_or_equal": "greater_than_or_equal",
    "equal": "equal"
}


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


def create_preference(
    kpi_id: str,
    threshold_value: float,
    email: str,
    token: str,
    operator: str = "less_than",
    enabled: bool = True,
    cooldown_hours: int = 24,
    date_range: Optional[str] = None,
    alert_frequency: str = "daily"
) -> Dict:
    """Create a notification preference."""
    url = f"{API_BASE_URL}/api/notifications/preferences"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "kpi_id": kpi_id,
        "threshold_value": threshold_value,
        "threshold_operator": operator,
        "email": email,
        "enabled": enabled,
        "cooldown_hours": cooldown_hours,
        "alert_frequency": alert_frequency
    }
    
    if date_range:
        payload["date_range"] = date_range
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Created notification preference:")
            print(f"   KPI: {kpi_id}")
            print(f"   Threshold: {operator} {threshold_value}")
            print(f"   Email: {email}")
            return {"success": True, "result": result}
        else:
            error_detail = response.json().get("detail", "Unknown error")
            print(f"❌ Failed to create preference: {error_detail}")
            return {"success": False, "error": error_detail}
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {str(e)}")
        return {"success": False, "error": str(e)}


def list_preferences(token: str):
    """List all notification preferences."""
    url = f"{API_BASE_URL}/api/notifications/preferences"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            preferences = response.json()
            
            if not preferences:
                print("📭 No notification preferences found.")
                return
            
            print(f"📋 Found {len(preferences)} notification preference(s):\n")
            
            for pref in preferences:
                status = "✅ Enabled" if pref["enabled"] else "❌ Disabled"
                print(f"   {status} | KPI: {pref['kpi_id']}")
                print(f"      Threshold: {pref['threshold_operator']} {pref['threshold_value']}")
                print(f"      Email: {pref['email']}")
                print(f"      Cooldown: {pref['cooldown_hours']} hours")
                if pref.get("last_notified"):
                    print(f"      Last notified: {pref['last_notified']}")
                print()
        else:
            error_detail = response.json().get("detail", "Unknown error")
            print(f"❌ Failed to list preferences: {error_detail}")
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {str(e)}")


def delete_preference(kpi_id: str, token: str):
    """Delete a notification preference."""
    url = f"{API_BASE_URL}/api/notifications/preferences/{kpi_id}"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.delete(url, headers=headers)
        
        if response.status_code == 204:
            print(f"✅ Deleted notification preference for KPI: {kpi_id}")
        else:
            error_detail = response.json().get("detail", "Unknown error")
            print(f"❌ Failed to delete preference: {error_detail}")
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {str(e)}")


def get_history(token: str, limit: int = 20):
    """Get notification history."""
    url = f"{API_BASE_URL}/api/notifications/history"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"limit": limit}
    
    try:
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            history = response.json()
            
            if not history:
                print("📭 No notification history found.")
                return
            
            print(f"📧 Notification History (last {len(history)}):\n")
            
            for item in history:
                print(f"   📬 {item['kpi_name']} ({item['kpi_id']})")
                print(f"      Value: {item['actual_value']} (Threshold: {item['threshold_value']})")
                print(f"      Sent to: {item['email']}")
                print(f"      Sent at: {item['sent_at']}")
                print()
        else:
            error_detail = response.json().get("detail", "Unknown error")
            print(f"❌ Failed to get history: {error_detail}")
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {str(e)}")


def main():
    """Main function."""
    parser = argparse.ArgumentParser(
        description="Manage notification preferences"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Create command
    create_parser = subparsers.add_parser("create", help="Create a notification preference")
    create_parser.add_argument("--kpi-id", required=True, help="KPI ID")
    create_parser.add_argument("--threshold", type=float, required=True, help="Threshold value")
    create_parser.add_argument("--email", required=True, help="Email address")
    create_parser.add_argument("--operator", default="less_than", choices=list(OPERATORS.keys()), help="Threshold operator")
    create_parser.add_argument("--enabled", type=bool, default=True, help="Enable/disable (default: True)")
    create_parser.add_argument("--cooldown", type=int, default=24, help="Cooldown hours (default: 24)")
    create_parser.add_argument("--date-range", help="Date range string")
    create_parser.add_argument("--alert-frequency", default="daily", help="Alert frequency (default: daily)")
    
    # List command
    subparsers.add_parser("list", help="List all notification preferences")
    
    # Delete command
    delete_parser = subparsers.add_parser("delete", help="Delete a notification preference")
    delete_parser.add_argument("--kpi-id", required=True, help="KPI ID")
    
    # History command
    history_parser = subparsers.add_parser("history", help="Get notification history")
    history_parser.add_argument("--limit", type=int, default=20, help="Number of records (default: 20)")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
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
    
    # Execute command
    if args.command == "create":
        create_preference(
            args.kpi_id,
            args.threshold,
            args.email,
            token,
            args.operator,
            args.enabled,
            args.cooldown,
            args.date_range,
            args.alert_frequency
        )
    elif args.command == "list":
        list_preferences(token)
    elif args.command == "delete":
        delete_preference(args.kpi_id, token)
    elif args.command == "history":
        get_history(token, args.limit)


if __name__ == "__main__":
    main()

