const express = require('express');
//const { request } = require('http');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const upload = require('../middleware/upload');
const { applyPresident ,approvePresident} = require('../controllers/presidentController');
router.post('/apply', upload.single('document'), applyPresident);
router.post('/approve/:userId', approvePresident);

module.exports = router;