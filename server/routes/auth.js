const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// REGISTER (admin ek baar worker create kare)
router.post("/register", async(req,res)=>{

    const hashed = await bcrypt.hash(req.body.password,10);

    const user = await User.create({
        name:req.body.name,
        phone:req.body.phone,
        password:hashed,
        role:req.body.role
    });

    res.send(user);
});


// LOGIN
router.post("/login", async(req,res)=>{

    const user = await User.findOne({phone:req.body.phone});

    if(!user) return res.status(400).send("User not found");

    const valid = await bcrypt.compare(req.body.password,user.password);

    if(!valid) return res.status(400).send("Wrong password");

    const token = jwt.sign(
        {id:user._id,role:user.role},
        process.env.JWT_SECRET
    );

    res.send({token,user});
});

module.exports = router;
