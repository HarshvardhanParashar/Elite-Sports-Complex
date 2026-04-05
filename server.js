const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");

const User = require('./User');
const Booking = require('./Booking');

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

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check if user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        // 2. Check password
        if (user.password !== password) {
            return res.json({
                success: false,
                message: "Incorrect password"
            });
        }

        // 3. Login success
        res.json({
            success: true,
            message: "Login successful",
            user: {
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Server error"
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
app.get("/all-bookings", async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json({ bookings });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

const nodemailer = require("nodemailer");

let otpStore = {}; // store OTP temporarily

// Mail config
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "hvpparashar0907@gmail.com",
        pass: "gizo ycsa qgdv ntli" // NOT normal password
    }
});
app.post("/send-otp", async (req, res) => {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore[email] = otp;

    await transporter.sendMail({
        from: "your_email@gmail.com",
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}`
    });

    res.json({ success: true, message: "OTP sent to email" });
});
app.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;

    if (otpStore[email] && otpStore[email] == otp) {
        delete otpStore[email];
        return res.json({ success: true });
    }

    res.json({ success: false });
});

app.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new GoogleStrategy({
    clientID: "937316126083-44527gjcq404aj9jrugotrlfo8t042lc.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:5500/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;

            let user = await User.findOne({ email });

            if (user) {
                // ✅ User already exists
                // 👉 If signed up normally → attach Google ID
                if (!user.googleId) {
                    user.googleId = profile.id;
                    await user.save();
                }

                return done(null, user);
            }

            // 🆕 New user (Google signup)
            user = new User({
                name: profile.displayName,
                email: email,
                googleId: profile.id
            });

            await user.save();

            return done(null, user);

        } catch (err) {
            return done(err, null);
        }
    }));
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
// Step 1: Redirect to Google
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// Step 2: Callback
app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
        // redirect to your frontend after login
        res.redirect(`http://127.0.0.1:5502/Project/login.html?email=${req.user.email}&name=${req.user.name}`);
    }
);
