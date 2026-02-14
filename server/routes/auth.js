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
    try {
        const { workerId, password } = req.body;

        if (!workerId || !password) {
            console.warn("[Auth/Login] Missing credentials");
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Normalize workerId: trim and uppercase
        const normalizedWorkerId = workerId.trim().toUpperCase();
        console.log(`[Auth/Login] Login attempt for workerId: ${normalizedWorkerId} | Raw input: "${workerId}"`);

        // DEBUG: Log all users in database
        const allUsers = await User.find({}, { workerId: 1, name: 1, password: 1 });
        console.log(`[Auth/Login] Total users in DB: ${allUsers.length}`, allUsers.map(u => ({ workerId: u.workerId, name: u.name, hasPassword: !!u.password, passwordPrefix: u.password?.substring(0, 10) || "NONE" })));

        // Search by workerId first
        let user = await User.findOne({ workerId: normalizedWorkerId });

        if (!user) {
            console.warn(`[Auth/Login] ❌ User NOT found with workerId: ${normalizedWorkerId}`);
            console.log(`[Auth/Login] Search details - Looking for: { workerId: "${normalizedWorkerId}" }`);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        console.log(`[Auth/Login] ✅ User found: ${user.name} | Password exists: ${!!user.password} | Password starts with $2: ${user.password?.startsWith("$2")}`);

        // Password verification with migration support
        let passwordValid = false;

        if (!user.password) {
            console.warn(`[Auth/Login] User has no password: ${normalizedWorkerId}`);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check if password is already hashed (starts with $2)
        if (user.password.startsWith("$2")) {
            // It's a bcrypt hash
            passwordValid = await bcrypt.compare(password, user.password);
            console.log(`[Auth/Login] Bcrypt compare result for ${normalizedWorkerId}: ${passwordValid}`);
        } else {
            // It's plaintext (migration fallback)
            console.log(`[Auth/Login] Detecting plaintext password for ${normalizedWorkerId}`);
            if (password === user.password) {
                passwordValid = true;
                console.log(`[Auth/Login] ✅ Plaintext password matched for: ${normalizedWorkerId}, hashing now`);
                // Hash it for future logins
                const hashed = await bcrypt.hash(password, 10);
                user.password = hashed;
                await user.save();
            } else {
                console.log(`[Auth/Login] ❌ Plaintext password mismatch for: ${normalizedWorkerId}`);
                console.log(`[Auth/Login] Received: "${password}" | Stored: "${user.password}"`);
            }
        }

        if (!passwordValid) {
            console.warn(`[Auth/Login] ❌ Invalid password for workerId: ${normalizedWorkerId}`);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            {id:user._id,role:user.role},
            process.env.JWT_SECRET
        );

        console.log(`[Auth/Login] ✅ Login successful for workerId: ${normalizedWorkerId}`);
        res.json({token,user});
    } catch (e) {
        console.error("[Auth/Login] ❌ ERROR:", e.message, e.stack);
        res.status(500).json({ message: "Login failed" });
    }
});

module.exports = router;
