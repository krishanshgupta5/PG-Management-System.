const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  locality: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String }, // e.g., '1BHK', 'Shared Room'
  baseRent: { type: Number, required: true },
  safetyDeposit: { type: Number, default: 0 },
  tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);
