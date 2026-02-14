const router = require("express").Router();
const Leave = require("../models/Leave");
const mongoose = require("mongoose");

// ============================
// Worker Endpoints
// ============================

// POST /api/leaves/apply
// Apply for a leave
router.post("/apply", async (req, res) => {
    try {
        const { userId, workerId, date, reason } = req.body;

        if (!userId || !workerId || !date) {
            return res.status(400).json({ message: "Missing required fields: userId, workerId, date" });
        }

        console.log(`[Leaves/Apply] New leave request: workerId=${workerId}, date=${date}`);

        const leave = await Leave.create({
            userId,
            workerId,
            date,
            reason: reason || "",
            status: "pending"
        });

        console.log(`[Leaves/Apply] Created leave:`, leave._id);
        res.json(leave);
    } catch (err) {
        console.error("[Leaves/Apply] Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET /api/leaves/list-by-user/:userId
// Get all leaves for a worker
router.get("/list-by-user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId format" });
        }

        console.log(`[Leaves/ListByUser] Fetching leaves for userId=${userId}`);

        const leaves = await Leave.find({ userId }).sort({ createdAt: -1 });

        console.log(`[Leaves/ListByUser] Found ${leaves.length} leaves`);
        res.json(leaves);
    } catch (err) {
        console.error("[Leaves/ListByUser] Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ============================
// Admin Endpoints (require x-admin-secret header)
// ============================

// Helper: Verify admin secret
const verifyAdminSecret = (req, res) => {
    const adminSecret = req.headers["x-admin-secret"];
    const expectedSecret = process.env.ADMIN_SECRET;

    if (!adminSecret || adminSecret !== expectedSecret) {
        res.status(401).json({ message: "Unauthorized: Invalid admin secret" });
        return false;
    }
    return true;
};

// GET /api/leaves/admin/pending
// Get all pending leave requests
router.get("/admin/pending", async (req, res) => {
    try {
        if (!verifyAdminSecret(req, res)) return;

        console.log(`[Leaves/Admin/Pending] Fetching pending leaves`);

        const leaves = await Leave.find({ status: "pending" }).sort({ createdAt: -1 });

        console.log(`[Leaves/Admin/Pending] Found ${leaves.length} pending leaves`);
        res.json(leaves);
    } catch (err) {
        console.error("[Leaves/Admin/Pending] Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// PATCH /api/leaves/admin/:leaveId/status
// Approve or reject a leave
router.patch("/admin/:leaveId/status", async (req, res) => {
    try {
        if (!verifyAdminSecret(req, res)) return;

        const { leaveId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(leaveId)) {
            return res.status(400).json({ message: "Invalid leaveId format" });
        }

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Status must be 'accepted' or 'rejected'" });
        }

        console.log(`[Leaves/Admin/UpdateStatus] Updating leave ${leaveId} to ${status}`);

        const leave = await Leave.findByIdAndUpdate(
            leaveId,
            {
                status,
                decidedAt: new Date()
            },
            { new: true }
        );

        if (!leave) {
            return res.status(404).json({ message: "Leave not found" });
        }

        console.log(`[Leaves/Admin/UpdateStatus] Updated leave:`, leave._id);
        res.json(leave);
    } catch (err) {
        console.error("[Leaves/Admin/UpdateStatus] Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Optional: DELETE /api/leaves/admin/clear-all
// Clear all leaves (admin only)
router.delete("/admin/clear-all", async (req, res) => {
    try {
        if (!verifyAdminSecret(req, res)) return;

        console.log(`[Leaves/Admin/ClearAll] Clearing all leaves`);

        await Leave.deleteMany({});

        console.log(`[Leaves/Admin/ClearAll] All leaves cleared`);
        res.json({ message: "All leaves cleared" });
    } catch (err) {
        console.error("[Leaves/Admin/ClearAll] Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
