const Complaint = require('../models/Complaint');
const Property = require('../models/Property');

const getComplaints = async (req, res) => {
  try {
    if (req.user.role === 'landlord') {
      const properties = await Property.find({ owner: req.user._id });
      const propertyIds = properties.map(p => p._id);
      const complaints = await Complaint.find({ property: { $in: propertyIds } }).populate('tenant', 'name email').populate('property', 'name');
      res.status(200).json(complaints);
    } else {
      const complaints = await Complaint.find({ tenant: req.user._id }).populate('property', 'name');
      res.status(200).json(complaints);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createComplaint = async (req, res) => {
  try {
    if (req.user.role !== 'tenant') return res.status(401).json({ message: 'Only tenants can create complaints' });
    if (!req.user.property) return res.status(400).json({ message: 'Tenant is not assigned to a property' });
    
    const { title, description } = req.body;
    const complaint = await Complaint.create({
      title,
      description,
      tenant: req.user._id,
      property: req.user.property
    });
    
    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    if (req.user.role !== 'landlord') return res.status(401).json({ message: 'Only landlords can update complaints' });
    
    const { status, resolutionNotes } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    
    complaint.status = status || complaint.status;
    if (resolutionNotes) complaint.resolutionNotes = resolutionNotes;
    
    await complaint.save();
    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getComplaints, createComplaint, updateComplaintStatus };
