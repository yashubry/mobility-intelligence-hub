import pandas as pd
import numpy as np

# Define the counties to ensure consistent ordering
COUNTIES = ['Fulton', 'Cobb', 'DeKalb', 'Gwinnett', 'Clayton', 'Cherokee', 'Forsyth', 'Henry', 'Douglas', 'Fayette']

def extract_county_name(name):
    """Extract short county name from full format"""
    if pd.isna(name):
        return name
    if isinstance(name, str) and 'County' in name:
        return name.split(' County')[0]
    return name

def load_and_normalize_csv(filename, metric_name, value_column='value'):
    """Load a CSV and normalize it to standard format"""
    df = pd.read_csv(filename)

    # Normalize county names
    if 'NAME' in df.columns:
        df['county'] = df['NAME'].apply(extract_county_name)
        df = df.drop('NAME', axis=1)

    # Handle different column names
    if value_column != 'value' and value_column in df.columns:
        df = df.rename(columns={value_column: 'value'})

    # Add or rename metric column
    if 'metric' not in df.columns:
        df['metric'] = metric_name

    # Select and order columns
    df = df[['county', 'year', 'metric', 'value']]

    return df

def extrapolate_2024(df, metric_name):
    """Extrapolate 2024 values based on 2022-2023 trend"""
    df_2024 = []

    for county in COUNTIES:
        county_data = df[df['county'] == county].sort_values('year')

        if len(county_data) >= 2:
            # Get last two years
            last_two = county_data.tail(2)
            year_2022 = last_two[last_two['year'] == 2022]['value'].values
            year_2023 = last_two[last_two['year'] == 2023]['value'].values

            if len(year_2022) > 0 and len(year_2023) > 0:
                # Linear extrapolation
                trend = year_2023[0] - year_2022[0]
                value_2024 = year_2023[0] + trend

                df_2024.append({
                    'county': county,
                    'year': 2024,
                    'metric': metric_name,
                    'value': value_2024
                })

    return pd.DataFrame(df_2024)

# Load all datasets
print("Loading and normalizing datasets...")

df_annual_jobs = load_and_normalize_csv('annual_jobs.csv', 'annual_jobs')
df_cost_of_living = load_and_normalize_csv('cost_of_living.csv', 'cost_of_living')
df_credential = load_and_normalize_csv('credential_attainment.csv', 'credential_attainment')
df_income_mobility = load_and_normalize_csv('income_mobility_index.csv', 'income_mobility_index')
df_k12_literacy = load_and_normalize_csv('k12_literacy.csv', 'k12_literacy', value_column='literacy_percentage')
df_median_income = load_and_normalize_csv('median_income.csv', 'median_income')
df_poverty = load_and_normalize_csv('poverty_rate_atlanta.csv', 'poverty_rate', value_column='poverty_percentage')
df_unemployment = load_and_normalize_csv('unemployment_rate.csv', 'unemployment_rate')

# Extrapolate 2024 data for annual_jobs and poverty_rate
print("Extrapolating 2024 data for annual_jobs and poverty_rate...")
df_annual_jobs_2024 = extrapolate_2024(df_annual_jobs, 'annual_jobs')
df_poverty_2024 = extrapolate_2024(df_poverty, 'poverty_rate')

# Append 2024 data
df_annual_jobs = pd.concat([df_annual_jobs, df_annual_jobs_2024], ignore_index=True)
df_poverty = pd.concat([df_poverty, df_poverty_2024], ignore_index=True)

# Combine all datasets
print("Combining all datasets...")
df_unified = pd.concat([
    df_annual_jobs,
    df_cost_of_living,
    df_credential,
    df_income_mobility,
    df_k12_literacy,
    df_median_income,
    df_poverty,
    df_unemployment
], ignore_index=True)

# Sort by county, year, and metric
df_unified = df_unified.sort_values(['county', 'year', 'metric']).reset_index(drop=True)

# Save to CSV
output_file = 'unified_atlanta_data.csv'
df_unified.to_csv(output_file, index=False)

print(f"\nUnified data saved to {output_file}")
print(f"Total rows: {len(df_unified)}")
print(f"\nBreakdown by metric:")
print(df_unified.groupby('metric').size())
print(f"\nYears covered: {sorted(df_unified['year'].unique())}")
print(f"Counties: {sorted(df_unified['county'].unique())}")
