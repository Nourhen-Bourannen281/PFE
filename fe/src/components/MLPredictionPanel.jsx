// ═══════════════════════════════════════════════════════════════
// MLPredictionPanel.jsx - Panel ML pour Dashboard Transporteur
// ═══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import { delayPredictor, riskClassifier, transporteurClustering } from '../services/mlService';

function MLPredictionPanel({ livraisons = [] }) {
  const [isTraining, setIsTraining] = useState(false);
  const [modelTrained, setModelTrained] = useState(false);
  const [trainingMetrics, setTrainingMetrics] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState(null);

  // Entraîner les modèles
  const trainModels = useCallback(async () => {
    if (livraisons.length < 5) {
      setError('Au moins 5 livraisons "Livrée" requises pour entraîner');
      return;
    }

    setIsTraining(true);
    setError(null);

    try {
      // 1. Entraîner le prédicteur de délai (TensorFlow.js)
      console.log('🧠 Training Neural Network...');
      const delayMetrics = await delayPredictor.train(livraisons, 100);

      // 2. Entraîner le classificateur KNN
      console.log('📚 Training KNN Classifier...');
      const knnCount = riskClassifier.train(livraisons);

      // 3. Clustering des transporteurs
      const transpData = livraisons
        .filter(l => l.transporteur)
        .map(l => [
          l.commande?.produits?.[0]?.quantite || 1000,
          new Date(l.dateCreation).getDay(),
          l.etat === 'Livrée' ? 1 : 0
        ]);

      const clusters = transporteurClustering.cluster(transpData);

      setTrainingMetrics({
        nn: delayMetrics,
        knn: { samples: knnCount },
        clustering: { clusters: clusters.length, k: 3 }
      });

      setModelTrained(true);
      runPredictions();
    } catch (err) {
      console.error('Erreur entraînement:', err);
      setError(err.message);
    } finally {
      setIsTraining(false);
    }
  }, [livraisons]);

  // Faire des prédictions sur les livraisons en cours
  const runPredictions = useCallback(() => {
    const enCours = livraisons.filter(l => l.etat === 'En cours' || l.etat === 'Prête');

    const preds = enCours.slice(0, 5).map(l => {
      const date = new Date(l.dateCreation);
      const input = [
        l.commande?.produits?.[0]?.quantite || 1000,
        Math.random() * 500 + 50,
        date.getDay(),
        date.getMonth(),
        5,
      ];

      const predictedDelay = delayPredictor.predict(input);
      const { risk, confidence } = riskClassifier.predictRisk([
        input[0], input[2], input[3]
      ]);

      return {
        numeroLivraison: l.numeroLivraison,
        predictedDelay: predictedDelay.toFixed(1),
        risk,
        confidence
      };
    });

    setPredictions(preds);
  }, [livraisons]);

  // Auto-train au chargement si données disponibles
  useEffect(() => {
    if (livraisons.length >= 5 && !modelTrained && !isTraining) {
      trainModels();
    }
  }, [livraisons, modelTrained, isTraining, trainModels]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>🤖 Machine Learning - Prédictions</h3>
        <button
          onClick={trainModels}
          disabled={isTraining}
          style={styles.button}
        >
          {isTraining ? '⏳ Entraînement...' : '🔄 Réentraîner'}
        </button>
      </div>

      {error && <div style={styles.error}>❌ {error}</div>}

      {trainingMetrics && (
        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>🧠 Neural Network</div>
            <div style={styles.metricValue}>
              MAE: {trainingMetrics.nn.finalMae?.toFixed(3)}
            </div>
            <div style={styles.metricSub}>
              {trainingMetrics.nn.epochsCompleted} epochs
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>📚 KNN Classifier</div>
            <div style={styles.metricValue}>
              {trainingMetrics.knn.samples} échantillons
            </div>
            <div style={styles.metricSub}>K=3</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>🎯 K-Means Clustering</div>
            <div style={styles.metricValue}>
              {trainingMetrics.clustering.k} clusters
            </div>
            <div style={styles.metricSub}>
              {trainingMetrics.clustering.clusters} points
            </div>
          </div>
        </div>
      )}

      {predictions && predictions.length > 0 && (
        <div style={styles.predictions}>
          <h4 style={styles.predTitle}>📊 Prédictions ML (Top 5 livraisons en cours)</h4>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tr}>
                <th style={styles.th}>Livraison</th>
                <th style={styles.th}>Délai prédit</th>
                <th style={styles.th}>Risque</th>
                <th style={styles.th}>Confiance</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}><strong>{p.numeroLivraison}</strong></td>
                  <td style={styles.td}>{p.predictedDelay} jours</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, background: riskColor(p.risk) }}>
                      {p.risk}
                    </span>
                  </td>
                  <td style={styles.td}>{p.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function riskColor(risk) {
  const map = {
    'Faible': '#10b981',
    'Modéré': '#f59e0b',
    'Élevé': '#ef4444',
    'Critique': '#7f1d1d'
  };
  return map[risk] || '#6b7280';
}

const styles = {
  container: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
    color: 'white',
    padding: 24,
    borderRadius: 16,
    margin: '20px 0',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { margin: 0, fontSize: 18, fontWeight: 700 },
  button: {
    padding: '8px 16px', borderRadius: 8, border: 'none',
    background: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer',
    fontWeight: 600
  },
  error: { background: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 12 },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 },
  metricCard: { background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12 },
  metricLabel: { fontSize: 12, opacity: 0.8, marginBottom: 6 },
  metricValue: { fontSize: 20, fontWeight: 700 },
  metricSub: { fontSize: 11, opacity: 0.7, marginTop: 4 },
  predictions: { background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12 },
  predTitle: { margin: '0 0 12px', fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse' },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.1)' },
  th: { padding: 10, textAlign: 'left', fontSize: 12, opacity: 0.8 },
  td: { padding: 10, fontSize: 13 },
  badge: { padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }
};

export default MLPredictionPanel;
