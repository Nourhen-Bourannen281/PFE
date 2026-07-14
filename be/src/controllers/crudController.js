// controllers/crudController.js — factory CRUD générique
const express = require('express');
const { protect } = require('../middlewares/authMiddleware');

const createCrudRoutes = (model, modelName, options = {}) => {
  const router = express.Router();
  const { populateFields = [] } = options;

  const applyPopulate = (query) => {
    populateFields.forEach(field => query.populate(field));
    return query;
  };

  // GET all
  router.get('/', protect, async (req, res) => {
    try {
      const data = await applyPopulate(model.find());
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // GET by id
  router.get('/:id', protect, async (req, res) => {
    try {
      const data = await applyPopulate(model.findById(req.params.id));
      if (!data) return res.status(404).json({ message: `${modelName} non trouvé` });
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // POST
  router.post('/', protect, async (req, res) => {
    try {
      const data = await model.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      console.error(`❌ Erreur POST ${modelName}:`, err.message);
      console.error('   Body reçu:', JSON.stringify(req.body, null, 2));
      // Détails des erreurs de validation Mongoose
      const errors = {};
      if (err.errors) {
        Object.keys(err.errors).forEach(key => {
          errors[key] = err.errors[key].message;
        });
      }
      res.status(400).json({
        success: false,
        message: err.message,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        modelName
      });
    }
  });

  // PUT
  router.put('/:id', protect, async (req, res) => {
    try {
      const data = await model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: false,
      });
      if (!data) return res.status(404).json({ message: `${modelName} non trouvé` });
      res.json({ success: true, data });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // DELETE
  router.delete('/:id', protect, async (req, res) => {
    try {
      const data = await model.findByIdAndDelete(req.params.id);
      if (!data) return res.status(404).json({ message: `${modelName} non trouvé` });
      res.json({ success: true, message: `${modelName} supprimé` });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
};

module.exports = createCrudRoutes;
