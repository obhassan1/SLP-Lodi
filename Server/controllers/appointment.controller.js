const Appointment = require('../models/appointment.model');
const Patient = require('../models/patient.model');
exports.list = async (req, res, next) => {
    try {
        const filter = {};
        if (req.user.role !== 'admin') {
            filter.therapist = req.user.id;
        }
        if (req.query.from || req.query.to) {
            filter.startsAt = {
                ...(req.query.from && { $gte: new Date(req.query.from) }),
                ...(req.query.to && { $lte: new Date(req.query.to) })
            };
        }
        const appointments = await Appointment.find(filter)
            .populate('patient', 'name dateOfBirth therapyFocus')
            .populate('therapist', 'name username')
            .sort({ startsAt: 1 });
        res.json(appointments);
    }
    catch (error) {
        next(error);
    }
};
exports.create = async (req, res, next) => {
    try {
        const patient = await Patient.findOne({
            _id: req.body.patient,
            ...(req.user.role === 'admin'
                ? {}
                : { assignedTherapists: req.user.id })
        });
        if (!patient) {
            return res.status(403).json({
                message: 'You do not have access to this patient'
            });
        }
        let therapist = req.user.id;
        if (req.user.role === 'admin' && !req.body.therapist) {
            return res.status(400).json({
                message: 'Choose a therapist for this appointment'
            });
        }
        if (req.user.role === 'admin' && req.body.therapist) {
            const assigned = patient.assignedTherapists.some(id => String(id) === String(req.body.therapist));
            if (!assigned) {
                return res.status(400).json({
                    message: 'Selected therapist is not assigned to this patient'
                });
            }
            therapist = req.body.therapist;
        }
        const appointment = await Appointment.create({
            ...req.body,
            therapist,
            createdBy: req.user.id
        });
        await appointment.populate([
            { path: 'patient', select: 'name therapyFocus' },
            { path: 'therapist', select: 'name username' }
        ]);
        res.status(201).json(appointment);
    }
    catch (error) {
        next(error);
    }
};
exports.update = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only an administrator can edit appointments'
            });
        }
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const patientId = req.body.patient || appointment.patient;
        const therapistId = req.body.therapist || appointment.therapist;
        const patient = await Patient.findById(patientId);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const therapistAssigned = patient.assignedTherapists.some(id =>
            String(id) === String(therapistId)
        );

        if (!therapistAssigned) {
            return res.status(400).json({
                message: 'Selected therapist is not assigned to this patient'
            });
        }

        const allowedFields = [
            'patient',
            'therapist',
            'startsAt',
            'durationMinutes',
            'location',
            'status',
            'paid',
            'amount',
            'note'
        ];
        const update = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                update[field] = req.body[field];
            }
        }
        const updated = await Appointment.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
            .populate('patient', 'name therapyFocus')
            .populate('therapist', 'name username');
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
};
exports.addSessionNote = async (req, res, next) => {
    try {
        if (req.user.role !== 'therapist') {
            return res.status(403).json({
                message: 'Clinical notes are available to therapists only'
            });
        }
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            therapist: req.user.id
        });
        if (!appointment) {
            return res.status(404).json({
                message: 'Appointment not found or does not belong to you'
            });
        }
        const patient = await Patient.findOne({
            _id: appointment.patient,
            assignedTherapists: req.user.id
        });
        if (!patient) {
            return res.status(403).json({
                message: 'You do not have access to this patient'
            });
        }
        const existing = patient.notes.find(note => String(note.appointment || '') === String(appointment._id));
        const noteData = {
            appointment: appointment._id,
            sessionDate: appointment.startsAt,
            focus: req.body.focus,
            note: req.body.note,
            paid: appointment.paid,
            amount: appointment.amount,
            therapist: req.user.id,
            therapistName: req.user.name
        };
        if (existing) {
            Object.assign(existing, noteData);
        }
        else {
            patient.notes.unshift(noteData);
        }
        appointment.status = 'completed';
        await Promise.all([patient.save(), appointment.save()]);
        res.status(201).json({ message: 'Session note saved' });
    }
    catch (error) {
        next(error);
    }
};
exports.remove = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only an administrator can delete appointments'
            });
        }
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        await appointment.deleteOne();
        res.status(204).end();
    }
    catch (error) {
        next(error);
    }
};
