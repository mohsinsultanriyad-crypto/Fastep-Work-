const router = require("express").Router();
const Work = require("../models/Work");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// DEBUG: GET ALL WORK
router.get("/debug/all-work", async(req,res)=>{
    try {
        const data = await Work.find({}).limit(20);
        console.log(`[Admin/Debug] Found ${data.length} total work entries`);
        res.json(data.map(d => ({ 
            _id: d._id, 
            workerId: d.workerId, 
            date: d.date, 
            status: d.status, 
            isApproved: d.isApproved 
        })));
    } catch (e) {
        console.error("[Admin/Debug] Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// GET ALL PENDING
router.get("/pending", async(req,res)=>{
    try {
        const data = await Work.find({status:"pending"})
        .populate("workerId");

        console.log(`[Admin/Pending] Found ${data.length} pending work entries`);
        res.send(data);
    } catch (e) {
        console.error("[Admin/Pending] Error:", e);
        res.status(500).json({ message: "Error fetching pending", error: e.message });
    }
});


// APPROVE
router.post("/approve/:id", async(req,res)=>{

    try {
        console.log(`[Admin/Approve] Approving work ID: ${req.params.id}`);
        
        const updated = await Work.findByIdAndUpdate(req.params.id,{
            status:"approved",
            isApproved: true
        }, { new: true });

        console.log(`[Admin/Approve] Updated:`, { 
            id: updated._id, 
            status: updated.status, 
            isApproved: updated.isApproved,
            workerId: updated.workerId,
            date: updated.date
        });

        res.json(updated);
    } catch (e) {
        console.error("[Admin/Approve] Error:", e);
        res.status(500).json({ message: "Approve failed", error: e.message });
    }
});

// DELETE ALL WORK ENTRIES (admin-only, protected by x-admin-secret header)
router.delete("/clear-all", async(req,res)=>{
    try {
        const adminSecret = req.headers["x-admin-secret"];
        const expectedSecret = process.env.ADMIN_SECRET;

        if (!adminSecret || adminSecret !== expectedSecret) {
            console.warn("[Admin/ClearAll] Unauthorized attempt (invalid or missing secret)");
            return res.status(401).json({ message: "Unauthorized" });
        }

        console.log("[Admin/ClearAll] Deleting all work entries...");
        const result = await Work.deleteMany({});
        
        console.log(`[Admin/ClearAll] Deleted ${result.deletedCount} work entries`);
        res.json({ 
            message: "All work entries deleted",
            deletedCount: result.deletedCount 
        });
    } catch (e) {
        console.error("[Admin/ClearAll] Error:", e);
        res.status(500).json({ message: "Delete failed", error: e.message });
    }
});

// RESET PASSWORD (admin-only, protected by x-admin-secret header)
router.patch("/reset-password", async(req,res)=>{
    try {
        const adminSecret = req.headers["x-admin-secret"];
        const expectedSecret = process.env.ADMIN_SECRET;

        if (!adminSecret || adminSecret !== expectedSecret) {
            console.warn("[Admin/ResetPwd] Unauthorized attempt (invalid or missing secret)");
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { userId, newPassword } = req.body;

        if (!userId || !newPassword) {
            return res.status(400).json({ message: "userId and newPassword are required" });
        }

        console.log(`[Admin/ResetPwd] Resetting password for user: ${userId}`);

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password in database
        const updatedUser = await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });

        if (!updatedUser) {
            console.warn(`[Admin/ResetPwd] User not found: ${userId}`);
            return res.status(404).json({ message: "User not found" });
        }

        console.log(`[Admin/ResetPwd] Password reset successfully for user: ${userId}`);
        res.json({ 
            message: "Password reset successfully",
            userId: updatedUser._id,
            userName: updatedUser.name
        });
    } catch (e) {
        console.error("[Admin/ResetPwd] Error:", e);
        res.status(500).json({ message: "Password reset failed", error: e.message });
    }
});

// DELETE USER (admin-only, protected by x-admin-secret header)
router.delete("/delete-user/:id", async(req,res)=>{
    try {
        const adminSecret = req.headers["x-admin-secret"];
        const expectedSecret = process.env.ADMIN_SECRET;

        if (!adminSecret || adminSecret !== expectedSecret) {
            console.warn("[Admin/DeleteUser] Unauthorized attempt (invalid or missing secret)");
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = req.params.id;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        console.log(`[Admin/DeleteUser] Deleting user: ${userId}`);

        // Try to find and delete from database
        // Handle both real ObjectIds and mock IDs (like "w1")
        let user = null;
        try {
            user = await User.findById(userId);
        } catch (castError) {
            // Invalid ObjectId format (e.g., "w1" is not a valid ObjectId)
            // Try finding by custom field if it exists, or just treat as mock ID
            console.log(`[Admin/DeleteUser] findById failed (expected for mock IDs): ${castError.message}`);
            user = null;
        }

        if (!user) {
            console.warn(`[Admin/DeleteUser] User not found or is mock ID: ${userId}`);
            // For mock IDs, we still return success (frontend handles local deletion)
            return res.json({ 
                message: "User deleted successfully",
                deletedUserId: userId,
                deletedUserName: `User ${userId}`,
                isMockId: true
            });
        }

        // Delete real user from database
        await User.findByIdAndDelete(userId);

        console.log(`[Admin/DeleteUser] Successfully deleted user: ${user.name} (${userId})`);
        res.json({ 
            message: "User deleted successfully",
            deletedUserId: userId,
            deletedUserName: user.name
        });
    } catch (e) {
        console.error("[Admin/DeleteUser] Error:", e);
        res.status(500).json({ message: "Delete user failed", error: e.message });
    }
});

module.exports = router;
