const { validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');

exports.createAppointment = async (req, res) => {
    try {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { serviceId, date, time } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
        }

        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        const appointmentDate = new Date(`${date}T${time}`);
        if (isNaN(appointmentDate.getTime()) || appointmentDate <= new Date()) {
            return res.status(400).json({ message: 'Invalid or past date/time' });
        }

        const existingAppointment = await Appointment.findOne({
            userId,
            serviceId,
            date,
            time
        });

        if (existingAppointment) {
            return res.status(409).json({ message: 'You already have an appointment at this time' });
        }

        const appointment = new Appointment({
            userId,
            serviceId,
            date,
            time,
            status: 'Pending', // Default status is Pending
        });

        await appointment.save();

        res.status(201).json({
            message: 'Appointment created successfully',
            appointment
        });
    } catch (error) {
        console.error('Error creating appointment:', error.message);

        // Specific error handling for database or unexpected issues
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Invalid data', details: error.errors });
        }

        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};
