const mongoose = require('mongoose');

const diagnosisSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    plant: {
        type: String,
        required: true
    },
    disease: {
        type: String,
        required: true
    },
    confidence: {
        type: Number,
        required: true
    },
    severity: {
        type: String
    },
    symptoms: [String],
    recommendations: [String],
    treatment_plan: [{
        action: String,
        days_later: Number
    }],
    scannedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Diagnosis', diagnosisSchema);
