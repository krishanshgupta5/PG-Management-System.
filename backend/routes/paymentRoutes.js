const express = require('express');
const router = express.Router();
const { getPayments, createOrder, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getPayments);

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;
