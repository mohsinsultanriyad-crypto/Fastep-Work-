const mongoose = require("mongoose");

const AdvanceSchema = new mongoose.Schema({
    // Reference to User (Mongo ObjectId)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Legacy workerId for backwards compatibility
    workerId: { type: String, required: true, index: true },

    // Amount requested
    amount: { type: Number, required: true },

    // Reason for advance
    reason: { type: String },

    // Date of request (YYYY-MM-DD format)
    requestDate: { type: String, default: () => new Date().toISOString().slice(0, 10) },

    // Status: pending | approved | rejected | scheduled
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'scheduled'],
        default: 'pending'
    },

    // If status is 'scheduled', payment date (YYYY-MM-DD)
    paymentDate: String,

    // Admin who decided (optional)
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // When decision was made
    decidedAt: Date

}, { timestamps: true });

module.exports = mongoose.model("Advance", AdvanceSchema);
