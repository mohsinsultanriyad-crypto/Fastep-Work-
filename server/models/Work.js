const mongoose = require("mongoose");

const WorkSchema = new mongoose.Schema({

    workerId:{ type: String,
  required: true
        
    },

    date: { type: String, required: true },

    startTime:String,
    endTime:String,
    breakMinutes: { type: Number, default: 0 },
    notes: String,

    totalHours:Number,
    otHours:Number,

    status:{
        type:String,
        default:"pending" // pending → approved
    },
    
    isApproved: {
        type: Boolean,
        default: false
    }

},{timestamps:true});

module.exports = mongoose.model("Work",WorkSchema);
