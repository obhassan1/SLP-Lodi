const User = require('../models/user.model');

const publicFields = 'name username email phone role active createdAt';

exports.list = async (_req, res, next) => {
  try {
    const users = await User.find()
      .select(publicFields)
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      name,
      username,
      email,
      phone,
      password
    } = req.body;

    let role = req.body.role === 'admin'
      ? 'admin'
      : 'therapist';

    if (req.user.role !== 'admin') {
      role = 'therapist';
    }

    if (!name || !username || !email || !phone || !password) {
      return res.status(400).json({
        message: 'Name, username, email, phone and password are required'
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message: 'Password must contain at least 8 characters'
      });
    }

    const normalizedUsername = String(username).trim().toLowerCase();

    if (await User.exists({ username: normalizedUsername })) {
      return res.status(409).json({
        message: 'Username already exists'
      });
    }

    const user = await User.create({
      name: String(name).trim(),
      username: normalizedUsername,
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      passwordHash: await User.hashPassword(password),
      role,
      createdBy: req.user.id
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      active: user.active
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isOwnAccount = String(req.user.id) === String(req.params.id);

    if (!isAdmin && !isOwnAccount) {
      return res.status(403).json({
        message: 'You can only edit your own account'
      });
    }

    const update = {};
    const editableFields = ['name', 'username', 'email', 'phone'];

    for (const field of editableFields) {
      if (req.body[field] !== undefined) {
        update[field] = String(req.body[field]).trim();
      }
    }

    if (update.username) {
      update.username = update.username.toLowerCase();

      const duplicate = await User.findOne({
        username: update.username,
        _id: { $ne: req.params.id }
      });

      if (duplicate) {
        return res.status(409).json({
          message: 'Username already exists'
        });
      }
    }

    if (update.email) {
      update.email = update.email.toLowerCase();
    }

    if (isAdmin) {
      if (req.body.role !== undefined) {
        update.role = req.body.role;
      }

      if (req.body.active !== undefined) {
        update.active = req.body.active;
      }
    }

    if (req.body.password) {
      if (String(req.body.password).length < 8) {
        return res.status(400).json({
          message: 'Password must contain at least 8 characters'
        });
      }

      update.passwordHash = await User.hashPassword(req.body.password);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      {
        new: true,
        runValidators: true
      }
    ).select(publicFields);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};
