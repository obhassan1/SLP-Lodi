const Appointment = require('../models/appointment.model');
const Patient = require('../models/patient.model');
const User = require('../models/user.model');
exports.list = async (req, res, next) => {
    try {
        const filter = {};
        if (req.user.role !== 'admin') {
            filter.therapist = req.user.id;
        }
        else if (req.query.therapist) {
            filter.therapist = req.query.therapist;
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
            const treatingUser = await User.findOne({
                _id: req.body.therapist,
                active: true,
                $or: [
                    { role: 'therapist' },
                    { canTreatPatients: true }
                ]
            });
            if (!treatingUser) {
                return res.status(400).json({
                    message: 'Selected user is not enabled as a therapist'
                });
            }
            const assigned = patient.assignedTherapists.some(id => String(id) === String(req.body.therapist));
            if (!assigned) {
                return res.status(400).json({
                    message: 'Selected therapist is not assigned to this patient'
                });
            }
            therapist = req.body.therapist;
        }
        const location = req.user.role === 'admin' || req.user.canManageLocation
            ? String(req.body.location || '').trim()
            : '';
        const appointment = await Appointment.create({
            ...req.body,
            location,
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
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                message: 'Appointment not found'
            });
        }

        const isOwner =
            String(appointment.therapist) ===
            String(req.user.id);

        if (
            req.user.role !== 'admin' &&
            !isOwner
        ) {
            return res.status(403).json({
                message:
                    'You can only edit your own appointments'
            });
        }

        /*
         * Normal therapists cannot change location
         * unless they have location permission.
         */
        if (
            req.user.role !== 'admin' &&
            req.body.location !== undefined &&
            !req.user.canManageLocation
        ) {
            return res.status(403).json({
                message:
                    'You do not have permission to change appointment locations'
            });
        }

        /*
         * =====================================================
         * PAID APPOINTMENT PROTECTION
         * =====================================================
         *
         * Once an appointment is already paid:
         *
         * ADMIN:
         * - Can change amount
         * - Can change paid/unpaid
         *
         * THERAPIST:
         * - Cannot change amount
         * - Cannot mark it unpaid
         *
         * Therapists may still edit the other appointment
         * information.
         */
        if (
            req.user.role !== 'admin' &&
            appointment.paid === true
        ) {
            if (
                req.body.amount !== undefined &&
                Number(req.body.amount) !==
                Number(appointment.amount)
            ) {
                return res.status(403).json({
                    message:
                        'Only an administrator can change the amount of a paid appointment'
                });
            }

            if (
                req.body.paid !== undefined &&
                req.body.paid === false
            ) {
                return res.status(403).json({
                    message:
                        'Only an administrator can mark a paid appointment as unpaid'
                });
            }
        }


        const patientId =
            req.body.patient ||
            appointment.patient;

        const therapistId =
            req.user.role === 'admin'
                ? (
                    req.body.therapist ||
                    appointment.therapist
                )
                : appointment.therapist;


        /*
         * Validate therapist when admin changes therapist.
         */
        if (
            req.user.role === 'admin' &&
            req.body.therapist
        ) {
            const treatingUser =
                await User.findOne({
                    _id: therapistId,
                    active: true,
                    $or: [
                        {
                            role: 'therapist'
                        },
                        {
                            canTreatPatients: true
                        }
                    ]
                });

            if (!treatingUser) {
                return res.status(400).json({
                    message:
                        'Selected user is not enabled as a therapist'
                });
            }
        }


        /*
         * Validate patient.
         */
        const patient =
            await Patient.findById(patientId);

        if (!patient) {
            return res.status(404).json({
                message: 'Patient not found'
            });
        }


        /*
         * Make sure therapist is assigned
         * to this patient.
         */
        const therapistAssigned =
            patient.assignedTherapists.some(
                id =>
                    String(id) ===
                    String(therapistId)
            );

        if (!therapistAssigned) {
            return res.status(400).json({
                message:
                    'Selected therapist is not assigned to this patient'
            });
        }


        /*
         * Fields that may be updated.
         */
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
                update[field] =
                    req.body[field];
            }
        }


        /*
         * Normal therapist protections.
         */
        if (req.user.role !== 'admin') {

            /*
             * Therapist cannot reassign appointment.
             */
            delete update.therapist;

            /*
             * Therapist cannot change location
             * without permission.
             */
            if (!req.user.canManageLocation) {
                delete update.location;
            }

            /*
             * Extra server-side protection:
             * if the appointment was already paid,
             * force the original financial values.
             */
            if (appointment.paid === true) {
                update.amount =
                    appointment.amount;

                update.paid = true;
            }
        }


        /*
         * =====================================================
         * CANCELLED APPOINTMENTS
         * =====================================================
         *
         * Cancelled appointments never carry money,
         * regardless of user role.
         */
        const resultingStatus =
            update.status ||
            appointment.status;

        if (resultingStatus === 'cancelled') {
            update.paid = false;
            update.amount = 0;
        }


        /*
         * Save update.
         */
        const updated =
            await Appointment.findByIdAndUpdate(
                req.params.id,
                update,
                {
                    new: true,
                    runValidators: true
                }
            )
            .populate(
                'patient',
                'name therapyFocus'
            )
            .populate(
                'therapist',
                'name username'
            );


        res.json(updated);

    }
    catch (error) {
        next(error);
    }
};
exports.addSessionNote = async (req, res, next) => {
    try {
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

exports.cancel = async (req, res, next) => {
  try {
    const filter = {
      _id: req.params.id
    };

    /*
     * Therapists can only cancel appointments
     * assigned to their own account.
     */
    if (req.user.role !== 'admin') {
      filter.therapist = req.user.id;
    }

    const appointment =
      await Appointment.findOne(filter);

    if (!appointment) {
      return res.status(404).json({
        message:
          'Appointment not found or does not belong to you'
      });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({
        message:
          'A completed appointment cannot be cancelled'
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        message:
          'This appointment is already cancelled'
      });
    }

    appointment.status = 'cancelled';
    appointment.paid = false;
    appointment.amount = 0;

    await appointment.save();

    await appointment.populate([
      {
        path: 'patient',
        select: 'name dateOfBirth therapyFocus'
      },
      {
        path: 'therapist',
        select: 'name username'
      }
    ]);

    res.json(appointment);
  } catch (error) {
    next(error);
  }
};