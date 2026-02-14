const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ BODY PARSERS (MUST BE FIRST, before all other middleware to ensure req.body is parsed)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ ENV
const isDev = process.env.NODE_ENV !== "production";

// ✅ Allowed origins (production)
const allowedOrigins = [
  "https://fastep-work-1.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// ✅ CORS config
const corsOptions = {
  origin: (origin, cb) => {
    // allow server-to-server/tools with no origin (Postman/curl)
    if (!origin) return cb(null, true);

    // dev: allow all
    if (isDev) return cb(null, true);

    // github codespaces
    if (origin.endsWith(".app.github.dev")) return cb(null, true);

    // production allowlist
    if (allowedOrigins.includes(origin)) return cb(null, true);

    return cb(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-secret"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// ✅ Apply CORS (after body parsers, before routes)
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // preflight for all routes

// ✅ Debug logger (keep for now, remove later if you want)
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    console.log(`[${req.method}] ${req.originalUrl}`);
    console.log("  Content-Type:", req.headers["content-type"]);
    console.log("  Body:", req.body);
  }
  next();
});

// ✅ Root
app.get("/", (req, res) => res.send("API Running ✅"));

// ✅ Mongo
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err.message));

// ✅ Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/work", require("./routes/work"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/leaves", require("./routes/leaves"));
app.use("/api/advances", require("./routes/advances"));

// ✅ Error handler (helps see real errors instead of crash)
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({ message: "Server error", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🔥 Server running on port " + PORT);
});
