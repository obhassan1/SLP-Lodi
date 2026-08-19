const mongoose = require('mongoose');
 
const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startsAt: {
      type: Date,
      required: true,
      index: true
    },
    durationMinutes: {
      type: Number,
      default: 50,
      min: 1
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
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
    note: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);
 
// Safety net: no matter which code path saves a cancelled
// appointment, it can never carry a paid status or an amount.
appointmentSchema.pre('save', function (next) {
  if (this.status === 'cancelled') {
    this.paid = false;
    this.amount = 0;
  }
  next();
});
 
module.exports = mongoose.model('Appointment', appointmentSchema);
 