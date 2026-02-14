const mongoose = require("mongoose");

const WorkSchema = new mongoose.Schema({

    // Reference to application `User` (Mongo ObjectId)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },

    // Legacy workerId kept for backwards compatibility (string id from older clients)
    workerId: { type: String, required: true },

    date: { type: String, required: true },

    startTime: String,
    endTime: String,
    breakMinutes: { type: Number, default: 0 },
    notes: String,

    totalHours: Number,
    otHours: Number,

    status: {
        type: String,
        default: 'pending'
    },

    isApproved: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model("Work",WorkSchema);
