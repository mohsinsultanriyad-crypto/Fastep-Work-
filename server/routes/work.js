const router = require("express").Router();
const Work = require("../models/Work");

// GET work status for a specific worker and date
router.get("/status/:workerId/:date", async(req,res)=>{
    try {
        const { workerId, date } = req.params;
        console.log(`[Work Status] Looking for workerId=${workerId}, date=${date}`);
        
        const work = await Work.findOne({ workerId, date });
        
        if (!work) {
            console.log(`[Work Status] Not found. Checking all for this worker...`);
            const allWorks = await Work.find({ workerId }).limit(5);
            console.log(`[Work Status] Found ${allWorks.length} works for this worker:`, allWorks.map(w => ({ date: w.date, status: w.status })));
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

    const {workerId,startTime,endTime,totalHours,otHours,date,breakMinutes,notes} = req.body;

    console.log(`[Work Submit] Received: workerId=${workerId}, date=${date}, hours=${totalHours}`);

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

    // Check duplicate entry for same user+date
    const already = await Work.findOne({workerId,date});
    if(already){
        console.log(`[Work Submit] Duplicate entry exists for workerId=${workerId}, date=${date}`);
        return res.status(400).json({ message: 'An entry for this date already exists' });
    }

    const work = await Work.create({
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

module.exports = router;
