const router = require("express").Router();
const Work = require("../models/Work");

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

module.exports = router;
