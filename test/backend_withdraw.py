import requests

# >> small Python script to make a request to a HTTP server for withdrawal

BASE_URL = "http://localhost:3001"
ACCOUNT = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8" # A1 account

res = requests.post(f"{BASE_URL}/withdraw/{ACCOUNT}?currency=eth")
print(f"ETH withdraw status = {res}")

res = requests.post(f"{BASE_URL}/withdraw/{ACCOUNT}?currency=usdc")
print(f"USDC withdraw status = {res}")
