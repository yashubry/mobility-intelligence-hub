import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB")

# Connect to MongoDB
client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

# Test: list collections
print("Connected to MongoDB!")
print("Collections:", db.list_collection_names())

# Optional: insert a test document
test_collection = db["metrics"]
result = test_collection.insert_one({
    "county": "Fulton County",
    "metric": "unemployment_rate",
    "value": 3.4,
    "period": "2024-09",
    "last_updated": "2024-11-07"
})
print("Inserted document ID:", result.inserted_id)
