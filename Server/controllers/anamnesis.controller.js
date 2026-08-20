const Patient = require('../models/patient.model');
const Anamnesis = require('../models/anamnesis.model');

async function getAssignedPatient(req, res) {
  if (req.user.role !== 'therapist') {
    res.status(403).json({ message: 'Only the assigned therapist can access anamnesis records' });
    return null;
  }

  const patient = await Patient.findOne({
    _id: req.params.id,
    assignedTherapists: req.user.id
  }).select('name dateOfBirth assignedTherapists');

  if (!patient) {
    res.status(404).json({ message: 'Patient not found or not assigned to you' });
    return null;
  }

  return patient;
}

exports.get = async (req, res, next) => {
  try {
    const patient = await getAssignedPatient(req, res);
    if (!patient) return;

    const report = await Anamnesis.findOne({ patient: patient._id })
      .populate('createdBy', 'name username')
      .populate('updatedBy', 'name username');

    if (!report) {
      return res.status(404).json({
        message: 'Anamnesis has not been created for this patient yet',
        canCreate: !!req.user.canCreateAnamnesis
      });
    }

    res.json({ patient, report });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const patient = await getAssignedPatient(req, res);
    if (!patient) return;

    if (!req.user.canCreateAnamnesis) {
      return res.status(403).json({
        message: 'You do not have permission to create an anamnesis report'
      });
    }

    if (await Anamnesis.exists({ patient: patient._id })) {
      return res.status(409).json({
        message: 'An anamnesis report already exists for this patient'
      });
    }

    const report = await Anamnesis.create({
      ...req.body,
      patient: patient._id,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    await report.populate('createdBy', 'name username');
    await report.populate('updatedBy', 'name username');

    res.status(201).json({ patient, report });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const patient = await getAssignedPatient(req, res);
    if (!patient) return;

    const body = { ...req.body };
    delete body.patient;
    delete body.createdBy;
    delete body.updatedBy;
    delete body.createdAt;
    delete body.updatedAt;
    delete body._id;

    const report = await Anamnesis.findOneAndUpdate(
      { patient: patient._id },
      { ...body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name username')
      .populate('updatedBy', 'name username');

    if (!report) {
      return res.status(404).json({
        message: 'Anamnesis has not been created for this patient yet'
      });
    }

    res.json({ patient, report });
  } catch (error) {
    next(error);
  }
};
