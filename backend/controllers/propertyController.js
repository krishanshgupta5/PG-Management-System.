const Property = require('../models/Property');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Room = require('../models/Room');

const getProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id })
      .populate('tenants', '-password');
    
    // Manual mapping if rooms aren't automatically linked (Mongoose virtuals/refs)
    // Actually, let's fetch rooms explicitly for each property for robustness
    const propertiesWithRooms = await Promise.all(properties.map(async (prop) => {
      const rooms = await Room.find({ property: prop._id }).populate('tenants', '-password');
      return { ...prop._doc, rooms };
    }));

    res.status(200).json(propertiesWithRooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addRoom = async (req, res) => {
  try {
    const { roomNumber, capacity, baseRent } = req.body;
    const property = await Property.findById(req.params.id);
    if (!property || property.owner.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Property not found or unauthorized' });
    }

    const room = await Room.create({
      property: property._id,
      roomNumber,
      capacity,
      baseRent: baseRent || property.baseRent
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllProperties = async (req, res) => {
  try {
    const filter = {};
    if (req.query.locality) {
      filter.locality = { $regex: req.query.locality, $options: 'i' };
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    const properties = await Property.find(filter).populate('owner', 'firstName lastName phone email');
    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProperty = async (req, res) => {
  try {
    const { name, address, locality, category, baseRent, safetyDeposit } = req.body;
    const property = await Property.create({
      name, address, locality, category, baseRent, safetyDeposit: safetyDeposit || 0, owner: req.user._id
    });
    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    const updatedProperty = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedProperty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPropertyTenants = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('tenants', '-password');
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.status(200).json(property.tenants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requestToJoin = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    
    const tenant = await User.findById(req.user._id);
    if (tenant.role !== 'tenant') return res.status(403).json({ message: 'Only tenants can join properties' });

    if (property.tenants.includes(tenant._id)) {
      return res.status(400).json({ message: 'Already requested or joined this property' });
    }

    property.tenants.push(tenant._id);
    await property.save();

    tenant.property = property._id;
    tenant.approvalStatus = 'pending';
    tenant.rejectionNote = '';
    await tenant.save();

    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveTenant = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property || property.owner.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Property not found or unauthorized' });
    }
    
    const tenant = await User.findById(req.params.tenantId);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    const { roomId } = req.body;
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.tenants.length >= room.capacity) return res.status(400).json({ message: 'Room is at full capacity' });

    tenant.approvalStatus = 'approved';
    tenant.room = roomId;
    // Initialize rent due to room rent (if exists) or property base rent + safety deposit
    tenant.rentDue = (room.baseRent || property.baseRent) + (property.safetyDeposit || 0); 
    await tenant.save();

    room.tenants.push(tenant._id);
    await room.save();

    // Notify Tenant
    await Notification.create({
      user: tenant._id,
      message: `Your application for ${property.name} was approved! You are assigned to Room: ${room.roomNumber}. Please pay your safety deposit and first month's rent.`
    });

    res.status(200).json({ message: 'Tenant approved and assigned to room' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectTenant = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('owner');
    if (!property || property.owner._id.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Property not found or unauthorized' });
    }
    
    const tenant = await User.findById(req.params.tenantId);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    // Remove tenant from property
    property.tenants = property.tenants.filter(t => t.toString() !== tenant._id.toString());
    await property.save();

    tenant.property = null;
    tenant.approvalStatus = 'rejected';
    tenant.rejectionNote = `Please upload valid documents. Contact landlord at: ${property.owner.phone}`;
    tenant.rentDue = 0;
    await tenant.save();

    res.status(200).json({ message: 'Tenant rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkoutTenant = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property || property.owner.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Property not found or unauthorized' });
    }
    
    const tenant = await User.findById(req.params.tenantId);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    // Remove tenant from property
    property.tenants = property.tenants.filter(t => t.toString() !== tenant._id.toString());
    await property.save();

    tenant.property = null;
    if (tenant.room) {
      const room = await Room.findById(tenant.room);
      if (room) {
        room.tenants = room.tenants.filter(t => t.toString() !== tenant._id.toString());
        await room.save();
      }
    }
    tenant.room = null;
    tenant.approvalStatus = 'idle'; // Reset status
    tenant.rentDue = 0;
    await tenant.save();

    // Notify Tenant to give feedback
    await Notification.create({
      user: tenant._id,
      message: `Your stay at ${property.name} has ended. We hope you had a great time! Please share your feedback here: /feedback/${property._id}`
    });

    res.status(200).json({ message: 'Tenant checked out and notified for feedback' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
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
};
