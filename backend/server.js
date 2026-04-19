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
const path = require("path");

// Serve frontend folder
app.use(express.static(path.join(__dirname, "frontend")));
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

// Connect MongoDB
// mongoose.connect('mongodb://08harshiiii_db_user:Harshita0807@ac-xnxqzh2-shard-00-00.kkop3e2.mongodb.net:27017,ac-xnxqzh2-shard-00-01.kkop3e2.mongodb.net:27017,ac-xnxqzh2-shard-00-02.kkop3e2.mongodb.net:27017/?ssl=true&replicaSet=atlas-12qk7v-shard-0&authSource=admin&appName=Elite-Sports-Complex')
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// Test route
app.get('/', (req, res) => {
    res.send("Server is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.post('/register', async (req, res) => {
    try {
        console.log("BODY:", req.body); // 🔍 Debug

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields required"
            });
        }

        const existingUser = await User.findOne({ email });
        console.log("Existing user:", existingUser);

        if (existingUser) {
            return res.json({
                success: false,
                message: "User already exists ❌"
            });
        }

        const newUser = new User({ name, email, password });
        await newUser.save();

        res.json({
            success: true,
            message: "User Registered Successfully ✅"
        });

    } catch (err) {
        console.log("REGISTER ERROR:", err); // 🔥 CRITICAL
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
        const { email, sport, time, date, players, playersData } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // 🎯 Define prices
        const prices = {
            Basketball: 100,
            Football: 120,
            Badminton: 80,
            Cricket: 100
        };

        const cost = prices[sport];

        if (user.coins < cost) {
            return res.json({
                success: false,
                message: " Insufficient coins"
            });
        }

        user.coins -= cost;
        await user.save();

        //  Save booking
        const newBooking = new Booking({
            email,
            sport,
            time,
            date,
            players: Number(players),
            playersData,
            cost: cost
        });
        await newBooking.save();

        res.json({
            success: true,
            message: "Booking successful ",
            coins: user.coins
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Booking failed" });
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

app.get("/admin/all-bookings", async (req, res) => {
    try {
        const bookings = await Booking.find();

        const enrichedBookings = await Promise.all(
            bookings.map(async (b) => {
                const user = await User.findOne({ email: b.email });

                return {
                    ...b._doc,
                    name: user ? user.name : "Unknown"
                };
            })
        );

        res.json({ bookings: enrichedBookings });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
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
    try {
        const { email } = req.body;

        if (!email) return res.status(400).json({ success: false, message: "Email required" });

        const otp = Math.floor(100000 + Math.random() * 900000);
        otpStore[email] = otp;

        await transporter.sendMail({
            from: "hvpparashar0907@gmail.com",
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP is ${otp}`
        });

        res.json({ success: true, message: "OTP sent to email" });
    } catch (err) {
        console.error("Send OTP Error:", err);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
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
    callbackURL: "https://elite-sports-complex.onrender.com/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            console.log("Google Profile Received:", profile.emails[0].value);
            const email = profile.emails[0].value;

            let user = await User.findOne({ email });

            if (user) {
                console.log("User exists, logging in...");
                if (!user.googleId) {
                    user.googleId = profile.id;
                    await user.save();
                }
                return done(null, user);
            }

            console.log("Creating new Google user...");
            user = new User({
                name: profile.displayName,
                email: email,
                googleId: profile.id
                // Do NOT include password here
            });

            const savedUser = await user.save();
            console.log("User successfully saved to DB:", savedUser);
            return done(null, savedUser);

        } catch (err) {
            console.error("Error during Google Save:", err); // This will tell you WHY it's not saving
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
    res.redirect(`https://elite-sports-complex.vercel.app/d2.html?email=${req.user.email}&name=${req.user.name}`);
    }
);
app.get("/user-coins/:email", async (req, res) => {
    const user = await User.findOne({ email: req.params.email });

    if (!user) {
        return res.json({ success: false });
    }

    res.json({
        success: true,
        coins: user.coins
    });
});

//admin
const verifyAdmin = async (req, res, next) => {
    const { email } = req.body; // simple approach

    const user = await User.findOne({ email });

    if (!user || user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied (Admin only)"
        });
    }

    next();
};
// ✅ Update coins (Admin only)
app.post("/admin/update-coins", verifyAdmin, async (req, res) => {
    try {
        const { targetEmail, coins, action } = req.body;

        const user = await User.findOne({ email: targetEmail });

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // 🎯 3 types of update
        if (action === "add") {
            user.coins += coins;
        } else if (action === "deduct") {
            user.coins -= coins;
        } else {
            user.coins = coins; // set directly
        }

        await user.save();

        res.json({
            success: true,
            message: "Coins updated successfully",
            updatedCoins: user.coins
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error updating coins" });
    }
});
app.get("/admin/users", async (req, res) => {
    const users = await User.find().select("-password");

    res.json({
        success: true,
        users
    });
});
app.post("/admin/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.role !== "admin") {
        return res.json({
            success: false,
            message: "Not an admin"
        });
    }

    if (user.password !== password) {
        return res.json({
            success: false,
            message: "Wrong password"
        });
    }

    res.json({
        success: true,
        message: "Admin login successful",
        email: user.email
    });
});
app.get("/admin/stats", async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalBookings = await Booking.countDocuments();

        // Calculate revenue
        const bookings = await Booking.find();

        const prices = {
            Basketball: 100,
            Football: 120,
            Badminton: 80,
            Cricket: 100
        };

        let revenue = 0;

        bookings.forEach(b => {
            revenue += prices[b.sport] || 0;
        });

        res.json({
            success: true,
            totalUsers,
            totalBookings,
            revenue
        });

    } catch (err) {
        res.status(500).json({ success: false });
    }
});
app.get("/admin/bookings", async (req, res) => {
    try {
        const { sport, date, status, email } = req.query;

        let filter = {};

        if (sport) filter.sport = sport;
        if (status) filter.status = status;
        if (email) filter.email = email;
        if (date) filter.date = date;

        const bookings = await Booking.find(filter).sort({ date: -1 });

        res.json({ success: true, bookings });

    } catch (err) {
        res.status(500).json({ success: false });
    }
});
app.post("/admin/cancel-booking", verifyAdmin, async (req, res) => {
    try {
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.json({ success: false });

        if (booking.status === "cancelled") {
            return res.json({ success: false, message: "Already cancelled" });
        }

        // Refund coins
        const user = await User.findOne({ email: booking.email });
        user.coins += booking.cost;
        await user.save();

        booking.status = "cancelled";
        await booking.save();

        res.json({ success: true, message: "Booking cancelled & refunded" });

    } catch (err) {
        res.status(500).json({ success: false });
    }
});
app.post("/admin/reschedule-booking", verifyAdmin, async (req, res) => {
    try {
        const { bookingId, newDate, newTime } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.json({ success: false });

        booking.date = newDate;
        booking.time = newTime;
        booking.status = "upcoming";

        await booking.save();

        res.json({ success: true, message: "Rescheduled successfully" });

    } catch (err) {
        res.status(500).json({ success: false });
    }
});
app.delete("/admin/delete-booking/:id", verifyAdmin, async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});
