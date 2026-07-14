

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/ForgotPassword.css';

// ═══════════════════════════════════════════════════════════════
// 🔧 CONFIGURATION
// ═══════════════════════════════════════════════════════════════
const DEMO_MODE = false; // ❌ Mode démo désactivé - utilise le backend réel
const API_BASE_URL = 'http://localhost:5001/api/auth';
const DEMO_CODE = '123456'; // Code de test en mode démo

const ForgotPassword = () => {
  // ==================== STATES ====================
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [appState, setAppState] = useState({
    step: 1, // 1: email, 2: code, 3: password
    loading: false,
    showPassword: false,
    error: '',
    success: '',
    resetToken: '',
    demoMode: DEMO_MODE, // Afficher en mode démo
    sentTo: '' // Email auquel le code a été envoyé
  });

  const [validation, setValidation] = useState({
    emailError: '',
    codeError: '',
    passwordError: '',
    confirmPasswordError: ''
  });

  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  // ==================== TIMER RESEND CODE ====================
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // ==================== VALIDATIONS ====================

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email requis';
    if (!emailRegex.test(email)) return 'Email invalide';
    return '';
  };

  const validateCode = (code) => {
    if (!code) return 'Code requis';
    if (!/^\d{6}$/.test(code)) return 'Code invalide (6 chiffres)';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Mot de passe requis';
    if (password.length < 8) return 'Minimum 8 caractères';
    if (!/[A-Z]/.test(password)) return 'Une lettre majuscule requise';
    if (!/[a-z]/.test(password)) return 'Une lettre minuscule requise';
    if (!/[0-9]/.test(password)) return 'Un chiffre requis';
    if (!/[!@#$%^&*]/.test(password)) return 'Un caractère spécial requis (!@#$%^&*)';
    return '';
  };

  const validateConfirmPassword = (password, confirm) => {
    if (!confirm) return 'Confirmation requise';
    if (password !== confirm) return 'Les mots de passe ne correspondent pas';
    return '';
  };

  // ==================== GESTION DU FORMULAIRE ====================

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setAppState(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      // Format spécifique pour le code
      if (name === 'code') {
        const numericValue = value.replace(/\D/g, '').slice(0, 6);
        setFormData(prev => ({
          ...prev,
          [name]: numericValue
        }));
        setValidation(prev => ({ ...prev, codeError: '' }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }

      // Nettoyer les erreurs
      if (name === 'email') {
        setValidation(prev => ({ ...prev, emailError: '' }));
      }
      if (name === 'newPassword') {
        setValidation(prev => ({ ...prev, passwordError: '' }));
      }
      if (name === 'confirmPassword') {
        setValidation(prev => ({ ...prev, confirmPasswordError: '' }));
      }
    }

    // Nettoyer les messages d'alerte
    setAppState(prev => ({
      ...prev,
      error: '',
      success: ''
    }));
  };

  const showAlert = (type, message, duration = 4000) => {
    if (type === 'success') {
      setAppState(prev => ({ ...prev, success: message }));
    } else {
      setAppState(prev => ({ ...prev, error: message }));
    }

    if (duration) {
      setTimeout(() => {
        setAppState(prev => ({
          ...prev,
          [type === 'success' ? 'success' : 'error']: ''
        }));
      }, duration);
    }
  };

  // ==================== ÉTAPE 1: ENVOYER EMAIL ====================

  const handleSendEmail = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(formData.email);
    if (emailError) {
      setValidation(prev => ({ ...prev, emailError }));
      return;
    }

    setAppState(prev => ({ ...prev, loading: true }));

    try {
      const emailLower = formData.email.toLowerCase().trim();
      console.log('📧 Envoi du code de réinitialisation pour:', emailLower);

      if (DEMO_MODE) {
        console.log(`✅ Code de vérification simulé:`);
        console.log(`📬 Email envoyé à: ${emailLower}`);

        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 1500));

        showAlert('success', `✓ Code envoyé à ${emailLower}`);

        setAppState(prev => ({
          ...prev,
          resetToken: 'demo-token-' + Date.now(),
          sentTo: emailLower,
          step: 2
        }));

        setResendTimer(60);
      } else {
        // ✅ MODE RÉEL: Appel API au backend
        const response = await axios.post(
          `${API_BASE_URL}/forgot-password`,
          {
            email: emailLower
          },
          {
            timeout: 10000 // 10 secondes timeout
          }
        );

        console.log('✅ Code envoyé avec succès');
        showAlert('success', `✓ Code envoyé à ${emailLower}`);

        if (response.data.resetToken) {
          setAppState(prev => ({
            ...prev,
            resetToken: response.data.resetToken,
            sentTo: emailLower
          }));
        }

        setTimeout(() => {
          setAppState(prev => ({ ...prev, step: 2 }));
          setResendTimer(60);
        }, 1500);
      }

    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      
      if (error.code === 'ECONNABORTED') {
        showAlert('error', '⏱️ Timeout: Le serveur ne répond pas. Vérifiez que votre backend est en cours d\'exécution.');
      } else if (error.response?.status === 404) {
        showAlert('error', '❌ Email non trouvé dans le système');
      } else if (error.response?.status === 500) {
        showAlert('error', '⚙️ Erreur serveur. Vérifiez la configuration du backend.');
      } else {
        const errorMessage = error.response?.data?.message || 'Erreur de connexion au serveur';
        showAlert('error', errorMessage);
      }
    } finally {
      setAppState(prev => ({ ...prev, loading: false }));
    }
  };

  // ==================== ÉTAPE 2: VÉRIFIER CODE ====================

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    const codeError = validateCode(formData.code);
    if (codeError) {
      setValidation(prev => ({ ...prev, codeError }));
      return;
    }

    setAppState(prev => ({ ...prev, loading: true }));

    try {
      console.log('✓ Vérification du code:', formData.code);

      if (DEMO_MODE) {
        // ✅ MODE DÉMO: Vérifier le code de test
        console.log('🎭 Vérification en mode démo');

        if (formData.code !== DEMO_CODE) {
          throw new Error(`Code invalide. Code correct: ${DEMO_CODE}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✅ Code vérifié avec succès');
        showAlert('success', '✓ Code vérifié avec succès');

        setTimeout(() => {
          setAppState(prev => ({ ...prev, step: 3 }));
        }, 1500);
      } else {
        // ✅ MODE RÉEL
        await axios.post(
          `${API_BASE_URL}/verify-reset-code`,
          {
            email: formData.email.toLowerCase().trim(),
            code: formData.code,
            resetToken: appState.resetToken
          }
        );

        console.log('✅ Code vérifié avec succès');
        showAlert('success', '✓ Code vérifié avec succès');

        setTimeout(() => {
          setAppState(prev => ({ ...prev, step: 3 }));
        }, 1500);
      }

    } catch (error) {
      console.error('❌ Erreur vérification code:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Code invalide ou expiré';
      showAlert('error', errorMessage);
    } finally {
      setAppState(prev => ({ ...prev, loading: false }));
    }
  };

  // ==================== ÉTAPE 3: RÉINITIALISER PASSWORD ====================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const passwordError = validatePassword(formData.newPassword);
    const confirmPasswordError = validateConfirmPassword(
      formData.newPassword,
      formData.confirmPassword
    );

    if (passwordError || confirmPasswordError) {
      setValidation(prev => ({
        ...prev,
        passwordError,
        confirmPasswordError
      }));
      return;
    }

    setAppState(prev => ({ ...prev, loading: true }));

    try {
      console.log('🔄 Réinitialisation du mot de passe');

      if (DEMO_MODE) {
        // ✅ MODE DÉMO: Simuler la réinitialisation
        console.log('🎭 Réinitialisation en mode démo');
        console.log('📝 Nouveau mot de passe:', '••••••••');

        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log('✅ Mot de passe réinitialisé avec succès');
        showAlert('success', '✓ Mot de passe réinitialisé avec succès');

        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } else {
        // ✅ MODE RÉEL
        await axios.post(
          `${API_BASE_URL}/reset-password`,
          {
            email: formData.email.toLowerCase().trim(),
            code: formData.code,
            newPassword: formData.newPassword,
            resetToken: appState.resetToken
          }
        );

        console.log('✅ Mot de passe réinitialisé avec succès');
        showAlert('success', '✓ Mot de passe réinitialisé avec succès');

        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }

    } catch (error) {
      console.error('❌ Erreur réinitialisation:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la réinitialisation';
      showAlert('error', errorMessage);
    } finally {
      setAppState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setAppState(prev => ({ ...prev, loading: true }));

    try {
      console.log('📧 Renvoi du code');

      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`🎭 Code renvoyé (DÉMO): ${DEMO_CODE}`);
        showAlert('success', `✓ Code renvoyé (DÉMO: ${DEMO_CODE})`);
      } else {
        await axios.post(
          `${API_BASE_URL}/forgot-password`,
          {
            email: formData.email.toLowerCase().trim()
          }
        );
        showAlert('success', '✓ Code renvoyé à votre email');
      }

      setResendTimer(60);

    } catch (error) {
      console.error('❌ Erreur renvoi code:', error);
      showAlert('error', 'Erreur lors de l\'envoi du code');
    } finally {
      setAppState(prev => ({ ...prev, loading: false }));
    }
  };

  const handlePreviousStep = () => {
    setAppState(prev => ({
      ...prev,
      step: prev.step - 1,
      error: '',
      success: ''
    }));
    setFormData(prev => ({
      ...prev,
      code: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  return (
    <div className="forgot-container">
      

      {/* Ajuster le padding du conteneur en mode démo */}
      {appState.demoMode && <div style={{ height: '50px' }} />}

      {/* ========== NOTIFICATIONS ========== */}
      {appState.error && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">✗</span>
          <span className="alert-message">{appState.error}</span>
          <button
            className="alert-close"
            onClick={() => setAppState(prev => ({ ...prev, error: '' }))}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      )}

      {appState.success && (
        <div className="alert alert-success" role="alert">
          <span className="alert-icon">✓</span>
          <span className="alert-message">{appState.success}</span>
        </div>
      )}

      {/* ========== SECTION GAUCHE ========== */}
      <div className="forgot-left">
        <div className="forgot-content">
          <div className="forgot-icon-wrapper">
            <div className="forgot-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v4l3 2" />
              </svg>
            </div>
          </div>

          <div className="forgot-heading">
            <h1>Réinitialisation</h1>
            <p>Récupérez l'accès à votre compte en 3 étapes</p>
          </div>

          <div className="forgot-steps">
            <div className={`step-indicator ${appState.step >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <p className="step-text">Email</p>
            </div>

            <div className={`step-line ${appState.step >= 2 ? 'active' : ''}`}></div>

            <div className={`step-indicator ${appState.step >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <p className="step-text">Vérification</p>
            </div>

            <div className={`step-line ${appState.step >= 3 ? 'active' : ''}`}></div>

            <div className={`step-indicator ${appState.step >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <p className="step-text">Nouveau MDP</p>
            </div>
          </div>

          <div className="forgot-left-footer">
            <p className="copyright">© 2026 SMART-TRADE 360°. Tous droits réservés.</p>
          </div>
        </div>
      </div>

      {/* ========== SECTION DROITE ========== */}
      <div className="forgot-right">
        <div className="forgot-card">
          
          {/* ========== ÉTAPE 1: EMAIL ========== */}
          {appState.step === 1 && (
            <>
              <div className="forgot-header">
                <h2>Mot de passe oublié ?</h2>
                <p>Entrez votre email pour recevoir un code de réinitialisation</p>
              </div>

              <form onSubmit={handleSendEmail} className="forgot-form" noValidate>
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
                      aria-label="Email"
                      aria-describedby={validation.emailError ? "email-error" : undefined}
                    />
                  </div>
                  {validation.emailError && (
                    <span className="error-message" id="email-error">
                      {validation.emailError}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-forgot"
                  disabled={appState.loading}
                  aria-busy={appState.loading}
                >
                  {appState.loading ? (
                    <>
                      <span className="spinner"></span>
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Envoyer le code</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* ========== ÉTAPE 2: VÉRIFICATION CODE ========== */}
          {appState.step === 2 && (
            <>
              <div className="forgot-header">
                <h2>Code de vérification</h2>
                <p>Entrez le code reçu par email à <strong>{appState.sentTo}</strong></p>
              </div>

              <form onSubmit={handleVerifyCode} className="forgot-form" noValidate>
                <div className="form-group">
                  <label htmlFor="code" className="form-label">Code à 6 chiffres</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1v22M1 12h22" />
                      </svg>
                    </span>
                    <input
                      id="code"
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="000000"
                      className={`form-input code-input ${validation.codeError ? 'input-error' : ''}`}
                      maxLength={6}
                      required
                      inputMode="numeric"
                      aria-label="Code de vérification"
                      aria-describedby={validation.codeError ? "code-error" : undefined}
                    />
                  </div>
                  {validation.codeError && (
                    <span className="error-message" id="code-error">
                      {validation.codeError}
                    </span>
                  )}
                </div>

                <div className="resend-section">
                  <button
                    type="button"
                    className="resend-btn"
                    onClick={handleResendCode}
                    disabled={resendTimer > 0 || appState.loading}
                  >
                    {resendTimer > 0 ? (
                      <>Renvoyer dans {resendTimer}s</>
                    ) : (
                      <>📧 Renvoyer le code</>
                    )}
                  </button>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handlePreviousStep}
                  >
                    ← Retour
                  </button>
                  <button
                    type="submit"
                    className="btn-forgot"
                    disabled={appState.loading}
                    aria-busy={appState.loading}
                  >
                    {appState.loading ? (
                      <>
                        <span className="spinner"></span>
                        <span>Vérification...</span>
                      </>
                    ) : (
                      <>
                        <span>Vérifier</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ========== ÉTAPE 3: NOUVEAU MOT DE PASSE ========== */}
          {appState.step === 3 && (
            <>
              <div className="forgot-header">
                <h2>Nouveau mot de passe</h2>
                <p>Créez un mot de passe sécurisé (min 8 caractères)</p>
              </div>

              <div className="password-requirements">
                <p className="req-title">Votre mot de passe doit contenir:</p>
                <ul className="req-list">
                  <li className={formData.newPassword.length >= 8 ? 'met' : ''}>
                    <span>✓</span> Au moins 8 caractères
                  </li>
                  <li className={/[A-Z]/.test(formData.newPassword) ? 'met' : ''}>
                    <span>✓</span> Une lettre majuscule (A-Z)
                  </li>
                  <li className={/[a-z]/.test(formData.newPassword) ? 'met' : ''}>
                    <span>✓</span> Une lettre minuscule (a-z)
                  </li>
                  <li className={/[0-9]/.test(formData.newPassword) ? 'met' : ''}>
                    <span>✓</span> Un chiffre (0-9)
                  </li>
                  <li className={/[!@#$%^&*]/.test(formData.newPassword) ? 'met' : ''}>
                    <span>✓</span> Un caractère spécial (!@#$%^&*)
                  </li>
                </ul>
              </div>

              <form onSubmit={handleResetPassword} className="forgot-form" noValidate>
                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">Nouveau mot de passe</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="newPassword"
                      type={appState.showPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className={`form-input ${validation.passwordError ? 'input-error' : ''}`}
                      required
                      aria-label="Nouveau mot de passe"
                      aria-describedby={validation.passwordError ? "password-error" : undefined}
                    />
                  </div>
                  {validation.passwordError && (
                    <span className="error-message" id="password-error">
                      {validation.passwordError}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">Confirmer le mot de passe</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="confirmPassword"
                      type={appState.showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className={`form-input ${validation.confirmPasswordError ? 'input-error' : ''}`}
                      required
                      aria-label="Confirmer le mot de passe"
                      aria-describedby={validation.confirmPasswordError ? "confirm-error" : undefined}
                    />
                  </div>
                  {validation.confirmPasswordError && (
                    <span className="error-message" id="confirm-error">
                      {validation.confirmPasswordError}
                    </span>
                  )}
                </div>

                <div className="form-options">
                  <label className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      name="showPassword"
                      checked={appState.showPassword}
                      onChange={handleInputChange}
                      className="checkbox-input"
                    />
                    <span className="checkbox-label-text">Afficher les mots de passe</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handlePreviousStep}
                  >
                    ← Retour
                  </button>
                  <button
                    type="submit"
                    className="btn-forgot"
                    disabled={appState.loading}
                    aria-busy={appState.loading}
                  >
                    {appState.loading ? (
                      <>
                        <span className="spinner"></span>
                        <span>Réinitialisation...</span>
                      </>
                    ) : (
                      <>
                        <span>Réinitialiser</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2-8.83" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="forgot-footer">
            <Link to="/login" className="back-link">
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;