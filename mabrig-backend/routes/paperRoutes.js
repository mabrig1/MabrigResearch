const express = require('express');
const router = express.Router();
const Paper = require('../models/Paper');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { generateDOI } = require('../utils/doiGenerator');

// POST /api/papers — submit a new paper (authenticated)
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    const { title, abstract, keywords, authors, field, publishingTier } = req.body;

    if (!req.file) return res.status(400).json({ message: 'Paper file is required' });

    const paper = await Paper.create({
      title,
      abstract,
      keywords: keywords ? JSON.parse(keywords) : [],
      authors: authors ? JSON.parse(authors) : [],
      field,
      publishingTier,
      submittedBy: req.user._id,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
    });

    res.status(201).json(paper);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/papers — list published papers (public), with search & pagination
router.get('/', async (req, res) => {
  try {
    const { search, field, page = 1, limit = 10 } = req.query;
    const query = { status: 'published' };

    if (search) query.$text = { $search: search };
    if (field) query.field = field;

    const skip = (Number(page) - 1) * Number(limit);
    const [papers, total] = await Promise.all([
      Paper.find(query)
        .populate('submittedBy', 'name institution')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Paper.countDocuments(query),
    ]);

    res.json({ papers, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/papers/my — papers submitted by logged-in user
router.get('/my', protect, async (req, res) => {
  try {
    const papers = await Paper.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(papers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/papers/:id — single paper detail (increments view count)
router.get('/:id', async (req, res) => {
  try {
    const paper = await Paper.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('submittedBy', 'name institution country');

    if (!paper) return res.status(404).json({ message: 'Paper not found' });
    res.json(paper);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/papers/:id/status — admin updates status & assigns DOI on publish
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };

    if (status === 'published') {
      update.doi = generateDOI();
      update.publishedAt = new Date();
    }

    const paper = await Paper.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!paper) return res.status(404).json({ message: 'Paper not found' });
    res.json(paper);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/papers/:id — author deletes own unpublished paper
router.delete('/:id', protect, async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: 'Paper not found' });

    if (paper.submittedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (paper.status === 'published') {
      return res.status(400).json({ message: 'Published papers cannot be deleted' });
    }

    await paper.deleteOne();
    res.json({ message: 'Paper removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
