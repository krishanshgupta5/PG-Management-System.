const Feedback = require('../models/Feedback');
const Property = require('../models/Property');

const submitFeedback = async (req, res) => {
  try {
    const { propertyId, rating, comment, stayDuration } = req.body;
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const feedback = await Feedback.create({
      property: propertyId,
      landlord: property.owner,
      tenant: req.user._id,
      rating,
      comment,
      stayDuration
    });

    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPropertyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ property: req.params.propertyId })
      .populate('tenant', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitFeedback, getPropertyFeedback };
