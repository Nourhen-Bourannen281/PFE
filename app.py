"""
app.py  —  ETAP Risk Analyser (microservice Flask)
Détecte les comportements anormaux : brute-force, rate-limiting, actions
suspectes.  Écoute sur http://localhost:5001
"""

import sys
# Force UTF-8 output so Windows cp1252 consoles don't crash on emoji
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from flask import Flask, request, jsonify
from collections import defaultdict
import time
import threading
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os

app = Flask(__name__)

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION EMAIL - Alertes Sécurité
# ═══════════════════════════════════════════════════════════════
EMAIL_CONFIG = {
    'sender': os.getenv('EMAIL_USER', 'ayetbrahimghofrane@gmail.com'),
    'password': os.getenv('EMAIL_PASS', 'ycmwadshmrxvzuhz'),
    'recipient': 'aziz.hamadi.dev@gmail.com',  # ← Email destinataire des alertes
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587
}


def send_security_alert(subject: str, alert_type: str, details: dict):
    """
    Envoie un email d'alerte sécurité à aziz.hamadi.dev@gmail.com

    alert_type: 'PIRATAGE' | 'CONNEXION' | 'ANOMALIE' | 'BRUTE_FORCE' | 'ROLE_CHANGE'
    """
    try:
        # Couleurs selon type d'alerte
        colors = {
            'PIRATAGE':     '#dc2626',  # Rouge
            'BRUTE_FORCE':  '#dc2626',  # Rouge
            'CONNEXION':    '#10b981',  # Vert
            'ANOMALIE':     '#f59e0b',  # Orange
            'ROLE_CHANGE':  '#8b5cf6',  # Violet
        }
        color = colors.get(alert_type, '#0c2c5c')

        icons = {
            'PIRATAGE':     '🚨',
            'BRUTE_FORCE':  '🚨',
            'CONNEXION':    '✅',
            'ANOMALIE':     '⚠️',
            'ROLE_CHANGE':  '👤',
        }
        icon = icons.get(alert_type, '🔐')

        # Construction du HTML
        rows_html = ''.join([
            f'''
            <tr>
                <td style="padding:12px;border:1px solid #e2e8f0;font-weight:600;color:#475569;width:35%;">{key}</td>
                <td style="padding:12px;border:1px solid #e2e8f0;">{value}</td>
            </tr>
            '''
            for key, value in details.items()
        ])

        html = f'''
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f5f7fa;">
            <div style="background:linear-gradient(135deg,{color} 0%,#0c2c5c 100%);color:white;padding:30px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="margin:0;font-size:28px;">{icon} ALERTE SÉCURITÉ</h1>
                <p style="margin:8px 0 0;opacity:0.95;font-size:16px;">{alert_type.replace('_', ' ')}</p>
            </div>

            <div style="background:white;padding:30px;border-radius:0 0 12px 12px;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
                <div style="background:{color}15;border-left:4px solid {color};padding:16px;border-radius:8px;margin-bottom:20px;">
                    <h2 style="margin:0;color:{color};font-size:18px;">⚠️ Évènement détecté</h2>
                    <p style="margin:8px 0 0;color:#475569;">{subject}</p>
                </div>

                <h3 style="color:#0c2c5c;margin:20px 0 12px;font-size:16px;">📋 Détails</h3>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    {rows_html}
                </table>

                <div style="margin-top:24px;padding:16px;background:#fef2f2;border-radius:8px;border-left:4px solid #dc2626;">
                    <strong style="color:#dc2626;">🚨 Action recommandée:</strong>
                    <ul style="margin:8px 0;padding-left:20px;color:#7f1d1d;">
                        <li>Vérifier l'identité de l'utilisateur</li>
                        <li>Bloquer l'IP si suspecte</li>
                        <li>Forcer le changement de mot de passe</li>
                        <li>Activer la double authentification (2FA)</li>
                    </ul>
                </div>

                <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#94a3b8;">
                    <p style="margin:0;">🐍 SMART-TRADE 360° Risk Analyser (Python/Flask)</p>
                    <p style="margin:8px 0 0;">© {datetime.now().year} SMART-TRADE 360°</p>
                </div>
            </div>
        </div>
        '''

        # Création de l'email
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'{icon} {alert_type}: {subject[:80]}'
        msg['From'] = f'SMART-TRADE 360° Sécurité <{EMAIL_CONFIG["sender"]}>'
        msg['To'] = EMAIL_CONFIG['recipient']

        msg.attach(MIMEText(html, 'html'))

        # Envoi via SMTP
        with smtplib.SMTP(EMAIL_CONFIG['smtp_server'], EMAIL_CONFIG['smtp_port']) as server:
            server.starttls()
            server.login(EMAIL_CONFIG['sender'], EMAIL_CONFIG['password'])
            server.send_message(msg)

        print(f"✅ Email d'alerte envoyé à {EMAIL_CONFIG['recipient']}: {alert_type}")
        return True
    except Exception as e:
        print(f"❌ Erreur envoi email: {e}")
        return False

