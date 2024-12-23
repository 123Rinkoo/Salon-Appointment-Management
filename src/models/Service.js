const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: String,
    price: Number,
    duration: Number, //in minutes
});

module.exports = mongoose.model('Service', serviceSchema);
