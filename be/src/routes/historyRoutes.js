const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

router.get('/user/:userId', historyController.getUserHistory);
router.get('/all', historyController.getAllHistory);

module.exports = router;