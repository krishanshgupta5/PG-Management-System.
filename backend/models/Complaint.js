const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  status: { type: String, enum: ['open', 'in-progress', 'resolved'], default: 'open' },
  resolutionNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
