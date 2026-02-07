const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  profilePicture: { type: String },
  role: { type: String, enum: ['farmer', 'admin'], default: 'farmer' }, // for future use

  // Personal Details
  age: { type: Number },
  phone: { type: String },

  // Farm Details
  farmName: { type: String },
  farmArea: { type: Number }, // in acres
  mainCrop: { type: String },

  // Location
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },

  // Soil Health (The critical part for Advisory)
  soilProfile: {
    type: { type: String, enum: ['Clay', 'Sandy', 'Loamy', 'Silt', ''] },
    n: { type: Number },
    p: { type: Number },
    k: { type: Number }
  },

  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
