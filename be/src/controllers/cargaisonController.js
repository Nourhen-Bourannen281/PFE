const Cargaison = require('../models/Cargaison');
const Livraison = require('../models/Livraison');

// Démarrer le transport
exports.demarrerTransport = async (req, res) => {
  try {
    const { livraisonId } = req.params;
    
    // Vérifier si la livraison existe
    const livraison = await Livraison.findById(livraisonId);
    if (!livraison) {
      return res.status(404).json({ message: 'Livraison non trouvée' });
    }
    
    // Vérifier que la livraison est en état "Prête" ou "En cours"
    if (livraison.etat !== 'Prête' && livraison.etat !== 'En cours') {
      return res.status(400).json({ message: 'La livraison doit être prête pour démarrer le transport' });
    }
    
    // Mettre à jour la cargaison
    const cargaison = await Cargaison.findOneAndUpdate(
      { livraison: livraisonId },
      { 
        dateDemarrage: Date.now(), 
        statutTransport: 'En cours',
        $setOnInsert: { 
          typeTransport: req.body.typeTransport || 'Camion',
          numeroCargaison: 'CAR-' + Date.now()
        }
      },
      { new: true, upsert: true }
    );
    
    // Mettre à jour l'état de la livraison
    await Livraison.findByIdAndUpdate(livraisonId, { etat: 'En cours' });
    
    res.json(cargaison);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Terminer le transport
exports.terminerTransport = async (req, res) => {
  try {
    const { livraisonId } = req.params;
    
    const cargaison = await Cargaison.findOneAndUpdate(
      { livraison: livraisonId },
      { 
        dateTerminaison: Date.now(), 
        statutTransport: 'Terminé' 
      },
      { new: true }
    );
    
    if (!cargaison) {
      return res.status(404).json({ message: 'Cargaison non trouvée' });
    }
    
    // Mettre à jour l'état de la livraison
    await Livraison.findByIdAndUpdate(livraisonId, { etat: 'Livrée' });
    
    res.json(cargaison);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Obtenir les cargaisons par transporteur
exports.getCargaisonsByTransporteur = async (req, res) => {
  try {
    const { transporteurId } = req.params;
    
    const livraisons = await Livraison.find({ transporteur: transporteurId })
      .populate('commande', 'numeroCommande');
    
    const livraisonIds = livraisons.map(l => l._id);
    
    const cargaisons = await Cargaison.find({ livraison: { $in: livraisonIds } })
      .populate('livraison');
    
    res.json(cargaisons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Obtenir une cargaison par livraison
exports.getCargaisonByLivraison = async (req, res) => {
  try {
    const { livraisonId } = req.params;
    
    const cargaison = await Cargaison.findOne({ livraison: livraisonId })
      .populate('livraison');
    
    if (!cargaison) {
      return res.status(404).json({ message: 'Cargaison non trouvée' });
    }
    
    res.json(cargaison);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};