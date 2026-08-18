const User = require('../models/user.model');
exports.list = async (_req, res, next) => { try {
    res.json(await User.find().select('name username role active createdAt').sort({ name: 1 }));
}
catch (error) {
    next(error);
} };
exports.create = async (req, res, next) => { try {
    const { name, username, password } = req.body;
    let role = req.body.role === 'admin' ? 'admin' : 'therapist';
    if (req.user.role !== 'admin')
        role = 'therapist';
    if (!name || !username || !password)
        return res.status(400).json({ message: 'Name, username and password are required' });
    if (String(password).length < 8)
        return res.status(400).json({ message: 'Password must contain at least 8 characters' });
    const normalized = String(username).trim().toLowerCase();
    if (await User.exists({ username: normalized }))
        return res.status(409).json({ message: 'Username already exists' });
    const user = await User.create({ name: String(name).trim(), username: normalized, passwordHash: await User.hashPassword(password), role, createdBy: req.user.id });
    res.status(201).json({ _id: user._id, name: user.name, username: user.username, role: user.role, active: user.active });
}
catch (error) {
    next(error);
} };
exports.update = async (req, res, next) => { try {
    if (req.user.role !== 'admin')
        return res.status(403).json({ message: 'Only an administrator can change user roles or status' });
    const update = {};
    for (const key of ['name', 'role', 'active'])
        if (req.body[key] !== undefined)
            update[key] = req.body[key];
    if (req.body.password) {
        if (String(req.body.password).length < 8)
            return res.status(400).json({ message: 'Password must contain at least 8 characters' });
        update.passwordHash = await User.hashPassword(req.body.password);
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select('name username role active');
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    res.json(user);
}
catch (error) {
    next(error);
} };
