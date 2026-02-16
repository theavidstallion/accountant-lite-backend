const express = require('express');
const router = express.Router();
const controller = require('../controllers/employeeController');

router.get('/', controller.getAll);
router.get('/departments', controller.getDepartments);
router.get('/department/:department', controller.getByDepartment);
router.get('/:id/ledger', controller.getLedger);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
