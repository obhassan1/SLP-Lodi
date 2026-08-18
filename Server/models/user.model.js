const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({ name: { type: String, required: true, trim: true }, username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true }, passwordHash: { type: String, required: true, select: false }, role: { type: String, enum: ['admin', 'therapist'], default: 'therapist' }, active: { type: Boolean, default: true }, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }, { timestamps: true });
userSchema.methods.comparePassword = function (password) { return bcrypt.compare(password, this.passwordHash); };
userSchema.statics.hashPassword = function (password) { return bcrypt.hash(password, 12); };
module.exports = mongoose.model('User', userSchema);
