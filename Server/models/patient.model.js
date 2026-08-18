const mongoose = require('mongoose');
const sessionNoteSchema = new mongoose.Schema({
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    sessionDate: {
        type: Date,
        required: true
    },
    focus: {
        type: String,
        required: true,
        trim: true
    },
    note: {
        type: String,
        required: true,
        trim: true
    },
    paid: {
        type: Boolean,
        default: false
    },
    amount: {
        type: Number,
        min: 0,
        default: 0
    },
    therapist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    therapistName: String
}, { timestamps: true });
const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    caregivers: [
        {
            name: { type: String, required: true },
            relationship: String,
            phone: String,
            email: String
        }
    ],
    contact: {
        phone: String,
        email: String,
        address: String
    },
    therapyFocus: {
        type: String,
        trim: true
    },
    notes: [sessionNoteSchema],
    assignedTherapists: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true
        }
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
module.exports = mongoose.model('Patient', patientSchema);
