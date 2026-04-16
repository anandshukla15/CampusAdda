const multer = require('multer');
const path = require('path');

// storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');   // folder must exist
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// file filter (optional)
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF or images allowed'), false);
    }
};

// create multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

// ✅ EXPORT THIS
module.exports = upload;
// router.post('/apply', upload.single('document'), applyPresident);
// router.post('/approve/:userId', approvePresident);

//module.exports = router;