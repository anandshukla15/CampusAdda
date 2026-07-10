const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const storage = multer.memoryStorage();


const fileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed"), false);
    }
};

// create multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});


const uploadDocumentToCloudinary = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const uploadStream = cloudinary.uploader.upload_stream(
        {
            folder: process.env.CLOUDINARY_FOLDER || "campusadda/documents",
            resource_type: "raw"
        },
        (error, result) => {
            if (error) {
                return next(error);
            }

            req.file.path = result.secure_url;
            req.file.secure_url = result.secure_url;
            req.file.public_id = result.public_id;
            next();
        }
    );

    uploadStream.end(req.file.buffer);
};

module.exports = upload;
module.exports.uploadDocumentToCloudinary = uploadDocumentToCloudinary;
