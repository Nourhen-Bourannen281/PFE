const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { protectRoute } = require("../middlewares/authMiddleware");

router.get('/dashboard', protectRoute, dashboardController.getDashboard);

module.exports = router;
