const express = require('express');
const router = express.Router();
const { 
  getProperties, 
  getAllProperties, 
  createProperty, 
  updateProperty, 
  getPropertyTenants, 
  requestToJoin,
  approveTenant,
  rejectTenant,
  checkoutTenant,
  addRoom
} = require('../controllers/propertyController');
const { protect, landlordOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, landlordOnly, getProperties)
  .post(protect, landlordOnly, createProperty);

router.route('/all')
  .get(protect, getAllProperties); // Any authenticated user (tenants) can browse

router.route('/:id')
  .put(protect, landlordOnly, updateProperty);

router.route('/:id/tenants')
  .get(protect, landlordOnly, getPropertyTenants);

router.route('/:id/rooms')
  .post(protect, landlordOnly, addRoom);

router.route('/:id/request')
  .post(protect, requestToJoin);

router.route('/:id/tenants/:tenantId/approve')
  .put(protect, landlordOnly, approveTenant);

router.route('/:id/tenants/:tenantId/reject')
  .put(protect, landlordOnly, rejectTenant);

router.route('/:id/tenants/:tenantId/checkout')
  .put(protect, landlordOnly, checkoutTenant);

module.exports = router;
