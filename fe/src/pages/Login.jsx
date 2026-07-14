/**
 * Composant Login - Version finale améliorée
 * Authentification sécurisée avec validation et gestion d'erreurs
 * + Liens navigation (Landing & Forgot Password)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import '../css/Login.css';
import logoTap from '../assets/logo-etap.png';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [formState, setFormState] = useState({
    loading: false,
    showPassword: false,
    rememberMe: false,
    error: '',
    success: ''
  });

  const [validation, setValidation] = useState({
    emailError: '',
    passwordError: ''
  });

  const navigate = useNavigate();
  const location = useLocation();

  // ==================== REDIRECTION SI AUTHENTIFIÉ ====================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // ==================== CHARGER EMAIL MÉMORISÉ ====================
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setFormState(prev => ({ ...prev, rememberMe: true }));
    }
  }, []);

  // ==================== VALIDATIONS ====================

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email requis';
    if (!emailRegex.test(email)) return 'Email invalide';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Mot de passe requis';
    if (password.length < 6) return 'Minimum 6 caractères';
    return '';
  };

  // ==================== GESTION DES INPUTS ====================

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;

    if (type === 'checkbox') {
      setFormState(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'email') setValidation(prev => ({ ...prev, emailError: '' }));
      if (name === 'password') setValidation(prev => ({ ...prev, passwordError: '' }));
    }

    setFormState(prev => ({ ...prev, error: '', success: '' }));
  };

  // ==================== AFFICHER ALERTES ====================

  const showAlert = (type, message, duration = 4000) => {
    setFormState(prev => ({
      ...prev,
      [type === 'success' ? 'success' : 'error']: message
    }));
    setTimeout(() => {
      setFormState(prev => ({
        ...prev,
        [type === 'success' ? 'success' : 'error']: ''
      }));
    }, duration);
  };

  // ==================== REDIRECTION PAR RÔLE ====================

  const redirectByRole = (role) => {
    const roleRoutes = {
      'Admin': '/dashboard',
      'Commercial': '/commercial-dashboard',
      'Client': '/client-dashboard',
      'Fournisseur': '/fournisseur-dashboard',
      'Transporteur': '/transporteur-dashboard'
    };
    const redirectPath = roleRoutes[role] || '/dashboard';
    const from = location.state?.from?.pathname || redirectPath;
    navigate(from, { replace: true });
  };

  // ==================== SOUMISSION FORMULAIRE ====================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setValidation({ emailError, passwordError });
      return;
    }

    setFormState(prev => ({ ...prev, loading: true }));

    try {
      console.log('🔄 Tentative de connexion:', formData.email);

      // ✅ Appel API avec le champ "motDePasse"
      const response = await axios.post(
        'http://localhost:5001/api/auth/login',
        {
          email: formData.email.toLowerCase().trim(),
          motDePasse: formData.password   // ← Champ motDePasse
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { token, user } = response.data;

      if (!token || typeof token !== 'string') {
        throw new Error('Token non reçu du serveur');
      }

      // ✅ Nettoyage du token
      const cleanToken = token.trim().replace(/^Bearer\s+/i, '');
      localStorage.setItem('token', cleanToken);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', user.role);
      localStorage.setItem('tokenExpires', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

      // ✅ Mémoriser l'email si coché
      if (formState.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      console.log('✅ Connexion réussie pour:', user.email);
      showAlert('success', 'Connexion réussie !');

      setTimeout(() => {
        redirectByRole(user.role);
      }, 1000);

    } catch (error) {
      console.error('❌ Erreur de connexion:', error);

      let errorMessage = 'Email ou mot de passe incorrect';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Identifiants invalides';
      } else if (error.response?.status === 403) {
        errorMessage = 'Compte désactivé. Contactez l\'administrateur.';
      } else if (error.message === 'Network Error') {
        errorMessage = 'Erreur réseau. Vérifiez votre connexion.';
      }

      showAlert('error', errorMessage);
    } finally {
      setFormState(prev => ({ ...prev, loading: false }));
    }
  };

  // ==================== AFFICHER/MASQUER MOT DE PASSE ====================

  const togglePasswordVisibility = () => {
    setFormState(prev => ({ ...prev, showPassword: !prev.showPassword }));
  };

  // ==================== JSX ====================

  return (
    <div className="login-container">
      
      {/* ========== NOTIFICATIONS ========== */}
      {formState.error && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">✗</span>
          <span className="alert-message">{formState.error}</span>
          <button
            className="alert-close"
            onClick={() => setFormState(prev => ({ ...prev, error: '' }))}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      )}

      {formState.success && (
        <div className="alert alert-success" role="alert">
          <span className="alert-icon">✓</span>
          <span className="alert-message">{formState.success}</span>
        </div>
      )}

      {/* ========== SECTION GAUCHE ========== */}
      <div className="login-left">
        <div className="login-content">
          
          {/* Logo */}
          <div className="login-logo">
            <img src={logoTap} alt="Logo SMART-TRADE 360°" className="logo-image" />
            <div className="logo-text">
              <h1>SMART-TRADE 360°</h1>
              <p className="logo-subtitle">Entreprise Tunisienne d'Activités Pétrolières</p>
            </div>
          </div>

          {/* Tagline */}
          <div className="login-tagline">
            <h2>Gestion Intégrée</h2>
            <p>Gérez vos opérations gaz avec précision et efficacité</p>
          </div>

          {/* Fonctionnalités */}
          <div className="login-features">
            <div className="feature-item">
              <div className="feature-icon">📦</div>
              <div>
                <h3>Gestion des stocks</h3>
                <p>Suivi en temps réel de vos inventaires</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📋</div>
              <div>
                <h3>Suivi des commandes</h3>
                <p>Gestion complète des contrats de vente</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div>
                <h3>Analytics avancée</h3>
                <p>Tableau de bord et rapports détaillés</p>
              </div>
            </div>
          </div>

          {/* Footer gauche */}
          <div className="login-left-footer">
            <p className="copyright">© 2026 SMART-TRADE 360°. Tous droits réservés.</p>
          </div>
        </div>
      </div>

      {/* ========== SECTION DROITE ========== */}
      <div className="login-right">
        <div className="login-card">
          
          {/* En-tête */}
          <div className="login-header">
            <h2>Bienvenue</h2>
            <p>Connectez-vous à votre compte SMART-TRADE 360°</p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Adresse email</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="votre@email.com"
                  className={`form-input ${validation.emailError ? 'input-error' : ''}`}
                  required
                  aria-label="Adresse email"
                  aria-describedby={validation.emailError ? "email-error" : undefined}
                />
              </div>
              {validation.emailError && (
                <span className="error-message" id="email-error">{validation.emailError}</span>
              )}
            </div>

            {/* Mot de passe */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Mot de passe</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={formState.showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`form-input ${validation.passwordError ? 'input-error' : ''}`}
                  required
                  aria-label="Mot de passe"
                  aria-describedby={validation.passwordError ? "password-error" : undefined}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={togglePasswordVisibility}
                  aria-label={formState.showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  tabIndex="-1"
                >
                  {formState.showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validation.passwordError && (
                <span className="error-message" id="password-error">{validation.passwordError}</span>
              )}
            </div>

            {/* Options */}
            <div className="form-options">
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formState.rememberMe}
                  onChange={handleInputChange}
                  className="checkbox-input"
                />
                <span className="checkbox-label-text">Se souvenir de moi</span>
              </label>
              <Link to="/forgot-password" className="forgot-password-link">
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Bouton soumettre */}
            <button
              type="submit"
              className="btn-login"
              disabled={formState.loading}
              aria-busy={formState.loading}
            >
              {formState.loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* ========== FOOTER AVEC LIENS ========== */}
          <div className="login-footer">
            <div className="footer-links">
              <Link to="/" className="footer-link home-link" title="Retour à l'accueil">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Accueil</span>
              </Link>

              <div className="footer-divider">•</div>

              <Link to="/forgot-password" className="footer-link forgot-link" title="Réinitialiser votre mot de passe">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span>Mot de passe oublié ?</span>
              </Link>
            </div>

            <p className="footer-note">
              Besoin d'aide ? <a href="mailto:support@SMART-TRADE 360°.tn" className="contact-link">Contactez-nous</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;