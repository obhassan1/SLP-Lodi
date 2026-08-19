const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');
function patientScope(req) {
    return req.user.role === 'admin'
        ? {}
        : { assignedTherapists: req.user.id };
}
function hideNotesForAdmin(req, patient) {
    if (req.user.role !== 'admin')
        return patient;
    const safePatient = patient.toObject ? patient.toObject() : patient;
    safePatient.notes = (safePatient.notes || []).filter(note =>
        String(note.therapist || '') === String(req.user.id)
    );
    return safePatient;
}
exports.list = async (req, res, next) => {
    try {
        const filter = { ...patientScope(req) };
        if (req.user.role === 'admin' && req.query.mine === 'true') {
            filter.assignedTherapists = req.user.id;
        }
        if (req.query.q) {
            filter.name = { $regex: req.query.q, $options: 'i' };
        }
        const query = Patient.find(filter)
            .populate('assignedTherapists', 'name username role')
            .sort({ name: 1 });
        if (req.user.role === 'admin' && req.query.mine !== 'true') {
            query.select('-notes');
        }
        const patients = await query;
        if (req.user.role === 'admin' && req.query.mine === 'true') {
            return res.json(patients.map(patient =>
                hideNotesForAdmin(req, patient)
            ));
        }
        res.json(patients);
    }
    catch (error) {
        next(error);
    }
};
exports.get = async (req, res, next) => {
    try {
        const patient = await Patient.findOne({
            _id: req.params.id,
            ...patientScope(req)
        }).populate('assignedTherapists', 'name username role');
        if (!patient) {
            return res.status(404).json({
                message: 'Patient not found or not assigned to you'
            });
        }
        const appointments = await Appointment.find({ patient: patient._id })
            .populate('patient', 'name dateOfBirth therapyFocus')
            .populate('therapist', 'name username')
            .sort({ startsAt: -1 });
        res.json({
            patient: hideNotesForAdmin(req, patient),
            appointments
        });
    }
    catch (error) {
        next(error);
    }
};
exports.create = async (req, res, next) => {
    try {
        const body = {
            ...req.body,
            createdBy: req.user.id
        };
        if (req.user.role === 'therapist') {
            body.assignedTherapists = [req.user.id];
        }
        const created = await Patient.create(body);
        const patient = await created.populate('assignedTherapists', 'name username role');
        res.status(201).json(hideNotesForAdmin(req, patient));
    }
    catch (error) {
        next(error);
    }
};
exports.update = async (req, res, next) => {
    try {
        const body = { ...req.body };
        delete body.notes;
        if (req.user.role !== 'admin') {
            delete body.assignedTherapists;
        }
        const patient = await Patient.findOneAndUpdate({ _id: req.params.id, ...patientScope(req) }, body, { new: true, runValidators: true }).populate('assignedTherapists', 'name username role');
        if (!patient) {
            return res.status(404).json({
                message: 'Patient not found or not assigned to you'
            });
        }
        res.json(hideNotesForAdmin(req, patient));
    }
    catch (error) {
        next(error);
    }
};
exports.assign = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only an administrator can assign patient access'
            });
        }
        const patient = await Patient.findByIdAndUpdate(req.params.id, { assignedTherapists: req.body.therapistIds || [] }, { new: true, runValidators: true })
            .select('-notes')
            .populate('assignedTherapists', 'name username role');
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.json(patient);
    }
    catch (error) {
        next(error);
    }
};
exports.addNote = async (req, res, next) => {
    try {
        const patient = await Patient.findOne({
            _id: req.params.id,
            assignedTherapists: req.user.id
        });
        if (!patient) {
            return res.status(404).json({
                message: 'Patient not found or not assigned to you'
            });
        }
        patient.notes.unshift({
            ...req.body,
            therapist: req.user.id,
            therapistName: req.user.name
        });
        await patient.save();
        await patient.populate('assignedTherapists', 'name username role');
        res.status(201).json(patient);
    }
    catch (error) {
        next(error);
    }
};
exports.remove = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only an administrator can delete patients'
            });
        }
        const patient = await Patient.findByIdAndDelete(req.params.id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        await Appointment.deleteMany({ patient: req.params.id });
        res.status(204).end();
    }
    catch (error) {
        next(error);
    }
};
