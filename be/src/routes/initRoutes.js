const express = require("express");
const router = express.Router();
const initController = require("../controllers/initController");

router.post('/', initController.initData);

module.exports = router;