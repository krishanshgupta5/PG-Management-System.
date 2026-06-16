const express = require('express');
const router = express.Router();
const { submitFeedback, getPropertyFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, submitFeedback);
router.get('/:propertyId', protect, getPropertyFeedback);

module.exports = router;
