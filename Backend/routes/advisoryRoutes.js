const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const User = require('../models/User');
const { getWeatherData, generateWeatherAdvice } = require('../utils/weatherService');

// @route   GET /api/advisory/general
// @desc    Get weather-based general field advice
router.get('/general', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Default location (New Delhi) if user has no location
        const lat = user.location?.lat || 28.6139;
        const lng = user.location?.lng || 77.2090;

        const weatherData = await getWeatherData(lat, lng);

        if (!weatherData) {
            return res.status(503).json({ message: "Weather service unavailable" });
        }

        const advisory = generateWeatherAdvice(weatherData);

        res.json(advisory);

    } catch (error) {
        console.error("Advisory Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
