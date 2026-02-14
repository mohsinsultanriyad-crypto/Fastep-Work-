const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name:String,
    phone:String,
    password:String,
    role:{
        type:String,
        enum:["admin","worker"]
    }
});

module.exports = mongoose.model("User",UserSchema);
