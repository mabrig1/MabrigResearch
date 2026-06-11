const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    abstract: { type: String, required: true, maxlength: 3000 },
    keywords: [{ type: String, trim: true }],
    authors: [
      {
        name: { type: String, required: true },
        email: { type: String },
        institution: { type: String },
      },
    ],
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    field: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String },
    doi: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'published'],
      default: 'pending',
    },
    publishingTier: {
      type: String,
      enum: ['basic', 'standard', 'premium', 'journal'],
      required: true,
    },
    amountPaid: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    paystackRef: { type: String },
    citations: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

paperSchema.index({ title: 'text', abstract: 'text', keywords: 'text' });

module.exports = mongoose.model('Paper', paperSchema);
