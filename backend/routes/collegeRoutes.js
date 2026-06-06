const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { addCollege, getColleges } = require('../controllers/collegeController');

router.post('/add', auth, role('admin'), addCollege);
router.get('/', getColleges);

module.exports = router;