import pandas as pd
import sqlite3
import os

# Read the CSV file
poverty_rate_atlanta = pd.read_csv('./poverty_rate_atlanta.csv')
literacy_rate = pd.read_csv('./k12_literacy.csv')
annual_jobs = pd.read_csv('./annual_jobs.csv')
credential_attainment = pd.read_csv('./credential_attainment.csv')
median_income = pd.read_csv('./median_income.csv')
income_mobility = pd.read_csv('./income_mobility_index.csv')
cost_of_living = pd.read_csv('./cost_of_living.csv')
unemployment_rate = pd.read_csv('./unemployment_rate.csv')

# Display poverty rate data info
print("=== Poverty Rate Data Overview ===")
print(poverty_rate_atlanta.head())
print("\n=== Poverty Rate Data Info ===")
print(poverty_rate_atlanta.info())
print("\n=== Poverty Rate Null Values ===")
print(poverty_rate_atlanta.isnull().sum())

# Display literacy rate data info
print("\n=== Literacy Rate Data Overview ===")
print(literacy_rate.head())
print("\n=== Literacy Rate Data Info ===")
print(literacy_rate.info())
print("\n=== Literacy Rate Null Values ===")
print(literacy_rate.isnull().sum())

# Display annual jobs data info
print("\n=== Annual Jobs Data Overview ===")
print(annual_jobs.head())
print("\n=== Annual Jobs Null Values ===")
print(annual_jobs.isnull().sum())

# Display credential attainment data info
print("\n=== Credential Attainment Data Overview ===")
print(credential_attainment.head())
print("\n=== Credential Attainment Null Values ===")
print(credential_attainment.isnull().sum())

# Display median income data info
print("\n=== Median Income Data Overview ===")
print(median_income.head())
print("\n=== Median Income Null Values ===")
print(median_income.isnull().sum())

# Display income mobility data info
print("\n=== Income Mobility Data Overview ===")
print(income_mobility.head())
print("\n=== Income Mobility Null Values ===")
print(income_mobility.isnull().sum())

# Display cost of living data info
print("\n=== Cost of Living Data Overview ===")
print(cost_of_living.head())
print("\n=== Cost of Living Null Values ===")
print(cost_of_living.isnull().sum())

# Display unemployment rate data info
print("\n=== Unemployment Rate Data Overview ===")
print(unemployment_rate.head())
print("\n=== Unemployment Rate Null Values ===")
print(unemployment_rate.isnull().sum())

# Clean the data (fill null values)
poverty_rate_atlanta.fillna(0, inplace=True)
literacy_rate.fillna(0, inplace=True)
annual_jobs.fillna(0, inplace=True)
credential_attainment.fillna(0, inplace=True)
median_income.fillna(0, inplace=True)
income_mobility.fillna(0, inplace=True)
cost_of_living.fillna(0, inplace=True)
unemployment_rate.fillna(0, inplace=True)

# Save to SQLite database
db_path = './atlanta_data.db'
conn = sqlite3.connect(db_path)

# Save poverty rate DataFrame to SQLite table
poverty_table = 'poverty_rate_atlanta'
poverty_rate_atlanta.to_sql(poverty_table, conn, if_exists='replace', index=False)
print(f"\n✅ Poverty rate data saved to SQLite database: {db_path}")
print(f"   Table name: {poverty_table}")
print(f"   Rows inserted: {len(poverty_rate_atlanta)}")

# Save literacy rate DataFrame to SQLite table
literacy_table = 'k12_literacy'
literacy_rate.to_sql(literacy_table, conn, if_exists='replace', index=False)
print(f"\n✅ Literacy rate data saved to SQLite database: {db_path}")
print(f"   Table name: {literacy_table}")
print(f"   Rows inserted: {len(literacy_rate)}")

