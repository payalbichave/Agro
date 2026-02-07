const express = require('express');
const router = express.Router();
const Diagnosis = require('../models/Diagnosis');
const verifyToken = require('../middleware/authMiddleware');
const User = require('../models/User');
const sendEmail = require("../utils/emailService");

// @route   POST /api/diagnosis
// @desc    Save a new diagnosis result
// Get user diagnosis stats
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) return res.status(404).json({ message: "User not found" });

        const totalScans = await Diagnosis.countDocuments({ user: user._id });
        const healthyCount = await Diagnosis.countDocuments({ user: user._id, severity: "None" });
        const diseaseCount = await Diagnosis.countDocuments({ user: user._id, severity: { $ne: "None" } });

        // Scans today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayCount = await Diagnosis.countDocuments({
            user: user._id,
            scannedAt: { $gte: startOfDay }
        });

        res.json({
            totalScans,
            healthyCount,
            diseaseCount,
            todayCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @access  Private
router.post('/', verifyToken, async (req, res) => {
    try {
        const { plant, disease, confidence, severity, symptoms, recommendations, treatment_plan } = req.body;

        // Find MongoDB User ID from Firebase UID
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) return res.status(404).json({ message: "User not found" });

        const newDiagnosis = new Diagnosis({
            user: user._id,
            plant,
            disease,
            confidence,
            severity,
            symptoms,
            recommendations,
            treatment_plan
        });

        const savedDiagnosis = await newDiagnosis.save();

        // Send Email Alert for High/Medium Severity
        if (user.email && (severity === 'High' || severity === 'Medium')) {
            const emailContent = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #d9534f;">AgroAgent Alert: ${disease} Detected!</h2>
                    <p>Hello ${user.name || 'Farmer'},</p>
                    <p>Our AI has detected a potential issue in your field scan.</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d9534f; margin: 20px 0;">
                        <p><strong>Plant:</strong> ${plant}</p>
                        <p><strong>Disease:</strong> ${disease}</p>
                        <p><strong>Severity:</strong> ${severity}</p>
                        <p><strong>Confidence:</strong> ${confidence}%</p>
                    </div>

                    <h3>Recommended Actions:</h3>
                    <ul>
                        ${recommendations.slice(0, 3).map(r => `<li>${r}</li>`).join('')}
                    </ul>

                    <p style="margin-top: 20px;">
                        <a href="http://localhost:5173/advisory" style="background: #5cb85c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Full Report & Schedule Treatment</a>
                    </p>
                </div>
            `;
            // Fire and forget email to avoid blocking response
            sendEmail(user.email, `Alert: ${disease} detected in ${plant}`, emailContent);
        }

        res.status(201).json(savedDiagnosis);

    } catch (error) {
        console.error('Save Diagnosis Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/diagnosis
// @desc    Get diagnosis history for current user
// @access  Private
router.get('/', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) return res.status(404).json({ message: "User not found" });

        const history = await Diagnosis.find({ user: user._id })
            .sort({ scannedAt: -1 }) // Newest first
            .limit(20); // Limit to last 20 scans

        res.json(history);

    } catch (error) {
        console.error('Fetch History Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
