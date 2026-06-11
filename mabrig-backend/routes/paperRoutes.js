const express = require("express");
const router = express.Router();
const Paper = require("../models/Paper");
const upload = require("../middleware/upload");
const generateDOI = require("../utils/doiGenerator");

// POST /api/papers/upload
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const { title, author, email } = req.body;

        if (!req.file) return res.status(400).json({ error: "File is required" });

        const newPaper = new Paper({
            title,
            author,
            email,
            fileUrl: req.file.path,       // Cloudinary secure URL
            fileName: req.file.originalname,
        });

        await newPaper.save();
        res.json({ message: "Paper uploaded successfully", paper: newPaper });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/papers/approve/:id  (admin action)
router.put("/approve/:id", async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ error: "Paper not found" });

        paper.status = "published";
        paper.doi = generateDOI();
        await paper.save();

        res.json({ message: "Paper published with DOI", paper });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/papers
router.get("/", async (req, res) => {
    try {
        const papers = await Paper.find().sort({ createdAt: -1 });
        res.json(papers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
