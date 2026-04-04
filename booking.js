const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    email: String,
    sport: String,
    date: String,
    time: String,
    players: Number,
    playersData: [
        {
            name: String,
            mobile: String,
            email: String
        }
    ]
});

module.exports = mongoose.model('Booking', bookingSchema);
