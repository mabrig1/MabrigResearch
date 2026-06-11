const express = require("express");
const router = express.Router();
const Paper = require("../models/Paper");
const upload = require("../middleware/upload");
const generateDOI = require("../utils/doiGenerator");

// Upload Paper
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const { title, author, email } = req.body;

        const newPaper = new Paper({
            title,
            author,
            email,
            fileUrl: req.file.path
        });

        await newPaper.save();

        res.json({
            message: "Paper uploaded successfully",
            paper: newPaper
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Approve & Assign DOI (Admin action)
router.put("/approve/:id", async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);

        paper.status = "published";
        paper.doi = generateDOI();

        await paper.save();

        res.json({
            message: "Paper published with DOI",
            paper
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all papers
router.get("/", async (req, res) => {
    const papers = await Paper.find();
    res.json(papers);
});

module.exports = router;
