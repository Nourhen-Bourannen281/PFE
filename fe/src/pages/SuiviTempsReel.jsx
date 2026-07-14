import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function SuiviTempsReel() {
  const [livraisons, setLivraisons] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [activeTab, setActiveTab] = useState('suivi');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  // Intercepteur pour gérer les erreurs d'authentification
  api.interceptors.response.use(
    response => response,
    errorObj => {
      if (errorObj.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(errorObj);
    }
  );

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const fetchLivraisons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/livraisons');
      setLivraisons(res.data || []);
    } catch (error) {
      console.error('Erreur chargement livraisons:', error);
      addToast('Erreur de chargement des livraisons', 'error');
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchHistorique = useCallback(async (livraisonId) => {
    if (!livraisonId) return;
    try {
      setLoading(true);
      const res = await api.get(`/historique/entity/Livraison/${livraisonId}`);
      setHistorique(res.data || []);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      addToast('Erreur chargement historique', 'error');
      setHistorique([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (token) {
      fetchLivraisons();
    } else {
      addToast('Veuillez vous connecter', 'error');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  }, [token, fetchLivraisons]);

  const selectLivraison = async (livraison) => {
    setSelectedLivraison(livraison);
    await fetchHistorique(livraison._id);
    setActiveTab('historique');
  };

  const getEtatClass = (etat) => {
    switch(etat) {
      case 'À préparer': return 'status-preparer';
      case 'Prête': return 'status-prete';
      case 'En cours': return 'status-encours';
      case 'Livrée': return 'status-livree';
      default: return '';
    }
  };

  const getEtatIcon = (etat) => {
    switch(etat) {
      case 'À préparer': return '⏳';
      case 'Prête': return '✅';
      case 'En cours': return '🚚';
      case 'Livrée': return '📦';
      default: return '📄';
    }
  };

  const getProgressStepClass = (etat, step) => {
    const steps = ['À préparer', 'Prête', 'En cours', 'Livrée'];
    const currentIndex = steps.indexOf(etat);
    const stepIndex = steps.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return '';
  };

  const getProgressLineClass = (etat, stepIndex) => {
    const steps = ['À préparer', 'Prête', 'En cours', 'Livrée'];
    const currentIndex = steps.indexOf(etat);
    return stepIndex < currentIndex ? 'active' : '';
  };

  return (
    <div className="suivi-container">
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="toast-close">×</button>
          </div>
        ))}
      </div>

      <div className="header">
        <h1>🚚 Suivi des Livraisons</h1>
        <p>Suivi en temps réel et historique des actions</p>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'suivi' ? 'active' : ''}`} 
          onClick={() => {
            setActiveTab('suivi');
            setSelectedLivraison(null);
          }}
        >
          📍 Suivi en direct
        </button>
        <button 
          className={`tab ${activeTab === 'historique' ? 'active' : ''}`} 
          onClick={() => setActiveTab('historique')}
          disabled={!selectedLivraison}
        >
          📜 Historique des actions
        </button>
      </div>

      {activeTab === 'suivi' && (
        <div className="suivi-grid">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Chargement des livraisons...</p>
            </div>
          ) : livraisons.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚚</div>
              <h3>Aucune livraison</h3>
              <p>Aucune livraison en cours pour le moment</p>
            </div>
          ) : (
            livraisons.map(liv => (
              <div key={liv._id} className="suivi-card" onClick={() => selectLivraison(liv)}>
                <div className="card-header">
                  <span className="livraison-num">🔖 {liv.numeroLivraison || 'N/A'}</span>
                  <span className={`status-badge ${getEtatClass(liv.etat)}`}>
                    {getEtatIcon(liv.etat)} {liv.etat}
                  </span>
                </div>
                <div className="card-body">
                  <div className="info-row">
                    <label>📦 Commande:</label>
                    <span>{liv.commande?.numeroCommande || liv.commande?._id || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <label>🚛 Transporteur:</label>
                    <span>{liv.transporteur?.raisonSociale || liv.transporteur?.nom || 'Non assigné'}</span>
                  </div>
                  <div className="info-row">
                    <label>📅 Date création:</label>
                    <span>{liv.dateCreation ? new Date(liv.dateCreation).toLocaleDateString('fr-FR') : 'N/A'}</span>
                  </div>
                </div>
                
                {/* Barre de progression */}
                <div className="progress-bar">
                  <div className={`progress-step ${getProgressStepClass(liv.etat, 'À préparer')}`}>📝</div>
                  <div className={`progress-line ${getProgressLineClass(liv.etat, 0)}`}></div>
                  <div className={`progress-step ${getProgressStepClass(liv.etat, 'Prête')}`}>✅</div>
                  <div className={`progress-line ${getProgressLineClass(liv.etat, 1)}`}></div>
                  <div className={`progress-step ${getProgressStepClass(liv.etat, 'En cours')}`}>🚚</div>
                  <div className={`progress-line ${getProgressLineClass(liv.etat, 2)}`}></div>
                  <div className={`progress-step ${getProgressStepClass(liv.etat, 'Livrée')}`}>📦</div>
                </div>
                <div className="progress-labels">
                  <span>À préparer</span>
                  <span>Prête</span>
                  <span>En cours</span>
                  <span>Livrée</span>
                </div>
                
                <button 
                  className="btn-details" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    selectLivraison(liv); 
                  }}
                >
                  Voir historique →
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'historique' && (
        <div className="historique-section">
          <div className="historique-header">
            <h2>
              <button className="btn-back-icon" onClick={() => setActiveTab('suivi')}>←</button>
              Historique - {selectedLivraison?.numeroLivraison || 'Livraison'}
            </h2>
            <button className="btn-back" onClick={() => setActiveTab('suivi')}>Retour à la liste</button>
          </div>
          
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Chargement de l'historique...</p>
            </div>
          ) : historique.length === 0 ? (
            <div className="empty-timeline">
              <div className="empty-icon">📜</div>
              <p>Aucun historique disponible pour cette livraison</p>
            </div>
          ) : (
            <div className="timeline">
              {historique.map((h, index) => (
                <div key={h._id || index} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-date">
                      📅 {new Date(h.dateAction).toLocaleString('fr-FR')}
                    </div>
                    <div className="timeline-action">
                      <span className="action-badge">{h.action || 'Action'}</span>
                      {h.ancienStatut && h.nouveauStatut && (
                        <span> de <strong>{h.ancienStatut}</strong> → <strong>{h.nouveauStatut}</strong></span>
                      )}
                    </div>
                    <div className="timeline-user">
                      👤 Par: {h.utilisateur?.nom || h.utilisateur?.prenom || 'Système'}
                    </div>
                    {h.details && (
                      <div className="timeline-details">
                        📝 {h.details}
                      </div>
                    )}
                  </div>
                  {index < historique.length - 1 && <div className="timeline-line"></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .suivi-container { 
          padding: 20px; 
          max-width: 1400px; 
          margin: 0 auto; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .header { 
          margin-bottom: 30px; 
          text-align: center;
        }
        .header h1 { 
          color: #2c3e50; 
          margin-bottom: 10px;
        }
        .header p { 
          color: #7f8c8d; 
        }
        .tabs { 
          display: flex; 
          gap: 10px; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #e0e0e0; 
          justify-content: center;
        }
        .tab { 
          padding: 12px 24px; 
          background: none; 
          border: none; 
          cursor: pointer; 
          font-size: 16px;
          font-weight: 500;
          transition: all 0.3s;
        }
        .tab:hover { 
          color: #3498db; 
        }
        .tab.active { 
          color: #3498db; 
          border-bottom: 3px solid #3498db; 
        }
        .tab:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .suivi-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); 
          gap: 25px; 
        }
        .suivi-card { 
          background: white; 
          border-radius: 16px; 
          padding: 20px; 
          box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
          cursor: pointer; 
          transition: transform 0.3s, box-shadow 0.3s; 
        }
        .suivi-card:hover { 
          transform: translateY(-5px); 
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        .card-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          margin-bottom: 15px; 
          flex-wrap: wrap;
          gap: 10px;
        }
        .livraison-num { 
          font-weight: bold; 
          font-size: 18px;
          color: #2c3e50;
        }
        .status-badge { 
          padding: 5px 12px; 
          border-radius: 20px; 
          font-size: 12px; 
          font-weight: 500;
        }
        .status-preparer { background: #fef3e2; color: #f39c12; }
        .status-prete { background: #e3f2fd; color: #3498db; }
        .status-encours { background: #e8f5e9; color: #27ae60; }
        .status-livree { background: #d5f5e3; color: #1e8449; }
        .card-body { 
          margin: 15px 0; 
        }
        .info-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 10px; 
          font-size: 14px; 
        }
        .info-row label { 
          color: #7f8c8d; 
          font-weight: 500;
        }
        .progress-bar { 
          display: flex; 
          align-items: center; 
          margin: 20px 0 10px; 
        }
        .progress-step { 
          width: 36px; 
          height: 36px; 
          background: #ecf0f1; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 16px;
          transition: all 0.3s;
        }
        .progress-step.active { 
          background: #3498db; 
          color: white; 
          transform: scale(1.1);
        }
        .progress-step.completed { 
          background: #27ae60; 
          color: white; 
        }
        .progress-line { 
          flex: 1; 
          height: 3px; 
          background: #ecf0f1; 
          margin: 0 5px;
          transition: all 0.3s;
        }
        .progress-line.active { 
          background: #27ae60; 
        }
        .progress-labels { 
          display: flex; 
          justify-content: space-between; 
          font-size: 10px; 
          color: #7f8c8d; 
          margin-bottom: 20px; 
        }
        .btn-details { 
          width: 100%; 
          padding: 10px; 
          background: #3498db; 
          color: white; 
          border: none; 
          border-radius: 8px; 
          cursor: pointer; 
          font-size: 14px;
          font-weight: 500;
          transition: background 0.3s;
        }
        .btn-details:hover { 
          background: #2980b9; 
        }
        .historique-section { 
          background: white; 
          border-radius: 16px; 
          padding: 25px; 
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .historique-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 25px;
          flex-wrap: wrap;
          gap: 15px;
        }
        .historique-header h2 {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #2c3e50;
        }
        .btn-back-icon {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #3498db;
          padding: 0 10px;
        }
        .btn-back { 
          padding: 8px 20px; 
          background: #95a5a6; 
          color: white; 
          border: none; 
          border-radius: 8px; 
          cursor: pointer; 
          transition: background 0.3s;
        }
        .btn-back:hover { 
          background: #7f8c8d; 
        }
        .timeline { 
          position: relative; 
          padding-left: 30px; 
        }
        .timeline-item { 
          position: relative; 
          margin-bottom: 20px; 
        }
        .timeline-dot { 
          position: absolute; 
          left: -25px; 
          top: 5px; 
          width: 12px; 
          height: 12px; 
          background: #3498db; 
          border-radius: 50%; 
          border: 2px solid white;
          box-shadow: 0 0 0 2px #3498db;
        }
        .timeline-line { 
          position: absolute; 
          left: -19px; 
          top: 20px; 
          width: 2px; 
          height: calc(100% - 10px); 
          background: #e0e0e0; 
        }
        .timeline-content { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 12px; 
          transition: background 0.3s;
        }
        .timeline-content:hover {
          background: #f0f2f5;
        }
        .timeline-date { 
          font-size: 12px; 
          color: #7f8c8d; 
          margin-bottom: 8px; 
        }
        .timeline-action { 
          font-size: 14px; 
          margin-bottom: 8px; 
        }
        .action-badge { 
          background: #3498db; 
          color: white; 
          padding: 3px 10px; 
          border-radius: 5px; 
          font-size: 11px; 
          font-weight: 500;
          margin-right: 10px;
          display: inline-block;
        }
        .timeline-user {
          font-size: 12px;
          color: #7f8c8d;
          margin-top: 8px;
        }
        .timeline-details {
          font-size: 12px;
          color: #7f8c8d;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e0e0e0;
        }
        .loading {
          text-align: center;
          padding: 50px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e0e0e0;
          border-top-color: #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .empty-state, .empty-timeline {
          text-align: center;
          padding: 60px 20px;
          background: #f8f9fa;
          border-radius: 16px;
        }
        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        .toast-container { 
          position: fixed; 
          top: 20px; 
          right: 20px; 
          z-index: 1100; 
        }
        .toast { 
          background: white; 
          padding: 12px 20px; 
          margin: 5px; 
          border-radius: 8px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          gap: 20px;
          min-width: 250px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .toast.success { 
          border-left: 4px solid #27ae60; 
          background: #f0fff4;
        }
        .toast.error { 
          border-left: 4px solid #e74c3c; 
          background: #fff5f5;
        }
        .toast-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #95a5a6;
          transition: color 0.3s;
        }
        .toast-close:hover {
          color: #e74c3c;
        }
        @media (max-width: 768px) {
          .suivi-container { padding: 15px; }
          .suivi-grid { grid-template-columns: 1fr; }
          .tabs { flex-direction: column; align-items: center; }
          .progress-labels span { font-size: 8px; }
          .progress-step { width: 28px; height: 28px; font-size: 12px; }
        }
      `}</style>
    </div>
  );
}

export default SuiviTempsReel;