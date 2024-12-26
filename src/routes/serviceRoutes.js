const express = require('express');
const {
    getAllServices,
    createService,
    updateService,
    deleteService
} = require('../controllers/serviceController');
const authenticate = require('../middlewares/authMiddleware');
const rbacMiddleware = require('../middlewares/rbacMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', rbacMiddleware(['Admin', 'Customer']), getAllServices);

router.post('/', rbacMiddleware(['Admin']), createService);

router.put('/:id', rbacMiddleware(['Admin']), updateService);

router.delete('/:id', rbacMiddleware(['Admin']), deleteService);

module.exports = router;
