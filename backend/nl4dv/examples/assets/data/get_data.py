#!/usr/bin/env python3
"""
get_data.py
Fetches multiple economic mobility metrics for Atlanta metro counties.

Requirements:
- pip install requests pandas python-dotenv
- .env file in project root with:
    CENSUS_API_KEY=your_key_here
    BLS_API_KEY=your_key_here
"""

import os
import requests
import pandas as pd
from dotenv import load_dotenv
from time import sleep

load_dotenv(".env")
CENSUS_API_KEY = os.getenv("CENSUS_API_KEY")

if not CENSUS_API_KEY:
    raise Exception("❌ ERROR: CENSUS_API_KEY not found in .env")

ATLANTA_COUNTIES = {
    "Fulton": "121",
    "Cobb": "067",
    "DeKalb": "089",
    "Gwinnett": "135",
    "Clayton": "063",
    "Cherokee": "057",
    "Forsyth": "117",
    "Henry": "151",
    "Douglas": "097",
    "Fayette": "113"
}

STATE_FIPS = "13"
YEARS = [2019, 2020, 2021, 2022, 2023]

def get_poverty_rate(year):
    dataset = "acs1" if year != 2020 else "acs5"
    url = f"https://api.census.gov/data/{year}/acs/{dataset}"
    params = {
        "get": "NAME,B17001_002E,B17001_001E",
        "for": "county:*",
        "in": f"state:{STATE_FIPS}",
        "key": CENSUS_API_KEY,
    }
    r = requests.get(url, params=params)
    if r.status_code != 200:
        print(f"⚠️ Census API failed for {year}: {r.status_code}")
        return pd.DataFrame()
    json_data = r.json()
    df = pd.DataFrame(json_data[1:], columns=json_data[0])
    df = df[df["county"].isin(ATLANTA_COUNTIES.values())]
    df["poverty_rate"] = (df["B17001_002E"].astype(float) / df["B17001_001E"].astype(float)) * 100
    df = df[["NAME"]].copy()
    df["year"] = year
    df["metric"] = "poverty_rate"
    df["value"] = df["NAME"].map(lambda x: None)  # placeholder to fill next
    return df

def get_unemployment_rate(year):
    """BLS Local Area Unemployment Statistics API"""
    url = "https://api.bls.gov/publicAPI/v2/timeseries/data/"
    df_list = []
    for county_name, fips in ATLANTA_COUNTIES.items():
        series_id = f"LAUCT{STATE_FIPS}{fips}03"  # Check BLS LAUS website for actual series
        payload = {
            "seriesid": [series_id],
            "startyear": str(year),
            "endyear": str(year),
            "registrationKey": BLS_API_KEY
        }
        r = requests.post(url, json=payload)
        if r.status_code != 200:
            print(f"⚠️ No data for {series_id} in {year}")
            continue
        json_data = r.json()
        try:
            value = json_data["Results"]["series"][0]["data"][0]["value"]
        except (IndexError, KeyError):
            print(f"⚠️ No data for {series_id} in {year}")
            value = None
        df_list.append({
            "NAME": county_name,
            "year": year,
            "metric": "unemployment_rate",
            "value": value
        })
        sleep(0.25)
    return pd.DataFrame(df_list)

def get_placeholder_metric(year, metric_name):
    """Dummy function for metrics without APIs (Credential attainment, Placement rate, Income Mobility)"""
    return pd.DataFrame([{
        "NAME": county,
        "year": year,
        "metric": metric_name,
        "value": None
    } for county in ATLANTA_COUNTIES.keys()])

def combine_metrics():
    frames = []
    for year in YEARS:
        print(f"\n📡 Fetching data for {year}...")
        # Poverty rate
        pr = get_poverty_rate(year)
        frames.append(pr)
        # Unemployment rate
        ur = get_unemployment_rate(year)
        frames.append(ur)
        # Placeholder metrics
        for metric in ["median_wage", "annual_jobs", "k12_literacy", "credential_attainment",
                       "placement_rate", "cost_of_living_index", "income_mobility_index"]:
            frames.append(get_placeholder_metric(year, metric))
    combined = pd.concat(frames, ignore_index=True)
    combined.to_csv("atlanta_metrics.csv", index=False)
    print("\n✅ Saved CSV → atlanta_metrics.csv")
    print(combined.head(10))

if __name__ == "__main__":
    combine_metrics()
