require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
async function run() { if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD)
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD are required in .env'); await mongoose.connect(process.env.MONGODB_URI); const username = process.env.ADMIN_USERNAME.trim().toLowerCase(); const passwordHash = await User.hashPassword(process.env.ADMIN_PASSWORD); await User.findOneAndUpdate({ username }, { name: process.env.ADMIN_NAME || 'Administrator', username, passwordHash, role: 'admin', active: true }, { upsert: true, new: true, setDefaultsOnInsert: true }); console.log(`Administrator ready: ${username}`); await mongoose.disconnect(); }
run().catch(async (error) => { console.error(error); await mongoose.disconnect(); process.exit(1); });
