const express = require("express");
const axios = require("axios");
const router = express.Router();
const Paper = require("../models/Paper");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

// Initialize payment
router.post("/initialize", async (req, res) => {
    const { email, amount } = req.body;

    try {
        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
                email,
                amount: amount * 100
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`
                }
            }
        );

        res.json(response.data);

    } catch (err) {
        res.status(500).json(err.message);
    }
});

// Verify payment
router.get("/verify/:reference", async (req, res) => {
    try {
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${req.params.reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`
                }
            }
        );

        res.json(response.data);

    } catch (err) {
        res.status(500).json(err.message);
    }
});

module.exports = router;
