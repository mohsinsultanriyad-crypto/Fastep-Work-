const mongoose = require("mongoose");

const LeaveSchema = new mongoose.Schema({
    // Reference to User (Mongo ObjectId)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Legacy workerId for backwards compatibility
    workerId: { type: String, required: true, index: true },

    // Leave date in YYYY-MM-DD format
    date: { type: String, required: true, index: true },

    // Reason for leave
    reason: { type: String },

    // Status: pending | accepted | rejected
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },

    // Admin who decided (optional)
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // When decision was made
    decidedAt: Date

}, { timestamps: true });

module.exports = mongoose.model("Leave", LeaveSchema);
