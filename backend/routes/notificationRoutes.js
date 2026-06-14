const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

// Get notifications for logged in user
router.get('/', auth, notificationController.getNotifications);

// Mark as read
router.post('/mark-read/:id', auth, notificationController.markAsRead);

module.exports = router;