# ── Stockage en mémoire (réinitialisé au redémarrage) ─────────────────
# { userId   -> [timestamp, ...] }
_user_actions = defaultdict(list)
# { ipAddress -> [timestamp, ...] }
_ip_actions   = defaultdict(list)
# { email    -> { count, first_attempt } }
_failed_logins = defaultdict(lambda: {"count": 0, "first": 0})

_lock = threading.Lock()

# ── Paramètres de détection ──────────────────────────────────────────
WINDOW_SEC        = 300   # fenêtre glissante de 5 minutes
SUSPICIOUS_USER   = 30    # actions / user / fenêtre → SUSPICIOUS
ANOMALY_USER      = 60    # actions / user / fenêtre → ANOMALY
SUSPICIOUS_IP     = 80    # actions / IP  / fenêtre → SUSPICIOUS
ANOMALY_IP        = 150   # actions / IP  / fenêtre → ANOMALY
BRUTE_FORCE_LIMIT = 5     # échecs consécutifs → brute-force
BRUTE_WINDOW_SEC  = 600   # fenêtre brute-force : 10 minutes


def _prune(lst: list, window: float) -> list:
    cutoff = time.time() - window
    return [t for t in lst if t > cutoff]


# ── Endpoint principal ───────────────────────────────────────────────
@app.route("/analyze", methods=["POST"])
def analyze():
    data       = request.get_json(silent=True) or {}
    user_id    = str(data.get("userId",     "anonymous"))
    action     = str(data.get("action",     "UNKNOWN"))
    entity     = str(data.get("entityType", "Unknown"))
    ip         = str(data.get("ipAddress",  "127.0.0.1"))
    now        = time.time()

    with _lock:
        _user_actions[user_id] = _prune(_user_actions[user_id], WINDOW_SEC)
        _user_actions[user_id].append(now)

        _ip_actions[ip] = _prune(_ip_actions[ip], WINDOW_SEC)
        _ip_actions[ip].append(now)

        user_count = len(_user_actions[user_id])
        ip_count   = len(_ip_actions[ip])

    risk_score = 0
    status     = "NORMAL"
    alert      = False
    reasons    = []

    # ── Pondération par type d'action ──────────────────────────────
    if action == "DELETE":
        risk_score += 20
        reasons.append("DELETE action")
    elif action == "LOGIN":
        risk_score += 5

    # ── Rate-limit par utilisateur ─────────────────────────────────
    if user_count >= ANOMALY_USER:
        risk_score += 60
        status      = "ANOMALY"
        alert       = True
        reasons.append(f"user rate limit ({user_count} actions in {WINDOW_SEC}s)")
    elif user_count >= SUSPICIOUS_USER:
        risk_score += 30
        status      = "SUSPICIOUS"
        alert       = True
        reasons.append(f"user suspicious ({user_count} actions in {WINDOW_SEC}s)")

    # ── Rate-limit par IP ──────────────────────────────────────────
    if ip_count >= ANOMALY_IP:
        risk_score += 40
        if status != "ANOMALY":
            status = "ANOMALY"
        alert = True
        reasons.append(f"IP rate limit ({ip_count} req in {WINDOW_SEC}s)")
    elif ip_count >= SUSPICIOUS_IP:
        risk_score += 20
        if status == "NORMAL":
            status = "SUSPICIOUS"
        alert = True
        reasons.append(f"IP suspicious ({ip_count} req in {WINDOW_SEC}s)")

    risk_score = min(risk_score, 100)

    return jsonify({
        "risk_score":  risk_score,
        "status":      status,
        "alert":       alert,
        "user_count":  user_count,
        "ip_count":    ip_count,
        "reasons":     reasons,
    })


# ── Endpoint échec de connexion (brute-force) ────────────────────────
@app.route("/login-failed", methods=["POST"])
def login_failed():
    """
    Appelé par Node.js à chaque tentative de login échouée.
    Retourne brute_force=True dès BRUTE_FORCE_LIMIT échecs.
    Envoie un EMAIL ALERTE dès 3 tentatives.
    """
    data  = request.get_json(silent=True) or {}
    email = str(data.get("email", "unknown")).lower()
    ip    = str(data.get("ipAddress", "Inconnu"))
    user_agent = str(data.get("userAgent", "Inconnu"))
    now   = time.time()

    with _lock:
        rec = _failed_logins[email]
        if now - rec["first"] > BRUTE_WINDOW_SEC:
            rec["count"] = 0
            rec["first"] = now
        rec["count"] += 1
        count = rec["count"]

    brute = count >= BRUTE_FORCE_LIMIT

    # 📧 ALERTE EMAIL - PIRATAGE
    if count == 3:
        # Première alerte modérée
        threading.Thread(target=send_security_alert, args=(
            f"3 tentatives de connexion échouées sur {email}",
            "ANOMALIE",
            {
                "Email ciblé": email,
                "IP attaquant": ip,
                "Navigateur": user_agent[:100],
                "Tentatives": f"{count}/{BRUTE_FORCE_LIMIT}",
                "Date/Heure": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
                "Statut": "🟡 SURVEILLANCE ACTIVE"
            }
        )).start()
    elif brute:
        # ALERTE CRITIQUE - PIRATAGE
        threading.Thread(target=send_security_alert, args=(
            f"PIRATAGE: {count} tentatives échouées sur {email}",
            "PIRATAGE",
            {
                "🎯 Email ciblé": email,
                "🌐 IP attaquant": ip,
                "💻 Navigateur": user_agent[:100],
                "🔢 Tentatives": f"{count} (seuil: {BRUTE_FORCE_LIMIT})",
                "⏰ Détection": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
                "🚨 Statut": "🔴 ATTAQUE EN COURS - ACTION URGENTE"
            }
        )).start()

    return jsonify({
        "attempts":    count,
        "brute_force": brute,
        "threshold":   BRUTE_FORCE_LIMIT,
        "alert_sent":  count >= 3
    })


