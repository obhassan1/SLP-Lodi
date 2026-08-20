const User = require('../models/user.model');

const publicFields = 'name username email phone role active canManageLocation canTreatPatients canCreateAnamnesis createdAt';

exports.list = async (_req, res, next) => {
  try {
    const users = await User.find().select(publicFields).sort({ name: 1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, username, email, phone, password } = req.body;
    const role = req.body.role === 'admin' ? 'admin' : 'therapist';

    if (!name || !username || !password) {
      return res.status(400).json({ message: 'Name, username and password are required' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must contain at least 8 characters' });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    if (await User.exists({ username: normalizedUsername })) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const user = await User.create({
      name: String(name).trim(),
      username: normalizedUsername,
      email: String(email || '').trim().toLowerCase(),
      phone: String(phone || '').trim(),
      passwordHash: await User.hashPassword(password),
      role,
      canManageLocation: !!req.body.canManageLocation,
      canTreatPatients: role === 'therapist' || !!req.body.canTreatPatients,
      canCreateAnamnesis:
  (
    role === 'therapist' ||
    role === 'admin'
  ) &&
  !!req.body.canCreateAnamnesis,
      createdBy: req.user.id
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      active: user.active,
      canManageLocation: user.canManageLocation,
      canTreatPatients: user.role === 'therapist' || user.canTreatPatients,
      canCreateAnamnesis:
  (
    user.role === 'therapist' ||
    user.role === 'admin'
  ) &&
  user.canCreateAnamnesis
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await User.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'User not found' });

    const update = {};
    const editableFields = ['name', 'username', 'email', 'phone'];
    for (const field of editableFields) {
      if (req.body[field] !== undefined) update[field] = String(req.body[field]).trim();
    }

    if (update.username) {
      update.username = update.username.toLowerCase();
      const duplicate = await User.findOne({ username: update.username, _id: { $ne: req.params.id } });
      if (duplicate) return res.status(409).json({ message: 'Username already exists' });
    }
    if (update.email) update.email = update.email.toLowerCase();

    if (req.body.role !== undefined) update.role = req.body.role === 'admin' ? 'admin' : 'therapist';
    if (req.body.active !== undefined) update.active = !!req.body.active;
    if (req.body.canManageLocation !== undefined) update.canManageLocation = !!req.body.canManageLocation;

    const finalRole = update.role || existing.role;
    if (req.body.canTreatPatients !== undefined || update.role !== undefined) {
      update.canTreatPatients = finalRole === 'therapist' || !!req.body.canTreatPatients;
    }
    if (req.body.canCreateAnamnesis !== undefined || update.role !== undefined) {
      update.canCreateAnamnesis =
  (
    finalRole === 'therapist' ||
    finalRole === 'admin'
  ) &&
  !!req.body.canCreateAnamnesis;
    }

    if (req.body.password) {
      if (String(req.body.password).length < 8) {
        return res.status(400).json({ message: 'Password must contain at least 8 characters' });
      }
      update.passwordHash = await User.hashPassword(req.body.password);
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    }).select(publicFields);

    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.changeOwnPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'New password must contain at least 8 characters' });
    }

    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
