# =========================
# IMPORTS
# =========================
from flask import Flask, request, jsonify
from datetime import datetime, timedelta
import requests

# =========================
# APP INIT
# =========================
app = Flask(__name__)

# =========================
# WEIGHTS
# =========================
W_ACTION = 0.30
W_FREQUENCY = 0.25
W_SENSITIVITY = 0.20
W_IP = 0.15
W_TIME = 0.10

# =========================
# SCORES TABLES
# =========================
action_scores = {
    "LOGIN": 5,
    "CREATE": 10,
    "UPDATE": 20,
    "DELETE": 40
}

entity_scores = {
    "Livraison": 20,
    "Facture": 40,
    "User": 50
}

# =========================
# MEMORY
# =========================
user_actions_counter = {}

# =========================
# TELEGRAM ALERT FUNCTION
# =========================
def send_telegram_alert(user_id, risk_score, status):
    try:
        token = "8784116778:AAFccI79HGrputbjOPpbX-DoEJWBfixAgag"
        chat_id = "45285156vghhbh:g4GrputbjOPpbX-DoAAFccI79HG57"

        message = f"""
🚨 ETAP-GAS ALERT 🚨
User: {user_id}
Risk Score: {risk_score}
Status: {status}
"""

        url = f"https://api.telegram.org/bot{token}/sendMessage"

        requests.post(url, data={
            "chat_id": chat_id,
            "text": message
        })

        print("Telegram alert sent ✔")

    except Exception as e:
        print("Telegram error:", e)

# =========================
# FREQUENCY FUNCTION
# =========================
def get_frequency_score(user_id):

    if user_id not in user_actions_counter:
        user_actions_counter[user_id] = []

    now = datetime.now()
    user_actions_counter[user_id].append(now)

    one_minute_ago = now - timedelta(seconds=60)

    recent_actions = [
        t for t in user_actions_counter[user_id]
        if t >= one_minute_ago
    ]

    count = len(recent_actions)

    if count <= 2:
        return 10
    elif count <= 4:
        return 40
    elif count <= 6:
        return 80
    else:
        return 120

# =========================
# API
# =========================
@app.route("/analyze", methods=["POST"])
def analyze():

    data = request.json

    user_id = data.get("userId")
    action = data.get("action")
    entity_type = data.get("entityType")
    ip_address = data.get("ipAddress")

    # =====================
    # SCORES
    # =====================
    action_score = action_scores.get(action, 10)
    sensitivity_score = entity_scores.get(entity_type, 20)
    frequency_score = get_frequency_score(user_id)

    if ip_address in ["::1", "127.0.0.1"]:
        ip_score = 0
    else:
        ip_score = 50

    hour = datetime.now().hour
    time_score = 70 if (hour < 6 or hour > 22) else 0

    # =====================
    # FINAL SCORE
    # =====================
    risk_score = (
        W_ACTION * action_score +
        W_FREQUENCY * frequency_score +
        W_SENSITIVITY * sensitivity_score +
        W_IP * ip_score +
        W_TIME * time_score
    )

    # =====================
    # DECISION
    # =====================
    if risk_score < 35:
        status = "NORMAL"
        alert = False

    elif risk_score < 60:
        status = "SUSPICIOUS"
        alert = True

    else:
        status = "ANOMALY"
        alert = True

        # =====================
        # TELEGRAM ALERT ONLY
        # =====================
        send_telegram_alert(user_id, risk_score, status)

    return jsonify({
        "risk_score": round(risk_score, 2),
        "status": status,
        "alert": alert
    })

# =========================
# RUN
# =========================
if __name__ == "__main__":
    app.run(port=5000, debug=True)