import requests
import json

url = "http://localhost:5001/market-analysis"
payload = {
    "crop": "Rice",
    "location": "India"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
