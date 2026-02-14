const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ CORS OPTIONS (Express v5 safe)
const isDev = process.env.NODE_ENV !== "production";

// During development allow all origins (useful for Codespaces / GH dev ports)
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // server-to-server or Postman
    if (isDev) return cb(null, true);
    if (origin.endsWith(".app.github.dev")) return cb(null, true);
    if (origin === "http://localhost:3000") return cb(null, true);
    if (origin === "http://127.0.0.1:3000") return cb(null, true);
    return cb(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
  credentials: false,
};

app.use(cors(corsOptions));

// Ensure preflight responses include CORS headers
app.options(/.*/, cors(corsOptions));

// Explicit CORS headers middleware (defensive - ensures headers even on errors)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();

  const allowed =
    isDev ||
    origin.endsWith(".app.github.dev") ||
    origin === "http://localhost:3000" ||
    origin === "http://127.0.0.1:3000";

  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization"
    );
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
