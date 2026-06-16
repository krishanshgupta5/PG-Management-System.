const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['landlord', 'tenant'], required: true },
  phone: { type: String }, // Required for landlord in authController
  // Tenant specific fields
  age: { type: Number },
  gender: { type: String },
  idProof: { type: String },
  approvalStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected', 'idle'], default: 'none' },
  rejectionNote: { type: String },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  rentDue: { type: Number, default: 0 },
  lastReminderSent: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
