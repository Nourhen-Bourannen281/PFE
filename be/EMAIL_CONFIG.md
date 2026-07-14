# 📧 Configuration des Alertes Email

## 🔧 Setup Gmail App Password

Pour envoyer des emails depuis votre compte Gmail, vous devez créer un **App Password**:

### Étapes:

1. **Activer la 2FA** sur votre compte Gmail (aziz.hamadi.dev@gmail.com)
   - https://myaccount.google.com/security
   - Activer "Validation en 2 étapes"

2. **Créer un App Password**:
   - https://myaccount.google.com/apppasswords
   - Sélectionner "Mail" et "Autre (nom personnalisé)"
   - Entrer "ETAP Backend"
   - **Copier le mot de passe 16 caractères** (ex: `abcd efgh ijkl mnop`)

3. **Configurer dans `.env`**:

Créez/modifiez le fichier `C:\Users\ghfririna\pfe (3)\pfe\be\.env`:

```env
# MongoDB
MONGO_URI=mongodb+srv://pfe_user:pfe123456!@cluster0.j9gyxdb.mongodb.net/pfe?retryWrites=true&w=majority

# JWT
JWT_SECRET=votre_secret_jwt_ici

# Email - Alertes Sécurité
EMAIL_SERVICE=gmail
EMAIL_USER=aziz.hamadi.dev@gmail.com
EMAIL_PASS=abcdefghijklmnop
# ⬆️ Remplacer par votre App Password Gmail (16 caractères sans espaces)
```

4. **Redémarrer le backend**:
```bash
npm start
```

---

## 📧 Alertes envoyées automatiquement

### 1. ✅ Connexion Réussie
**Quand:** Chaque fois qu'un utilisateur se connecte avec succès
**Email:** aziz.hamadi.dev@gmail.com
**Sujet:** "🔓 Nouvelle connexion détectée - ETAP"

**Contient:**
- Email de l'utilisateur connecté
- Adresse IP
- Localisation
- Navigateur (user-agent)
- Date / heure exacte
- Statut: ✅ RÉUSSIE

### 2. ⚠️ Tentative Échouée (1-2 essais)
**Quand:** Mot de passe incorrect (moins de 3 fois)
**Sujet:** "🚨 ALERTE: Tentative de connexion échouée - ETAP"

### 3. 🚨 PIRATAGE CRITIQUE (3+ essais)
**Quand:** 3 tentatives échouées ou plus
**Sujet:** "🚨 PIRATAGE: X tentatives échouées sur email@example.com"
**Priorité:** HIGH (notification urgente)

**Contient:**
- Compte ciblé
- IP de l'attaquant (en rouge)
- Navigateur utilisé
- Heure de détection
- 5 actions immédiates recommandées

---

## 🧪 Tester l'envoi d'email

Une fois configuré, testez en:

1. **Connexion réussie**: Connectez-vous à l'app → Vérifiez votre boîte mail ✅
2. **Tentative échouée**: Entrez un mauvais mot de passe → Email reçu ⚠️
3. **Simulation piratage**: Entrez 3+ mauvais mots de passe → Alerte CRITIQUE 🚨

---

## 🛡️ Sécurité

- ✅ App Password est plus sécurisé que le mot de passe principal
- ✅ Peut être révoqué à tout moment depuis Google
- ✅ Limité à l'application "ETAP Backend"
- ✅ Ne donne pas accès à la 2FA ni au compte Google
