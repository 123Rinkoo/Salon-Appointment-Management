// const redisClient = require('../config/redis');
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

exports.getAppointments = async (req, res) => {
    const { page = 1, limit = 10 } = req.query; // Pagination parameters with default values

    try {
        // const cachedAppointments = await redisClient.get('appointments');
        // if (cachedAppointments) {
        //     return res.json({
        //         success: true,
        //         data: JSON.parse(cachedAppointments),
        //         message: 'Data fetched from cache',
        //     });
        // }

        const skip = (page - 1) * limit;
        const appointments = await Appointment.find()
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email')
            .populate('serviceId', 'name price')
            .exec();

        // Cache the appointments data for the next request (expiration time set to 1 hour)
        // await redisClient.setEx('appointments', 3600, JSON.stringify(appointments));

        return res.status(200).json({
            success: true,
            data: appointments,
            message: 'Data fetched from database',
        });
    } catch (error) {
        console.error('Error fetching appointments:', error.message); // More descriptive error logs
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching appointments',
        });
    }
};

exports.deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid appointment ID' });
        }

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (!checkAuthorization(req, appointment)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Appointment.deleteOne({ _id: id });

        res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('Error deleting appointment:', error.message);
        res.status(500).json({ message: 'An error occurred while deleting the appointment' });
    }
};
