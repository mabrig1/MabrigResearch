require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes    = require("./routes/authRoutes");
const paperRoutes   = require("./routes/paperRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// Security headers
app.use(helmet());

// CORS — restrict to production domain in production
const allowedOrigins = process.env.NODE_ENV === "production"
    ? ["https://mabrigresearch.online", "https://www.mabrigresearch.online"]
    : ["http://localhost:3000", "http://localhost:5500"];

app.use(cors({ origin: allowedOrigins }));

// Rate limiting — 100 requests per 15 min per IP
app.use("/api/", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests, please try again later." }
}));

// Raw body for Paystack webhook HMAC verification (must come before express.json)
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log(err));

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

app.use("/api/auth",     authRoutes);
app.use("/api/papers",   paperRoutes);
app.use("/api/payments", paymentRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
