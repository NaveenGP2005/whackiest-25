require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const userRouter = require("./routes/user.routes");

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "wanderforge_secret_key_2024",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 24 * 60 * 60,
    }),
    cookie: {
      secure: true,       // 🔥 FORCE TRUE on Render
      httpOnly: true,
      sameSite: "none",   // 🔥 REQUIRED for cross-origin
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.set("trust proxy", 1);

// Routes
app.use("/api/auth", userRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "WanderForge Auth Server Running" });
});

// Database Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/wanderforge";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Auth server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB Connection Error:", err);
    // Start server anyway for development
    app.listen(PORT, () => console.log(`Auth server running on port ${PORT} (DB not connected)`));
  });
