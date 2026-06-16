const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  stayDuration: { type: String }, // e.g., "6 months", "1 year"
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
