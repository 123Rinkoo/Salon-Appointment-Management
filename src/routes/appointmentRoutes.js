const express = require('express');
const { createAppointment } = require('../controllers/appointmentController');
const authenticate = require('../middlewares/authMiddleware.js');
const rbacMiddleware = require('../middlewares/rbacMiddleware');
const router = express.Router();

router.use(authenticate); // This will verify the token for all routes below

// Create a new appointment 
router.post('/', rbacMiddleware(['Customer']), createAppointment);

module.exports = router;
