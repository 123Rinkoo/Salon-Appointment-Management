const express = require('express');
const { createAppointment, getAppointmentById, updateAppointment, getAppointments, deleteAppointment } = require('../controllers/appointmentController');
const authenticate = require('../middlewares/authMiddleware.js');
const rbacMiddleware = require('../middlewares/rbacMiddleware');
const router = express.Router();

router.use(authenticate);

router.post('/', rbacMiddleware(['Customer']), createAppointment);

router.get('/:id', rbacMiddleware(['Admin', 'Customer']), getAppointmentById);

router.put('/:id', rbacMiddleware(['Admin', 'Customer']), updateAppointment);

router.get('/', rbacMiddleware(['Admin']), getAppointments);

router.delete('/:id', rbacMiddleware(['Admin', 'Customer']), deleteAppointment);

module.exports = router;
