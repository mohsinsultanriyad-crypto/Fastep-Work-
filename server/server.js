const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ CORS OPTIONS (Express v5 safe)
const isDev = process.env.NODE_ENV !== "production";

// Allowed origins for production (frontend + common dev host)
const allowedOrigins = [
  "https://fastep-work-1.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const corsOptions = {
  origin: (origin, cb) => {
    // Allow server-to-server or tools with no origin
    if (!origin) return cb(null, true);
    if (isDev) return cb(null, true);
    if (origin.endsWith(".app.github.dev")) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
  credentials: true,
};

// Apply CORS before routes
app.use(cors(corsOptions));

// Allow all preflight requests to be handled by CORS middleware
app.options("*", cors());

// Defensive headers (ensure presence even when errors occur)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();

  const allowed = isDev || origin.endsWith(".app.github.dev") || allowedOrigins.includes(origin);

  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  if (req.method === "OPTIONS") {
    console.log("Handled OPTIONS preflight for", origin, req.originalUrl);
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

// ✅ Root
app.get("/", (req, res) => res.send("API Running ✅"));

// ✅ Mongo
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

// ✅ Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/work", require("./routes/work"));
app.use("/api/admin", require("./routes/admin"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🔥 Server running on port " + PORT);
});
