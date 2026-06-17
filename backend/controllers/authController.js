const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

const getFullName = (user) => {
  return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');
};

const registerUser = async (req, res) => {
  try {
    const { firstName, middleName, lastName, username, email, password, role, phone, age, gender } = req.body;
    
    if (!firstName || !lastName || !username || !email || !password || !role) {
      return res.status(400).json({ message: 'Please add all core fields' });
    }

    if (password.length < 6 || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long and contain at least 1 number and 1 special character' });
    }

    if (role === 'landlord') {
      if (!phone) {
        return res.status(400).json({ message: 'Phone number is required for landlords' });
      }
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
      }
    }

    if (role === 'tenant' && (!age || !gender || !req.file)) {
      return res.status(400).json({ message: 'Age, gender, and ID proof document are required for tenants' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let idProofPath;
    if (role === 'tenant' && req.file) {
      idProofPath = '/uploads/' + req.file.filename;
    }

    const user = await User.create({
      firstName,
      middleName,
      lastName,
      username,
      email,
      password: hashedPassword,
      role,
      phone: role === 'landlord' ? phone : undefined,
      age: (role === 'tenant' || role === 'landlord') ? age : undefined,
      gender: (role === 'tenant' || role === 'landlord') ? gender : undefined,
      idProof: idProofPath,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: getFullName(user),
        email: user.email,
        username: user.username,
        role: user.role,
        approvalStatus: user.approvalStatus,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const authUser = async (req, res) => {
  try {
    const { email, password } = req.body; // email here can be username or email

    const user = await User.findOne({ $or: [{ email: email }, { username: email }] })
      .populate('property')
      .populate('room');

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: getFullName(user),
        email: user.email,
        username: user.username,
        role: user.role,
        property: user.property,
        room: user.room,
        rentDue: user.rentDue,
        approvalStatus: user.approvalStatus,
        rejectionNote: user.rejectionNote,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  const userObj = req.user.toObject();
  userObj.name = getFullName(req.user);
  res.status(200).json(userObj);
};

module.exports = { registerUser, authUser, getMe };
