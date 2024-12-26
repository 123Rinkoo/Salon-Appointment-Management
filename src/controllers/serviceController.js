const mongoose = require('mongoose');
const Service = require('../models/Service');
const redisClient = require('../config/redis');

exports.getAllServices = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const cachedServices = await redisClient.get(`services:${page}:${limit}`);
        if (cachedServices) {
            console.log('Data fetched from cache');
            return res.json({
                success: true,
                data: JSON.parse(cachedServices),
                message: 'Data fetched from cache',
            });
        }
        const skip = (page - 1) * limit;
        const services = await Service.find().select('-__v').skip(skip).limit(limit).exec();

        await redisClient.setEx(`services:${page}:${limit}`, 3600, JSON.stringify(services));

        res.status(200).json({
            success: true,
            data: services,
            message: 'Data fetched from database',
        });
    } catch (error) {
        console.error('Error fetching services:', error.message);
        res.status(500).json({ message: 'Server error while fetching services' });
    }
};

exports.createService = async (req, res) => {
    try {
        const { name, price, duration } = req.body;

        if (!name || !price || !duration) {
            return res.status(400).json({ message: 'Missing required fields: name, price, or duration' });
        }

        const service = new Service({
            name,
            price,
            duration,
        });

        await service.save();

        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            data: service,
        });
    } catch (error) {
        console.error('Error creating service:', error.message);
        res.status(500).json({ message: 'Server error while creating service' });
    }
};

exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, duration } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid service ID' });
        }

        const updates = {
            ...(name && { name }),
            ...(price && { price }),
            ...(duration && { duration }),
        };

        const updatedService = await Service.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!updatedService) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Service updated successfully',
            data: updatedService,
        });
    } catch (error) {
        console.error('Error updating service:', error.message);
        res.status(500).json({ message: 'Server error while updating service' });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid service ID' });
        }

        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        await Service.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            message: 'Service deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting service:', error.message);
        res.status(500).json({ message: 'Server error while deleting service' });
    }
};
