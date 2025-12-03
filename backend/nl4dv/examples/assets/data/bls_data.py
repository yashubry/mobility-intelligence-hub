#!/usr/bin/env python3

"""
bls_data.py
Fetches BLS labor stats (annual jobs/labor force, unemployment, median wage) for Atlanta metro counties.

Requirements:
- pip install requests pandas python-dotenv
- .env file in project root with:
    BLS_API_KEY=your_bls_key_here
"""

import os
import requests
import pandas as pd
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env")  # adjust path if needed
BLS_API_KEY = os.getenv("BLS_API_KEY")
if not BLS_API_KEY:
    raise Exception("❌ ERROR: BLS_API_KEY not found in .env")

# 3-digit FIPS for the 10 Atlanta Metro Counties
ATLANTA_COUNTIES = {
    "Fulton": "092",
    "Cobb": "033",
    "DeKalb": "044",
    "Gwinnett": "067",
    "Clayton": "031",
    "Cherokee": "028",
    "Forsyth": "058",
    "Henry": "075",
    "Douglas": "048",
    "Fayette": "056"
}

STATE_FIPS = "13"
YEARS = [2019, 2020, 2021, 2022, 2023]

# Metric → BLS LAUS measure codes
METRIC_CODES = {
    "unemployment": "03",   # Unemployment Rate
    "labor_force": "01",     # Total Labor Force
    # Median Wage uses a separate series format
}

def build_series_ids(metric: str):
    """
    Build BLS LAUS series IDs for Atlanta counties
    """
    series_ids = []
    for county_name, county_fips in ATLANTA_COUNTIES.items():
        if metric in METRIC_CODES:
            code = METRIC_CODES[metric]
            series_ids.append(f"LAUCT{STATE_FIPS}{county_fips}{code}")
    return series_ids

def fetch_bls_data(series_ids, start_year, end_year):
    """
    Fetches data from BLS API for given series_ids and years
    """
    url = "https://api.bls.gov/publicAPI/v2/timeseries/data/"
    headers = {"Content-Type": "application/json"}
    payload = {
        "seriesid": series_ids,
        "startyear": str(start_year),
        "endyear": str(end_year),
        "registrationKey": BLS_API_KEY,
    }

    r = requests.post(url, json=payload, headers=headers)
    if r.status_code != 200:
        raise Exception(f"BLS API Error: {r.status_code} {r.text}")
    return r.json()

def parse_bls_response(bls_json, metric_name):
    """
    Parse BLS response JSON into a list of dicts
    """
    data_list = []
    for series in bls_json.get("Results", {}).get("series", []):
        series_id = series.get("seriesID")
        # Match the county by checking if the 3-digit county FIPS is in the series_id
        county_match = [k for k, v in ATLANTA_COUNTIES.items() if v in series_id]
        if not county_match:
            print(f"No county match for series_id: {series_id}")
            continue
        county_name = county_match[0]

        for item in series.get("data", []):
            year = int(item["year"])
            if year not in YEARS:
                continue
            try:
                value = float(item["value"])
            except ValueError:
                value = None
            data_list.append({
                "county": county_name,
                "year": year,
                "metric": metric_name,
                "value": value
            })
    return data_list

if __name__ == "__main__":
    all_data = []

    for metric in METRIC_CODES.keys():
        series_ids = build_series_ids(metric)
        print(f"\nFetching {metric} data from BLS...")
        bls_json = fetch_bls_data(series_ids, min(YEARS), max(YEARS))
        metric_data = parse_bls_response(bls_json, metric)
        all_data.extend(metric_data)

    # Convert to DataFrame and save
    df = pd.DataFrame(all_data)
    df.to_csv("bls_atlanta_metrics.csv", index=False)
    print("\nSaved CSV → bls_atlanta_metrics.csv")
    print(df.head())
