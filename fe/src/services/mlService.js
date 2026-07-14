// ═══════════════════════════════════════════════════════════════
// mlService.js - Machine Learning pour Dashboard Transporteur
// Modèles: Régression linéaire (TensorFlow.js)
// ═══════════════════════════════════════════════════════════════
import * as tf from '@tensorflow/tfjs';

/**
 * MODÈLE 1: Prédiction du délai de livraison
 * Type: Régression linéaire (Réseau de neurones simple)
 * Inputs: [quantité, distance, jourSemaine, mois, transporteurExperience]
 * Output: délai en jours
 */
class DeliveryDelayPredictor {
  constructor() {
    this.model = null;
    this.isTrained = false;
    this.normalizers = null;
  }

  /** Créer le modèle (architecture du réseau de neurones) */
  createModel() {
    this.model = tf.sequential({
      layers: [
        // Couche d'entrée: 5 features
        tf.layers.dense({ inputShape: [5], units: 16, activation: 'relu' }),
        // Couche cachée
        tf.layers.dense({ units: 8, activation: 'relu' }),
        // Couche de sortie: 1 valeur (délai en jours)
        tf.layers.dense({ units: 1 })
      ]
    });

    this.model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanSquaredError',
      metrics: ['mae'] // Mean Absolute Error
    });

    console.log('🧠 Modèle créé:', this.model.summary());
  }

  /** Normaliser les données (important pour le ML) */
  normalize(data, mins, maxs) {
    return data.map((row, i) =>
      row.map((val, j) => (val - mins[j]) / (maxs[j] - mins[j] || 1))
    );
  }

  /** Préparer les données d'entraînement à partir des livraisons */
  prepareData(livraisons) {
    if (!livraisons || livraisons.length < 5) {
      throw new Error('Pas assez de données (minimum 5 livraisons livrées)');
    }

    // Extraire les features
    const features = livraisons
      .filter(l => l.etat === 'Livrée' && l.dateLivraison && l.dateCreation)
      .map(l => {
        const date = new Date(l.dateCreation);
        const delivered = new Date(l.dateLivraison);
        const delayDays = (delivered - date) / (1000 * 60 * 60 * 24);

        return {
          features: [
            l.commande?.produits?.[0]?.quantite || 1000,  // Quantité
            Math.random() * 500 + 50,                      // Distance simulée (km)
            date.getDay(),                                  // Jour de la semaine (0-6)
            date.getMonth(),                                // Mois (0-11)
            l.transporteur?.experience || 5,               // Expérience transporteur
          ],
          label: Math.max(0.5, delayDays)                  // Délai réel en jours
        };
      });

    if (features.length < 5) {
      throw new Error('Pas assez de livraisons "Livrée" pour entraîner');
    }

    // Calculer min/max pour normalisation
    const numFeatures = features[0].features.length;
    const mins = new Array(numFeatures).fill(Infinity);
    const maxs = new Array(numFeatures).fill(-Infinity);

    features.forEach(({ features: f }) => {
      f.forEach((val, i) => {
        mins[i] = Math.min(mins[i], val);
        maxs[i] = Math.max(maxs[i], val);
      });
    });

    this.normalizers = { mins, maxs };

    const X = features.map(f => f.features);
    const y = features.map(f => f.label);

    const Xnorm = this.normalize(X, mins, maxs);

    return {
      X: tf.tensor2d(Xnorm),
      y: tf.tensor2d(y.map(v => [v])),
      count: features.length
    };
  }

  /** Entraîner le modèle */
  async train(livraisons, epochs = 100) {
    if (!this.model) this.createModel();

    const { X, y, count } = this.prepareData(livraisons);

    console.log(`🎓 Entraînement sur ${count} livraisons...`);

    const history = await this.model.fit(X, y, {
      epochs,
      batchSize: 8,
      validationSplit: 0.2,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, mae=${logs.mae.toFixed(4)}`);
          }
        }
      }
    });

    this.isTrained = true;

    // Cleanup tensors
    X.dispose();
    y.dispose();

    return {
      finalLoss: history.history.loss[epochs - 1],
      finalMae: history.history.mae[epochs - 1],
      epochsCompleted: epochs
    };
  }

  /** Prédire le délai pour une nouvelle livraison */
  predict(input) {
    if (!this.isTrained) throw new Error('Modèle non entraîné');

    const { mins, maxs } = this.normalizers;
    const normalized = input.map((val, i) => (val - mins[i]) / (maxs[i] - mins[i] || 1));

    const tensor = tf.tensor2d([normalized]);
    const prediction = this.model.predict(tensor);
    const value = prediction.dataSync()[0];

    tensor.dispose();
    prediction.dispose();

    return Math.max(0.5, value);
  }
}

/**
 * MODÈLE 2: Classification du Risque (K-Nearest Neighbors maison)
 * Classifie une livraison en: Faible / Modéré / Élevé / Critique
 */
class RiskClassifier {
  constructor() {
    this.dataset = [];
  }

  /** Calculer distance euclidienne */
  distance(a, b) {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }

  /** Entraîner: stocker les données historiques avec labels */
  train(livraisons) {
    this.dataset = livraisons
      .filter(l => l.etat === 'Livrée' || l.etat === 'Annulée')
      .map(l => {
        const date = new Date(l.dateCreation);
        const delivered = new Date(l.dateLivraison || date);
        const delayDays = (delivered - date) / (1000 * 60 * 60 * 24);

        let risk = 'Faible';
        if (delayDays > 10) risk = 'Critique';
        else if (delayDays > 5) risk = 'Élevé';
        else if (delayDays > 3) risk = 'Modéré';

        return {
          features: [
            l.commande?.produits?.[0]?.quantite || 1000,
            date.getDay(),
            date.getMonth(),
          ],
          label: risk
        };
      });

    console.log(`📚 Classificateur entraîné avec ${this.dataset.length} exemples`);
    return this.dataset.length;
  }

  /** Prédire le risque avec KNN (k=3) */
  predictRisk(input, k = 3) {
    if (this.dataset.length === 0) return { risk: 'Faible', confidence: 0 };

    // Calculer distances
    const distances = this.dataset.map(d => ({
      label: d.label,
      dist: this.distance(input, d.features)
    }));

    // Trier et prendre les k plus proches
    distances.sort((a, b) => a.dist - b.dist);
    const nearest = distances.slice(0, k);

    // Vote majoritaire
    const votes = {};
    nearest.forEach(n => {
      votes[n.label] = (votes[n.label] || 0) + 1;
    });

    const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    const risk = sorted[0][0];
    const confidence = (sorted[0][1] / k) * 100;

    return { risk, confidence: Math.round(confidence) };
  }
}

/**
 * MODÈLE 3: Clustering K-Means
 * Groupe les transporteurs en clusters de performance
 */
class TransporteurClustering {
  constructor(k = 3) {
    this.k = k;
    this.centroids = [];
  }

  /** Initialiser les centroïdes aléatoirement */
  initCentroids(data) {
    const indices = new Set();
    while (indices.size < this.k) {
      indices.add(Math.floor(Math.random() * data.length));
    }
    this.centroids = [...indices].map(i => [...data[i]]);
  }

  /** Algorithme K-Means */
  cluster(data, iterations = 50) {
    if (data.length < this.k) return [];

    this.initCentroids(data);
    let assignments = new Array(data.length).fill(0);

    for (let iter = 0; iter < iterations; iter++) {
      // Assigner chaque point au centroïde le plus proche
      assignments = data.map(point => {
        const dists = this.centroids.map(c =>
          Math.sqrt(c.reduce((sum, val, i) => sum + Math.pow(val - point[i], 2), 0))
        );
        return dists.indexOf(Math.min(...dists));
      });

      // Mettre à jour les centroïdes
      const newCentroids = this.centroids.map((_, ci) => {
        const cluster = data.filter((_, i) => assignments[i] === ci);
        if (cluster.length === 0) return this.centroids[ci];
        return cluster[0].map((_, i) =>
          cluster.reduce((sum, p) => sum + p[i], 0) / cluster.length
        );
      });

      this.centroids = newCentroids;
    }

    return assignments;
  }
}

// Singletons exportés
export const delayPredictor = new DeliveryDelayPredictor();
export const riskClassifier = new RiskClassifier();
export const transporteurClustering = new TransporteurClustering(3);

export default {
  delayPredictor,
  riskClassifier,
  transporteurClustering
};
