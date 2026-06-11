require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const paperRoutes = require("./routes/paperRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// Raw body must be parsed before express.json() for Paystack webhook HMAC verification
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/papers", paperRoutes);
app.use("/api/payments", paymentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
