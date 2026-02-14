const router = require("express").Router();
const Advance = require("../models/Advance");
const mongoose = require("mongoose");

// ============================
// Worker Endpoints
// ============================

// POST /api/advances/request
// Request an advance
router.post("/request", async (req, res) => {
    try {
        const { userId, workerId, amount, reason, requestDate } = req.body;

        if (!userId || !workerId || !amount) {
            return res.status(400).json({ message: "Missing required fields: userId, workerId, amount" });
        }

        console.log(`[Advances/Request] New advance request: workerId=${workerId}, amount=${amount}`);

        const advance = await Advance.create({
            userId,
            workerId,
            amount,
            reason: reason || "",
            requestDate: requestDate || new Date().toISOString().slice(0, 10),
            status: "pending"
        });

        console.log(`[Advances/Request] Created advance:`, advance._id);
        res.json(advance);
    } catch (err) {
        console.error("[Advances/Request] Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET /api/advances/list-by-user/:userId
// Get all advances for a worker
router.get("/list-by-user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId format" });
        }

        console.log(`[Advances/ListByUser] Fetching advances for userId=${userId}`);

        const advances = await Advance.find({ userId }).sort({ createdAt: -1 });

        console.log(`[Advances/ListByUser] Found ${advances.length} advances`);
        res.json(advances);
    } catch (err) {
        console.error("[Advances/ListByUser] Error:", err);
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

// GET /api/advances/admin/pending
// Get all pending advance requests
router.get("/admin/pending", async (req, res) => {
    try {
        if (!verifyAdminSecret(req, res)) return;

        console.log(`[Advances/Admin/Pending] Fetching pending advances`);

        const advances = await Advance.find({ status: "pending" }).sort({ createdAt: -1 });

        console.log(`[Advances/Admin/Pending] Found ${advances.length} pending advances`);
        res.json(advances);
    } catch (err) {
        console.error("[Advances/Admin/Pending] Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// PATCH /api/advances/admin/:advanceId/status
// Approve, reject, or schedule an advance
router.patch("/admin/:advanceId/status", async (req, res) => {
    try {
        if (!verifyAdminSecret(req, res)) return;

        const { advanceId } = req.params;
        const { status, paymentDate } = req.body;

        if (!mongoose.Types.ObjectId.isValid(advanceId)) {
            return res.status(400).json({ message: "Invalid advanceId format" });
        }

        if (!["approved", "rejected", "scheduled"].includes(status)) {
            return res.status(400).json({ message: "Status must be 'approved', 'rejected', or 'scheduled'" });
        }

        if (status === "scheduled" && !paymentDate) {
            return res.status(400).json({ message: "paymentDate required for 'scheduled' status" });
        }

        console.log(`[Advances/Admin/UpdateStatus] Updating advance ${advanceId} to ${status}`);

        const updateData = {
            status,
            decidedAt: new Date()
        };

        if (status === "scheduled") {
            updateData.paymentDate = paymentDate;
        }

        const advance = await Advance.findByIdAndUpdate(
            advanceId,
            updateData,
            { new: true }
        );

        if (!advance) {
            return res.status(404).json({ message: "Advance not found" });
        }

        console.log(`[Advances/Admin/UpdateStatus] Updated advance:`, advance._id);
        res.json(advance);
    } catch (err) {
        console.error("[Advances/Admin/UpdateStatus] Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Optional: DELETE /api/advances/admin/clear-all
// Clear all advances (admin only)
router.delete("/admin/clear-all", async (req, res) => {
    try {
        if (!verifyAdminSecret(req, res)) return;

        console.log(`[Advances/Admin/ClearAll] Clearing all advances`);

        await Advance.deleteMany({});

        console.log(`[Advances/Admin/ClearAll] All advances cleared`);
        res.json({ message: "All advances cleared" });
    } catch (err) {
        console.error("[Advances/Admin/ClearAll] Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
