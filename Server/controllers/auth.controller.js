const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.login = async (req, res, next) => {
  try {
    const username = String(
      req.body.username || ''
    )
      .trim()
      .toLowerCase();

    const password = String(
      req.body.password || ''
    );

    const user = await User.findOne({
      username
    }).select('+passwordHash');

    if (
      !user ||
      !user.active ||
      !(await user.comparePassword(password))
    ) {
      return res.status(401).json({
        message: 'Invalid username or password'
      });
    }

    const token = jwt.sign(
      {
        sub: String(user._id),
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn:
          process.env.JWT_EXPIRES_IN || '8h'
      }
    );

    res.json({
      token,
      user: {
        _id: String(user._id),
        name: user.name,
        username: user.username,
        email: user.email || '',
        phone: user.phone || '',
        role: user.role,
        active: user.active,
        canManageLocation:
          !!user.canManageLocation,
        canTreatPatients:
          user.role === 'therapist' ||
          !!user.canTreatPatients,
        canCreateAnamnesis:
          user.role === 'therapist' &&
          !!user.canCreateAnamnesis
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res) => {
  res.json({
    user: req.user
  });
};