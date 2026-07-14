import requests

data = {
    "userId": "123",
    "action": "DELETE",
    "entityType": "Facture",
    "ipAddress": "185.10.10.10"
}

res = requests.post("http://127.0.0.1:5000/analyze", json=data)

print(res.json())