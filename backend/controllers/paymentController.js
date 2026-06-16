const Payment = require('../models/Payment');
const User = require('../models/User');
const Property = require('../models/Property');
const Notification = require('../models/Notification');

const getPayments = async (req, res) => {
  try {
    if (req.user.role === 'landlord') {
      const properties = await Property.find({ owner: req.user._id });
      const propertyIds = properties.map(p => p._id);
      const payments = await Payment.find({ property: { $in: propertyIds } }).populate('tenant', 'name email').populate('property', 'name');
      res.status(200).json(payments);
    } else {
      const payments = await Payment.find({ tenant: req.user._id }).populate('property', 'name');
      res.status(200).json(payments);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPayment = async (req, res) => {
  try {
    if (req.user.role !== 'tenant') return res.status(401).json({ message: 'Only tenants can make payments' });
    if (!req.user.property) return res.status(400).json({ message: 'Tenant is not assigned to a property' });
    
    const { amount } = req.body;
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }
    
    // Process payment here
    
    const payment = await Payment.create({
      tenant: req.user._id,
      property: req.user.property,
      amount
    });
    
    // Reduce rent due for the tenant
    const tenant = await User.findById(req.user._id).populate('property');
    tenant.rentDue = Math.max(0, tenant.rentDue - amount);
    await tenant.save();

    // Create a notification for the landlord
    if (tenant.property && tenant.property.owner) {
      await Notification.create({
        user: tenant.property.owner,
        message: `Tenant ${tenant.name || tenant.email} has paid ₹${amount} for rent at ${tenant.property.name}.`
      });
    }
    
    res.status(201).json({ payment, rentDue: tenant.rentDue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPayments, createPayment };