# ═══════════════════════════════════════════════════════════════
# ENDPOINT: Tentative changement de rôle (privilege escalation)
# ═══════════════════════════════════════════════════════════════
@app.route("/role-change-attempt", methods=["POST"])
def role_change_attempt():
    """
    Détecte les tentatives de changement de rôle non autorisé.
    Exemple: Un Client qui essaie de devenir Admin.
    Envoie une alerte email immédiate.
    """
    data = request.get_json(silent=True) or {}
    email      = str(data.get("email", "unknown"))
    user_role  = str(data.get("currentRole", "unknown"))
    target_role = str(data.get("targetRole", "unknown"))
    ip         = str(data.get("ipAddress", "Inconnu"))
    user_agent = str(data.get("userAgent", "Inconnu"))

    # 📧 Alerte EMAIL immédiate
    threading.Thread(target=send_security_alert, args=(
        f"TENTATIVE DE PIRATAGE: Changement de rôle de {user_role} vers {target_role}",
        "ROLE_CHANGE",
        {
            "👤 Utilisateur": email,
            "🔐 Rôle actuel": user_role,
            "⚠️ Rôle demandé": target_role,
            "🌐 Adresse IP": ip,
            "💻 Navigateur": user_agent[:100],
            "⏰ Date/Heure": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "🚨 Sévérité": "🔴 CRITIQUE - Privilège Escalade"
        }
    )).start()

    return jsonify({
        "blocked": True,
        "alert_sent": True,
        "message": f"Tentative bloquée: {user_role} → {target_role}"
    })


# ═══════════════════════════════════════════════════════════════
# ENDPOINT: Connexion réussie (notification)
# ═══════════════════════════════════════════════════════════════
@app.route("/login-notify", methods=["POST"])
def login_notify():
    """
    Notification de connexion réussie.
    Envoie un email à aziz.hamadi.dev@gmail.com
    """
    data = request.get_json(silent=True) or {}
    email      = str(data.get("email", "unknown"))
    role       = str(data.get("role", "unknown"))
    ip         = str(data.get("ipAddress", "Inconnu"))
    user_agent = str(data.get("userAgent", "Inconnu"))

    # 📧 Notification email
    threading.Thread(target=send_security_alert, args=(
        f"Nouvelle connexion: {email}",
        "CONNEXION",
        {
            "👤 Utilisateur": email,
            "🔐 Rôle": role,
            "🌐 IP": ip,
            "💻 Navigateur": user_agent[:100],
            "⏰ Date/Heure": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "✅ Statut": "Connexion autorisée"
        }
    )).start()

    return jsonify({"notified": True})


# ═══════════════════════════════════════════════════════════════
# ENDPOINT: Test d'envoi email
# ═══════════════════════════════════════════════════════════════
@app.route("/test-email", methods=["GET"])
def test_email():
    """Test rapide de l'envoi email"""
    success = send_security_alert(
        "Test du système d'alertes sécurité",
        "CONNEXION",
        {
            "Type": "Test de fonctionnement",
            "Service": "SMART-TRADE 360° Risk Analyser",
            "Status": "✅ OPÉRATIONNEL"
        }
    )
    return jsonify({
        "email_sent": success,
        "recipient": EMAIL_CONFIG['recipient']
    })


# ── Réinitialise le compteur après un login réussi ───────────────────
@app.route("/login-success", methods=["POST"])
def login_success():
    data  = request.get_json(silent=True) or {}
    email = str(data.get("email", "unknown")).lower()
    with _lock:
        _failed_logins.pop(email, None)
    return jsonify({"reset": True})


# ── Health check ─────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":  "ok",
        "service": "ETAP Risk Analyser",
        "tracked_users": len(_user_actions),
        "tracked_ips":   len(_ip_actions),
    })


if __name__ == "__main__":
    print("🐍 ETAP Risk Analyser démarré sur http://localhost:5002")
    app.run(host="0.0.0.0", port=5002, debug=False, threaded=True)
