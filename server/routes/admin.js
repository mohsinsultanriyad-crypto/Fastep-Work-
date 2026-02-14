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

// GET ALL WORKERS (admin-only, protected by x-admin-secret header)
router.get("/workers", async(req,res)=>{
    try {
        const adminSecret = req.headers["x-admin-secret"];
        const expectedSecret = process.env.ADMIN_SECRET;

        if (!adminSecret || adminSecret !== expectedSecret) {
            console.warn("[Admin/Workers] Unauthorized attempt (invalid or missing secret)");
            return res.status(401).json({ message: "Unauthorized" });
        }

        console.log(`[Admin/Workers] Fetching all workers from database`);

        const workers = await User.find({ role: "worker" })
            .select("_id workerId name phone role createdAt")
            .sort({ createdAt: -1 });

        console.log(`[Admin/Workers] Found ${workers.length} workers`);
        res.json(workers);
    } catch (e) {
        console.error("[Admin/Workers] Error:", e);
        res.status(500).json({ message: "Error fetching workers", error: e.message });
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

// CREATE WORKER (admin-only, protected by x-admin-secret header)
router.post("/create-worker", async(req,res)=>{
    try {
        const adminSecret = req.headers["x-admin-secret"];
        const expectedSecret = process.env.ADMIN_SECRET;

        console.log(`[Admin/CreateWorker] POST request received`);
        console.log(`[Admin/CreateWorker] Content-Type: "${req.headers['content-type']}"`);
        console.log(`[Admin/CreateWorker] req.body type:`, typeof req.body, req.body === undefined ? 'UNDEFINED' : 'present');
        console.log(`[Admin/CreateWorker] req.body:`, JSON.stringify(req.body, null, 2));
        console.log(`[Admin/CreateWorker] Header x-admin-secret: "${adminSecret}"`);
        console.log(`[Admin/CreateWorker] Expected ADMIN_SECRET: "${expectedSecret}"`);
        console.log(`[Admin/CreateWorker] Match: ${adminSecret === expectedSecret}`);

        if (!adminSecret || adminSecret !== expectedSecret) {
            console.warn("[Admin/CreateWorker] ❌ Unauthorized attempt (invalid or missing secret)");
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { name, workerId, phone, password, role = "worker" } = req.body;

        console.log(`[Admin/CreateWorker] Body: name="${name}", workerId="${workerId}", phone="${phone}", role="${role}"`);

        // Validate required fields
        if (!name || !workerId || !password) {
            console.warn(`[Admin/CreateWorker] ❌ Missing required fields`);
            return res.status(400).json({ message: "name, workerId, and password are required" });
        }

        // Normalize workerId: trim and uppercase
        const normalizedWorkerId = workerId.trim().toUpperCase();
        
        console.log(`[Admin/CreateWorker] Creating worker with workerId: ${normalizedWorkerId} (input was: "${workerId}")`);

        // Check if worker already exists
        const existingUser = await User.findOne({ workerId: normalizedWorkerId });
        if (existingUser) {
            console.warn(`[Admin/CreateWorker] ❌ Worker already exists: ${normalizedWorkerId}`);
            return res.status(400).json({ message: "Worker with this workerId already exists" });
        }

        // Hash password with bcrypt
        console.log(`[Admin/CreateWorker] Hashing password: "${password}"`);
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(`[Admin/CreateWorker] Password hashed (${password}) -> ${hashedPassword.substring(0, 20)}... (starts with $2: ${hashedPassword.startsWith("$2")})`);

        // Create user
        const user = await User.create({
            name: name.trim(),
            workerId: normalizedWorkerId,
            phone: phone ? phone.trim() : null,
            password: hashedPassword,
            role: role
        });

        console.log(`[Admin/CreateWorker] ✅ Successfully created worker: ${user.name} (${normalizedWorkerId})`);
        console.log(`[Admin/CreateWorker] Saved to DB - _id: ${user._id}, workerId: ${user.workerId}, password: ${user.password.substring(0, 20)}...`);
        
        res.json({ 
            message: "Worker created successfully",
            user: {
                _id: user._id,
                name: user.name,
                workerId: user.workerId,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (e) {
        console.error("[Admin/CreateWorker] ❌ ERROR:", e.message);
        console.error("[Admin/CreateWorker] Stack:", e.stack);
        if (e.code === 11000) {
            // Duplicate key error
            const field = Object.keys(e.keyPattern)[0];
            res.status(400).json({ message: `${field} already exists` });
        } else {
            res.status(500).json({ message: "Create worker failed", error: e.message });
        }
    }
});

module.exports = router;
