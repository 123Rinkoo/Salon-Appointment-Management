const { appointmentUpdateSchema } = require('../utils/validation');
const { checkAuthorization } = require('../utils/auth');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');


exports.createAppointment = async (req, res) => {
    try {
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

exports.getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid appointment ID' });
        }

        const appointment = await Appointment.findById(id)
            .populate('userId', 'name email')
            .populate('serviceId', 'name price')
            .select('-__v')
            .exec();

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        
        if (!checkAuthorization(req, appointment)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred. Please try again later.',
        });
    }
};

exports.updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = appointmentUpdateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: `Validation Error: ${error.details[0].message}` });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (!checkAuthorization(req, appointment)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const updates = {
            ...(req.body.serviceId && { serviceId: req.body.serviceId }),
            ...(req.body.date && { date: req.body.date }),
            ...(req.body.time && { time: req.body.time }),
            ...(req.body.status && { status: req.body.status }),
        };

        const updatedAppointment = await Appointment.findByIdAndUpdate(id, updates, {
            new: true, 
            runValidators: true,
        });

        res.json({
            message: 'Appointment updated successfully',
            appointment: updatedAppointment,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
