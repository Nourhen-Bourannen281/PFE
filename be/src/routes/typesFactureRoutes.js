const express = require('express');
const router = express.Router();
const { getTypesFacture, createTypeFacture, updateTypeFacture, deleteTypeFacture } = require('../controllers/typeFactureController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(getTypesFacture).post(authorize('admin'), createTypeFacture);
router.route('/:id').put(authorize('admin'), updateTypeFacture).delete(authorize('admin'), deleteTypeFacture);

module.exports = router;