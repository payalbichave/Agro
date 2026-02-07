const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const User = require('../models/User');
const Task = require('../models/Task');
const verifyToken = require('../middleware/authMiddleware');

const { sendTaskReminder } = require('../utils/emailService');

// Get all tasks for user
router.get('/', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) return res.status(404).json({ message: "User not found" });

        const tasks = await Task.find({ user: user._id })
            .populate('relatedDiagnosis', 'plant disease severity')
            .sort({ dueDate: 1 });

        // Check for overdue tasks and trigger notifications (Async, don't block response)
        const now = new Date();
        tasks.forEach(async (task) => {
            if (!task.completed && new Date(task.dueDate) < now) {
                const diffTime = Math.abs(now - new Date(task.dueDate));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Simple spam prevention: In a real app, we'd check a 'lastNotified' field
                // For this demo, we'll log it and attempt to send
                console.log(`[Notification] Task '${task.title}' is overdue by ${diffDays} days.`);
                await sendTaskReminder(user.email, task.title, diffDays);
            }
        });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new task (e.g., from Advisory)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { title, type, priority, dueDate, relatedDiagnosis } = req.body;

        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) return res.status(404).json({ message: "User not found" });

        const newTask = new Task({
            user: user._id,
            title,
            type,
            priority,
            dueDate,
            relatedDiagnosis
        });

        const savedTask = await newTask.save();
        res.status(201).json(savedTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Toggle task completion
router.patch('/:id/toggle', verifyToken, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        task.completed = !task.completed;
        await task.save();
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete task
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: "Task deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
