const express = require('express');
const router = express.Router();
const { getComplaints, createComplaint, updateComplaintStatus } = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getComplaints)
  .post(protect, createComplaint);

router.route('/:id')
  .put(protect, updateComplaintStatus); // Landlord updates status

module.exports = router;