# Save annual jobs DataFrame to SQLite table
annual_jobs_table = 'annual_jobs'
annual_jobs.to_sql(annual_jobs_table, conn, if_exists='replace', index=False)
print(f"\n✅ Annual jobs data saved to SQLite database: {db_path}")
print(f"   Table name: {annual_jobs_table}")
print(f"   Rows inserted: {len(annual_jobs)}")

# Save credential attainment DataFrame to SQLite table
credential_table = 'credential_attainment'
credential_attainment.to_sql(credential_table, conn, if_exists='replace', index=False)
print(f"\n✅ Credential attainment data saved to SQLite database: {db_path}")
print(f"   Table name: {credential_table}")
print(f"   Rows inserted: {len(credential_attainment)}")

# Save median income DataFrame to SQLite table
median_income_table = 'median_income'
median_income.to_sql(median_income_table, conn, if_exists='replace', index=False)
print(f"\n✅ Median income data saved to SQLite database: {db_path}")
print(f"   Table name: {median_income_table}")
print(f"   Rows inserted: {len(median_income)}")

# Save income mobility DataFrame to SQLite table
income_mobility_table = 'income_mobility_index'
income_mobility.to_sql(income_mobility_table, conn, if_exists='replace', index=False)
print(f"\n✅ Income mobility data saved to SQLite database: {db_path}")
print(f"   Table name: {income_mobility_table}")
print(f"   Rows inserted: {len(income_mobility)}")

# Save cost of living DataFrame to SQLite table
cost_of_living_table = 'cost_of_living'
cost_of_living.to_sql(cost_of_living_table, conn, if_exists='replace', index=False)
print(f"\n✅ Cost of living data saved to SQLite database: {db_path}")
print(f"   Table name: {cost_of_living_table}")
print(f"   Rows inserted: {len(cost_of_living)}")

# Save unemployment rate DataFrame to SQLite table
unemployment_table = 'unemployment_rate'
unemployment_rate.to_sql(unemployment_table, conn, if_exists='replace', index=False)
print(f"\n✅ Unemployment rate data saved to SQLite database: {db_path}")
print(f"   Table name: {unemployment_table}")
print(f"   Rows inserted: {len(unemployment_rate)}")

# Verify the data was saved correctly
print("\n=== Verifying poverty rate data in database ===")
verify_poverty = pd.read_sql_query(f"SELECT * FROM {poverty_table} LIMIT 5", conn)
print(verify_poverty)

print("\n=== Verifying literacy rate data in database ===")
verify_literacy = pd.read_sql_query(f"SELECT * FROM {literacy_table} LIMIT 5", conn)
print(verify_literacy)

print("\n=== Verifying annual jobs data in database ===")
verify_jobs = pd.read_sql_query(f"SELECT * FROM {annual_jobs_table} LIMIT 5", conn)
print(verify_jobs)

print("\n=== Verifying credential attainment data in database ===")
verify_credential = pd.read_sql_query(f"SELECT * FROM {credential_table} LIMIT 5", conn)
print(verify_credential)

print("\n=== Verifying median income data in database ===")
verify_income = pd.read_sql_query(f"SELECT * FROM {median_income_table} LIMIT 5", conn)
print(verify_income)

print("\n=== Verifying income mobility data in database ===")
verify_mobility = pd.read_sql_query(f"SELECT * FROM {income_mobility_table} LIMIT 5", conn)
print(verify_mobility)

print("\n=== Verifying cost of living data in database ===")
verify_cost = pd.read_sql_query(f"SELECT * FROM {cost_of_living_table} LIMIT 5", conn)
print(verify_cost)

print("\n=== Verifying unemployment rate data in database ===")
verify_unemployment = pd.read_sql_query(f"SELECT * FROM {unemployment_table} LIMIT 5", conn)
print(verify_unemployment)

# List all tables in the database
print("\n=== All tables in database ===")
tables = pd.read_sql_query("SELECT name FROM sqlite_master WHERE type='table'", conn)
print(tables)

# Close the connection
conn.close()
print(f"\n✅ Database connection closed")