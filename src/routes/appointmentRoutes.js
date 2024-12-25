const express = require('express');
const { createAppointment , getAppointmentById} = require('../controllers/appointmentController');
const authenticate = require('../middlewares/authMiddleware.js');
const rbacMiddleware = require('../middlewares/rbacMiddleware');
const router = express.Router();

router.use(authenticate); // This will verify the token for all routes below

// Create a new appointment 
router.post('/', rbacMiddleware(['Customer']), createAppointment);

router.get('/:id', rbacMiddleware(['Admin', 'Staff', 'Customer']), getAppointmentById);

module.exports = router;
