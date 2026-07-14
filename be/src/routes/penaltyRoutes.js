const express = require("express");
const router = express.Router();
const penaltyController = require("../controllers/penaltyController");
const { protectRoute, authorize } = require("../middlewares/authMiddleware");

router.get('/',              protectRoute, penaltyController.getPenalties);
router.post('/',             protectRoute, authorize('Admin'), penaltyController.createPenalty);
router.post('/appliquer',    protectRoute, authorize('Admin'), penaltyController.applyPenalties);
router.put('/:id/status',    protectRoute, authorize('Admin'), penaltyController.updateStatus);
router.post('/:id/pay',      protectRoute, penaltyController.payPenalty);

module.exports = router;
