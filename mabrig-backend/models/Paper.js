const mongoose = require("mongoose");

const paperSchema = new mongoose.Schema({
    title: String,
    author: String,
    email: String,
    fileUrl: String,
    status: {
        type: String,
        default: "pending"
    },
    doi: String,
    paymentStatus: {
        type: String,
        default: "unpaid"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Paper", paperSchema);
