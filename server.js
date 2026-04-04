
const User = require('./models/User');
const Booking = require('./models/Booking');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

// Connect MongoDB
mongoose.connect('mongodb://08harshiiii_db_user:Harshita0807@ac-xnxqzh2-shard-00-00.kkop3e2.mongodb.net:27017,ac-xnxqzh2-shard-00-01.kkop3e2.mongodb.net:27017,ac-xnxqzh2-shard-00-02.kkop3e2.mongodb.net:27017/?ssl=true&replicaSet=atlas-12qk7v-shard-0&authSource=admin&appName=Elite-Sports-Complex')
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Test route
app.get('/', (req, res) => {
    res.send("Server is running");
});

// Start server
app.listen(5000, () => {
    console.log("Server running on port 5000");
});

app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 🔍 Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.json({
                success: false,
                message: "User already exists ❌"
            });
        }

        // ✅ Create new user
        const newUser = new User({ name, email, password });
        await newUser.save();

        res.json({
            success: true,
            message: "User Registered Successfully ✅"
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Error saving user"
        });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 🔍 Check if user exists
        const user = await User.findOne({  email, password });

        if (!user) {
            return res.json({
                success: false,
                message: "User not found ❌"
            });
        }

        // 🔐 Check password
        if (user.password !== password) {
            return res.json({
                success: false,
                message: "Incorrect password ❌"
            });
        }

        // ✅ Login successful
        res.json({
    success: true,
    message: "Login successful",
    user: {
        name: user.name,
        email: user.email
    }
});


    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Error logging in"
        });
    }
});


app.post('/book', async (req, res) => {
    try {
        const { email, sport, date, time, players } = req.body;

        const newBooking = new Booking({
            email,
            sport,
            date,
            time,
            players
        });

        await newBooking.save();

        res.json({
            success: true,
            message: "Booking Confirmed ✅"
        });

    } catch (err) {
        console.log(err);
        res.json({
            success: false,
            message: "Booking failed ❌"
        });
    }
});
app.get('/my-bookings/:email', async (req, res) => {
    try {
        const email = req.params.email;

        const bookings = await Booking.find({ email });

        res.json({
            success: true,
            bookings: bookings
        });

    } catch (err) {
        res.json({
            success: false,
            message: "Error fetching bookings"
        });
    }
});
app.delete('/cancel-booking/:id', async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Booking cancelled successfully ❌"
        });

    } catch (err) {
        console.log(err);
        res.json({
            success: false,
            message: "Error cancelling booking"
        });
    }
});
