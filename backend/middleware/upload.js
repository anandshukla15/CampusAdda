const multer = require("multer");
const cloudinary = require("../config/cloudinary");
require("dotenv").config();

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed"), false);
    }
};

const uploadInstance = multer({
    storage: storage,
    fileFilter: fileFilter
});

const uploadDocumentToCloudinary = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    // CRITICAL: We use "raw" resource type for PDFs if "auto" fails, 
    // and we catch the exact error layout from Cloudinary.
    const uploadStream = cloudinary.uploader.upload_stream(
        {
            folder: process.env.CLOUDINARY_FOLDER || "campusfolder/documents",
            resource_type: "raw" 
        },
        (error, result) => {
            if (error) {
                // FIX: This prints the dynamic, exact reason Cloudinary says no!
                console.error("--- CLOUDINARY CRASH LOG ---");
                console.error(error); 
                console.error("----------------------------");
                
                return res.status(500).json({ 
                    error: "Failed to upload document to cloud storage.",
                    details: error.message // This sends the exact reason to your frontend/Postman
                });
            }

            req.body.document_url = result.secure_url; 
            next();
        }
    );

    uploadStream.end(req.file.buffer);
};

// FIX: Combined export so nothing gets overwritten!
module.exports = {
    upload: uploadInstance,
    uploadDocumentToCloudinary
};