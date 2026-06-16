const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  roomNumber: { type: String, required: true },
  capacity: { type: Number, default: 1 },
  baseRent: { type: Number }, // Optional override for property-wide rent
  tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
