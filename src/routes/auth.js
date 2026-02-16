const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/login', controller.login);
router.post('/register', controller.register);
router.get('/verify', authMiddleware, controller.verify);

module.exports = router;
