const Joi = require('joi');

const appointmentUpdateSchema = Joi.object({
  serviceId: Joi.string().optional(),
  date: Joi.date().optional(),
  time: Joi.string().optional(),
  status: Joi.string().valid('Pending', 'Confirmed', 'Cancelled').optional(),
});

module.exports = { appointmentUpdateSchema };
