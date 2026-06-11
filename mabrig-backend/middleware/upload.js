const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder:        "mabrig-research/papers",
        resource_type: "raw",          // allows PDF, DOC, DOCX
        allowed_formats: ["pdf", "doc", "docx"],
        public_id: (req, file) => {
            const name = file.originalname.replace(/\.[^.]+$/, "").replace(/\s+/g, "_");
            return `${Date.now()}-${name}`;
        },
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },   // 20 MB
});

module.exports = upload;
