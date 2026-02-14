const router = require("express").Router();
const mongoose = require('mongoose');
const Work = require("../models/Work");

// GET work status for a specific worker and date
router.get("/status/:workerId/:date", async(req,res)=>{
    try {
        const { workerId, date } = req.params;
        console.log(`[Work Status] Looking for workerId=${workerId}, date=${date}`);

        // Prefer to find by workerId and date; if userId is provided as an object id in workerId param, also try userId
        let work = await Work.findOne({ workerId, date });
        if (!work && mongoose.Types.ObjectId.isValid(workerId)) {
            work = await Work.findOne({ userId: workerId, date });
        }

        if (!work) {
            console.log(`[Work Status] Not found. Checking recent entries for this worker/user...`);
            const query = mongoose.Types.ObjectId.isValid(workerId) ? { userId: workerId } : { workerId };
            const allWorks = await Work.find(query).limit(5);
            console.log(`[Work Status] Found ${allWorks.length} works:`, allWorks.map(w => ({ date: w.date, status: w.status })));
            return res.status(404).json({ message: "No submission found for this date" });
        }

        console.log(`[Work Status] Found:`, { status: work.status, isApproved: work.isApproved, date: work.date });
        res.json(work);
    } catch (e) {
        console.error("[Work Status] Error:", e);
        res.status(500).json({ message: "Server error" });
    }
});

// START + END WORK
router.post("/submit", async(req,res)=>{

    const { userId, workerId, startTime, endTime, totalHours, otHours, date, breakMinutes, notes } = req.body;

    console.log(`[Work Submit] Received: userId=${userId}, workerId=${workerId}, date=${date}, hours=${totalHours}`);

    // Validation: date required
    if(!date){
        return res.status(400).json({message: 'Date is required'});
    }

    // Validation: no future dates
    try {
        const today = new Date().toISOString().split('T')[0];
        if (date > today) {
            return res.status(400).json({ message: 'Future dates are not allowed' });
        }
    } catch (e) {
        // ignore parsing errors
    }

    // Check duplicate entry for same user+date (prefer userId if present)
    let already = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        already = await Work.findOne({ userId, date });
    }
    if (!already) {
        already = await Work.findOne({ workerId, date });
    }

    if(already){
        console.log(`[Work Submit] Duplicate entry exists for userId=${userId} or workerId=${workerId}, date=${date}`);
        return res.status(400).json({ message: 'An entry for this date already exists' });
    }

    const work = await Work.create({
        userId: mongoose.Types.ObjectId.isValid(userId) ? userId : undefined,
        workerId,
        startTime,
        endTime,
        totalHours,
        otHours,
        date,
        breakMinutes,
        notes,
        status: "pending",
        isApproved: false
    });

    console.log(`[Work Submit] Created new entry: ${work._id}`);
    res.json(work);
});

// GET list of works for a specific userId (ObjectId)
router.get('/list-by-user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`[Work List] Fetching works for userId=${userId}`);
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        const data = await Work.find({ userId }).sort({ startTime: -1 }).limit(500);
        res.json(data);
    } catch (e) {
        console.error('[Work List] Error:', e);
        res.status(500).json({ message: 'Failed to fetch work list', error: e.message });
    }
});

module.exports = router;
