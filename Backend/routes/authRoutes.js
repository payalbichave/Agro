const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// @route   POST /api/auth/sync
// @desc    Sync Firebase User with MongoDB (Create or Update)
// @access  Private (Bearer Token required)
router.post('/sync', verifyToken, async (req, res) => {
    console.log(`[AuthRoute] Sync Request for UID: ${req.user.uid}`);
    try {
        const { uid, email, picture } = req.user;
        // Extract comprehensive onboarding data from Request Body
        const {
            name,
            age,
            phone,
            farmName,
            farmArea,
            mainCrop,
            location,
            soilProfile
        } = req.body;

        // Check if user exists
        let user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            console.log(`[AuthRoute] User not found in DB. Creating new user...`);
            // Create new user with ALL details
            user = new User({
                firebaseUid: uid,
                email,
                name: name || req.user.name || 'User',
                profilePicture: picture,
                role: 'farmer',
                age,
                phone,
                farmName,
                farmArea,
                mainCrop,
                location,
                soilProfile
            });
            await user.save();
            console.log(`[AuthRoute] New user saved with full profile.`);
            return res.status(201).json({ message: 'User created', user });
        }

        console.log(`[AuthRoute] User found. Updating...`);
        // Update existing user (sync latest info)
        user.name = name || user.name || req.user.name;
        user.profilePicture = picture || user.profilePicture;

        // Update fields if provided (don't overwrite with undefined if not sent)
        if (age) user.age = age;
        if (phone) user.phone = phone;
        if (farmName) user.farmName = farmName;
        if (farmArea) user.farmArea = farmArea;
        if (mainCrop) user.mainCrop = mainCrop;
        if (location) user.location = location;
        if (soilProfile) user.soilProfile = soilProfile;

        user.lastLogin = Date.now();
        await user.save();
        console.log(`[AuthRoute] User updated with full profile.`);

        res.json({ message: 'User synced', user });

    } catch (error) {
        console.error('Auth Sync Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/auth/me
// @desc    Get Current User
// @access  Private
router.get('/me', verifyToken, async (req, res) => {
    console.log(`[AuthRoute] ME Request from UID: ${req.user.uid}`);
    try {
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            console.log(`[AuthRoute] ME Failed: User not found in DB.`);
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(`[AuthRoute] ME Success: User found.`);
        res.json(user);
    } catch (error) {
        console.error('[AuthRoute] Me Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
