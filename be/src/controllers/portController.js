// backend/controllers/portController.js
const Port = require('../models/Port');

// @desc    Récupérer tous les ports
// @route   GET /api/ports
// @access  Private
const getPorts = async (req, res) => {
  try {
    const { type, actif, ville, search } = req.query;
    
    // Construire le filtre
    let filter = {};
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (actif !== undefined) {
      filter.actif = actif === 'true';
    }
    
    if (ville) {
      filter.ville = { $regex: ville, $options: 'i' };
    }
    
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { ville: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    const ports = await Port.find(filter).sort({ nom: 1 });
    
    res.status(200).json({
      success: true,
      count: ports.length,
      data: ports
    });
  } catch (error) {
    console.error('Erreur getPorts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des ports',
      error: error.message
    });
  }
};

// @desc    Récupérer un port par ID
// @route   GET /api/ports/:id
// @access  Private
const getPortById = async (req, res) => {
  try {
    const port = await Port.findById(req.params.id);
    
    if (!port) {
      return res.status(404).json({
        success: false,
        message: 'Port non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      data: port
    });
  } catch (error) {
    console.error('Erreur getPortById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du port',
      error: error.message
    });
  }
};

// @desc    Créer un nouveau port
// @route   POST /api/ports
// @access  Private (Admin uniquement)
const createPort = async (req, res) => {
  try {
    const {
      nom,
      code,
      ville,
      pays,
      type,
      capacite,
      latitude,
      longitude,
      description,
      actif
    } = req.body;
    
    // Vérifier si un port avec le même nom existe déjà
    const existingPort = await Port.findOne({ nom });
    if (existingPort) {
      return res.status(400).json({
        success: false,
        message: 'Un port avec ce nom existe déjà'
      });
    }
    
    // Vérifier si un port avec le même code existe déjà
    if (code) {
      const existingCode = await Port.findOne({ code });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Un port avec ce code existe déjà'
        });
      }
    }
    
    // Créer le port
    const port = await Port.create({
      nom,
      code: code || null,
      ville,
      pays: pays || 'Tunisie',
      type: type || 'commerce',
      capacite: capacite ? parseFloat(capacite) : null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      description: description || '',
      actif: actif !== undefined ? actif : true
    });
    
    res.status(201).json({
      success: true,
      message: 'Port créé avec succès',
      data: port
    });
  } catch (error) {
    console.error('Erreur createPort:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un port avec ce nom ou ce code existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du port',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un port
// @route   PUT /api/ports/:id
// @access  Private (Admin uniquement)
const updatePort = async (req, res) => {
  try {
    const {
      nom,
      code,
      ville,
      pays,
      type,
      capacite,
      latitude,
      longitude,
      description,
      actif
    } = req.body;
    
    let port = await Port.findById(req.params.id);
    
    if (!port) {
      return res.status(404).json({
        success: false,
        message: 'Port non trouvé'
      });
    }
    
    // Vérifier si le nouveau nom n'existe pas déjà
    if (nom && nom !== port.nom) {
      const existingPort = await Port.findOne({ nom });
      if (existingPort) {
        return res.status(400).json({
          success: false,
          message: 'Un port avec ce nom existe déjà'
        });
      }
    }
    
    // Vérifier si le nouveau code n'existe pas déjà
    if (code && code !== port.code) {
      const existingCode = await Port.findOne({ code });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Un port avec ce code existe déjà'
        });
      }
    }
    
    // Mettre à jour les champs
    port.nom = nom || port.nom;
    port.code = code || port.code;
    port.ville = ville || port.ville;
    port.pays = pays || port.pays;
    port.type = type || port.type;
    port.capacite = capacite !== undefined && capacite !== '' ? parseFloat(capacite) : port.capacite;
    port.latitude = latitude !== undefined && latitude !== '' ? parseFloat(latitude) : port.latitude;
    port.longitude = longitude !== undefined && longitude !== '' ? parseFloat(longitude) : port.longitude;
    port.description = description !== undefined ? description : port.description;
    port.actif = actif !== undefined ? actif : port.actif;
    
    await port.save();
    
    res.status(200).json({
      success: true,
      message: 'Port mis à jour avec succès',
      data: port
    });
  } catch (error) {
    console.error('Erreur updatePort:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du port',
      error: error.message
    });
  }
};

// @desc    Supprimer un port
// @route   DELETE /api/ports/:id
// @access  Private (Admin uniquement)
const deletePort = async (req, res) => {
  try {
    const port = await Port.findById(req.params.id);
    
    if (!port) {
      return res.status(404).json({
        success: false,
        message: 'Port non trouvé'
      });
    }
    
    await port.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Port supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deletePort:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du port',
      error: error.message
    });
  }
};

// @desc    Activer/Désactiver un port
// @route   PATCH /api/ports/:id/toggle
// @access  Private (Admin uniquement)
const togglePortStatus = async (req, res) => {
  try {
    const port = await Port.findById(req.params.id);
    
    if (!port) {
      return res.status(404).json({
        success: false,
        message: 'Port non trouvé'
      });
    }
    
    port.actif = !port.actif;
    await port.save();
    
    res.status(200).json({
      success: true,
      message: `Port ${port.actif ? 'activé' : 'désactivé'} avec succès`,
      data: port
    });
  } catch (error) {
    console.error('Erreur togglePortStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut',
      error: error.message
    });
  }
};

// @desc    Récupérer les statistiques des ports
// @route   GET /api/ports/stats/summary
// @access  Private
const getPortsStats = async (req, res) => {
  try {
    const stats = await Port.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          capaciteTotale: { $sum: { $ifNull: ['$capacite', 0] } },
          portsActifs: { $sum: { $cond: [{ $eq: ['$actif', true] }, 1, 0] } }
        }
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          capaciteTotale: 1,
          portsActifs: 1,
          _id: 0
        }
      }
    ]);
    
    const total = await Port.countDocuments();
    const actifs = await Port.countDocuments({ actif: true });
    
    res.status(200).json({
      success: true,
      data: {
        total,
        actifs,
        inactifs: total - actifs,
        parType: stats
      }
    });
  } catch (error) {
    console.error('Erreur getPortsStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

module.exports = {
  getPorts,
  getPortById,
  createPort,
  updatePort,
  deletePort,
  togglePortStatus,
  getPortsStats
};