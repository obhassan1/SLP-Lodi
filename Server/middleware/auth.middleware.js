const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
exports.requireAuth = async (req, res, next) => { try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token)
        return res.status(401).json({ message: 'Authentication required' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.active)
        return res.status(401).json({ message: 'Account is unavailable' });
    req.user = {
        id: String(user._id),
        name: user.name,
        username: user.username,
        role: user.role,
        canManageLocation: !!user.canManageLocation,
        canTreatPatients: user.role === 'therapist' || !!user.canTreatPatients
    };
    next();
}
catch (error) {
    return res.status(401).json({ message: 'Invalid or expired session' });
} };
exports.requireAdmin = (req, res, next) => req.user?.role === 'admin' ? next() : res.status(403).json({ message: 'Administrator access required' });
