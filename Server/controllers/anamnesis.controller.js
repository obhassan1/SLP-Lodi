const Patient = require('../models/patient.model');
const Anamnesis = require('../models/anamnesis.model');

async function getAssignedPatient(req, res) {
  const isTherapistRole =
    req.user.role === 'therapist' ||
    req.user.role === 'admin';

  if (!isTherapistRole) {
    res.status(403).json({
      message: 'You are not allowed to access anamnesis records'
    });

    return null;
  }

  /*
   * IMPORTANT:
   * Even an administrator must be assigned to the patient
   * to access that patient's anamnesis.
   */
  const patient = await Patient.findOne({
    _id: req.params.id,
    assignedTherapists: req.user.id
  }).select(
    'name dateOfBirth assignedTherapists'
  );

  if (!patient) {
    res.status(403).json({
      message:
        'You are not assigned to this patient and cannot access the anamnesis'
    });

    return null;
  }

  return patient;
}

exports.get = async (req, res, next) => {
  try {
    const patient = await getAssignedPatient(
      req,
      res
    );

    if (!patient) {
      return;
    }

    const report = await Anamnesis.findOne({
      patient: patient._id
    })
      .populate(
        'createdBy',
        'name username'
      )
      .populate(
        'updatedBy',
        'name username'
      );

    if (!report) {
      return res.status(404).json({
        message:
          'Anamnesis has not been created for this patient yet',

        canCreate:
          !!req.user.canCreateAnamnesis
      });
    }

    return res.json({
      patient,
      report
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const patient = await getAssignedPatient(
      req,
      res
    );

    if (!patient) {
      return;
    }

    if (!req.user.canCreateAnamnesis) {
      return res.status(403).json({
        message:
          'You do not have permission to create an anamnesis report'
      });
    }

    const existingReport =
      await Anamnesis.findOne({
        patient: patient._id
      });

    if (existingReport) {
      return res.status(409).json({
        message:
          'An anamnesis report already exists for this patient'
      });
    }

    /*
     * Remove protected fields supplied by the browser.
     * The server controls these values.
     */
    const body = {
      ...req.body
    };

    delete body._id;
    delete body.patient;
    delete body.createdBy;
    delete body.updatedBy;
    delete body.createdAt;
    delete body.updatedAt;
    delete body.__v;

    const report =
      await Anamnesis.create({
        ...body,

        patient:
          patient._id,

        createdBy:
          req.user.id,

        updatedBy:
          req.user.id
      });

    await report.populate(
      'createdBy',
      'name username'
    );

    await report.populate(
      'updatedBy',
      'name username'
    );

    return res.status(201).json({
      patient,
      report
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const patient = await getAssignedPatient(
      req,
      res
    );

    if (!patient) {
      return;
    }

    const body = {
      ...req.body
    };

    /*
     * Never allow these values to be modified
     * by the frontend.
     */
    delete body._id;
    delete body.patient;
    delete body.createdBy;
    delete body.updatedBy;
    delete body.createdAt;
    delete body.updatedAt;
    delete body.__v;

    const report =
      await Anamnesis.findOneAndUpdate(
        {
          patient: patient._id
        },
        {
          $set: {
            ...body,

            updatedBy:
              req.user.id
          }
        },
        {
          new: true,
          runValidators: true
        }
      )
        .populate(
          'createdBy',
          'name username'
        )
        .populate(
          'updatedBy',
          'name username'
        );

    if (!report) {
      return res.status(404).json({
        message:
          'Anamnesis has not been created for this patient yet'
      });
    }

    return res.json({
      patient,
      report
    });
  } catch (error) {
    next(error);
  }
};