const express = require('express');
const router = express.Router();
const controller = require('../controllers/paymentController');

router.get('/', controller.getAll);
router.get('/salaries', controller.getSalaries);
router.post('/', controller.create);

module.exports = router;
