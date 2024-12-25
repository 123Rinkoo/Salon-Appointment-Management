const Joi = require('joi');

const appointmentUpdateSchema = Joi.object({
    serviceId: Joi.string().optional(),
    date: Joi.date()
        .min('now')  
        .optional()
        .messages({
            'date.min': 'Date must not be in the past',
        }),
    time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/, 'time format').optional(),
    status: Joi.string().valid('Pending', 'Confirmed', 'Cancelled').optional(),
});

module.exports = { appointmentUpdateSchema };
