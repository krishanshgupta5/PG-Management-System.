const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Property = require('../models/Property');
const Notification = require('../models/Notification');

// Helper to get a Razorpay instance — initialized lazily so missing keys
// don't crash the entire server on startup.
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are not configured in environment variables.');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// GET /api/payments - Fetch payment history
const getPayments = async (req, res) => {
  try {
    if (req.user.role === 'landlord') {
      const properties = await Property.find({ owner: req.user._id });
      const propertyIds = properties.map(p => p._id);
      const payments = await Payment.find({ property: { $in: propertyIds } })
        .populate('tenant', 'name email')
        .populate('property', 'name')
        .sort({ createdAt: -1 });
      res.status(200).json(payments);
    } else {
      const payments = await Payment.find({ tenant: req.user._id })
        .populate('property', 'name')
        .sort({ createdAt: -1 });
      res.status(200).json(payments);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/payments/create-order - Create a Razorpay order
const createOrder = async (req, res) => {
  try {
    if (req.user.role !== 'tenant') {
      return res.status(401).json({ message: 'Only tenants can make payments' });
    }
    if (!req.user.property) {
      return res.status(400).json({ message: 'Tenant is not assigned to a property' });
    }

    const { amount } = req.body;
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    // Razorpay expects amount in paise (1 INR = 100 paise)
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${req.user._id.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
      notes: {
        tenantId: req.user._id.toString(),
        propertyId: req.user.property.toString(),
      },
    };

    const order = await getRazorpay().orders.create(options);

    // Create a pending payment record
    const payment = await Payment.create({
      tenant: req.user._id,
      property: req.user.property,
      amount,
      status: 'pending',
      razorpayOrderId: order.id,
    });

    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('CREATE ORDER ERROR FULL:', JSON.stringify(error));
    const message = error?.error?.description || error?.message || 'Unknown error from Razorpay';
    res.status(500).json({ message });
  }
};

// POST /api/payments/verify - Verify Razorpay signature and mark payment complete
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await Payment.findByIdAndUpdate(paymentId, { status: 'failed' });
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Mark payment as completed
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status: 'completed', razorpayPaymentId: razorpay_payment_id },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Reduce tenant rent due
    const tenant = await User.findById(req.user._id).populate('property');
    tenant.rentDue = Math.max(0, tenant.rentDue - payment.amount);
    await tenant.save();

    // Notify landlord
    if (tenant.property && tenant.property.owner) {
      await Notification.create({
        user: tenant.property.owner,
        message: `Tenant ${tenant.firstName} ${tenant.lastName} has paid ₹${payment.amount} for rent at ${tenant.property.name}. Transaction ID: ${razorpay_payment_id}`,
      });
    }

    res.status(200).json({ message: 'Payment verified successfully', rentDue: tenant.rentDue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPayments, createOrder, verifyPayment };
