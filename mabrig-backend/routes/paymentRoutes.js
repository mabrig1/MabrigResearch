const express = require('express');
const router = express.Router();
const axios = require('axios');
const Paper = require('../models/Paper');
const { protect } = require('../middleware/auth');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

const TIER_AMOUNTS = {
  basic: 5000,       // ₦5,000 minimum
  standard: 20000,   // ₦20,000 minimum
  premium: 50000,    // ₦50,000 minimum
  journal: 150000,   // ₦150,000+
};

// POST /api/payments/initialize — initiate Paystack payment for a paper
router.post('/initialize', protect, async (req, res) => {
  try {
    const { paperId } = req.body;

    const paper = await Paper.findById(paperId);
    if (!paper) return res.status(404).json({ message: 'Paper not found' });
    if (paper.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (paper.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Payment already completed' });
    }

    const amountKobo = TIER_AMOUNTS[paper.publishingTier] * 100;

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: req.user.email,
        amount: amountKobo,
        metadata: {
          paperId: paper._id.toString(),
          userId: req.user._id.toString(),
          paperTitle: paper.title,
        },
        callback_url: `${process.env.CLIENT_URL}/payment/verify`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { authorization_url, reference } = response.data.data;

    await Paper.findByIdAndUpdate(paperId, { paystackRef: reference });

    res.json({ authorization_url, reference });
  } catch (err) {
    res.status(500).json({ message: err.response?.data?.message || err.message });
  }
});

// GET /api/payments/verify/:reference — verify Paystack callback
router.get('/verify/:reference', protect, async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      }
    );

    const { status, amount, metadata } = response.data.data;

    if (status !== 'success') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    const paper = await Paper.findByIdAndUpdate(
      metadata.paperId,
      {
        paymentStatus: 'paid',
        amountPaid: amount / 100,
        status: 'under_review',
      },
      { new: true }
    );

    if (!paper) return res.status(404).json({ message: 'Paper not found' });

    res.json({ message: 'Payment verified. Paper is now under review.', paper });
  } catch (err) {
    res.status(500).json({ message: err.response?.data?.message || err.message });
  }
});

// POST /api/payments/webhook — Paystack server-side webhook (no auth)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(req.body)
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body);

  if (event.event === 'charge.success') {
    const { metadata, amount, reference } = event.data;
    await Paper.findByIdAndUpdate(metadata.paperId, {
      paymentStatus: 'paid',
      amountPaid: amount / 100,
      paystackRef: reference,
      status: 'under_review',
    });
  }

  res.sendStatus(200);
});

module.exports = router;
