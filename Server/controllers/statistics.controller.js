const Appointment =
  require('../models/appointment.model');

const Patient =
  require('../models/patient.model');

const User =
  require('../models/user.model');


function startOfDay(date) {
  const result = new Date(date);

  result.setHours(
    0,
    0,
    0,
    0
  );

  return result;
}


function endOfDay(date) {
  const result = new Date(date);

  result.setHours(
    23,
    59,
    59,
    999
  );

  return result;
}


function parseDate(value) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}


function monthKey(date) {
  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    )
  ].join('-');
}


function monthLabel(date) {
  return date.toLocaleDateString(
    'en-US',
    {
      month: 'short',
      year: 'numeric'
    }
  );
}


exports.dashboard = async (
  req,
  res,
  next
) => {
  try {
    /*
     * Backend protection.
     * This page is ADMIN ONLY.
     */
    if (
      req.user.role !== 'admin'
    ) {
      return res
        .status(403)
        .json({
          message:
            'Administrator access required'
        });
    }

    const from =
      parseDate(
        req.query.from
      );

    const to =
      parseDate(
        req.query.to
      );

    const therapistId =
      req.query.therapist
        ? String(
            req.query.therapist
          )
        : '';

    const appointmentFilter =
      {};

    if (
      from ||
      to
    ) {
      appointmentFilter.startsAt =
        {};

      if (from) {
        appointmentFilter
          .startsAt
          .$gte =
            startOfDay(
              from
            );
      }

      if (to) {
        appointmentFilter
          .startsAt
          .$lte =
            endOfDay(
              to
            );
      }
    }

    if (therapistId) {
      appointmentFilter.therapist =
        therapistId;
    }

    const [
      appointments,
      allActivePatients,
      therapists
    ] =
      await Promise.all([
        Appointment
          .find(
            appointmentFilter
          )
          .populate(
            'patient',
            'name'
          )
          .populate(
            'therapist',
            'name username active role canTreatPatients'
          )
          .sort({
            startsAt: 1
          })
          .lean(),

        Patient
          .find({
            active: true
          })
          .select(
            '_id assignedTherapists createdAt'
          )
          .lean(),

        User
          .find({
            active: true,
            $or: [
              {
                role: 'therapist'
              },
              {
                canTreatPatients: true
              }
            ]
          })
          .select(
            'name username role canTreatPatients'
          )
          .sort({
            name: 1
          })
          .lean()
      ]);

    /*
     * If one therapist is selected,
     * show only patients assigned to them.
     */
    const activePatients =
      therapistId
        ? allActivePatients.filter(
            patient =>
              (
                patient
                  .assignedTherapists ||
                []
              ).some(
                id =>
                  String(id) ===
                  therapistId
              )
          )
        : allActivePatients;

    const totalAppointments =
      appointments.length;

    const scheduledAppointments =
      appointments.filter(
        appointment =>
          appointment.status ===
          'scheduled'
      );

    const completedAppointments =
      appointments.filter(
        appointment =>
          appointment.status ===
          'completed'
      );

    const cancelledAppointments =
      appointments.filter(
        appointment =>
          appointment.status ===
          'cancelled'
      );

    /*
     * Cancelled appointments are ignored
     * financially even if old data somehow
     * contains an amount.
     */
    const validFinancialAppointments =
      appointments.filter(
        appointment =>
          appointment.status !==
          'cancelled'
      );

    const paidAppointments =
      validFinancialAppointments.filter(
        appointment =>
          appointment.paid === true
      );

    const unpaidAppointments =
      validFinancialAppointments.filter(
        appointment =>
          appointment.paid !== true
      );

    const revenue =
      paidAppointments.reduce(
        (
          total,
          appointment
        ) =>
          total +
          Number(
            appointment.amount ||
            0
          ),
        0
      );

    const unpaidAmount =
      unpaidAppointments.reduce(
        (
          total,
          appointment
        ) =>
          total +
          Number(
            appointment.amount ||
            0
          ),
        0
      );

    const averageSessionRevenue =
      paidAppointments.length
        ? revenue /
          paidAppointments.length
        : 0;

    const cancellationRate =
      totalAppointments
        ? (
            cancelledAppointments
              .length /
            totalAppointments
          ) * 100
        : 0;

    const completionRate =
      totalAppointments
        ? (
            completedAppointments
              .length /
            totalAppointments
          ) * 100
        : 0;

    /*
     * -------------------------------------------------------
     * MONTHLY TREND
     * -------------------------------------------------------
     */

    const monthlyMap =
      new Map();

    appointments.forEach(
      appointment => {
        const date =
          new Date(
            appointment.startsAt
          );

        const key =
          monthKey(
            date
          );

        if (
          !monthlyMap.has(
            key
          )
        ) {
          monthlyMap.set(
            key,
            {
              key,
              label:
                monthLabel(
                  date
                ),
              appointments: 0,
              completed: 0,
              cancelled: 0,
              revenue: 0
            }
          );
        }

        const month =
          monthlyMap.get(
            key
          );

        month.appointments++;

        if (
          appointment.status ===
          'completed'
        ) {
          month.completed++;
        }

        if (
          appointment.status ===
          'cancelled'
        ) {
          month.cancelled++;
        }

        if (
          appointment.status !==
            'cancelled' &&
          appointment.paid
        ) {
          month.revenue +=
            Number(
              appointment.amount ||
              0
            );
        }
      }
    );

    const monthlyTrend =
      Array.from(
        monthlyMap.values()
      ).sort(
        (a, b) =>
          a.key.localeCompare(
            b.key
          )
      );

    /*
     * -------------------------------------------------------
     * THERAPIST PERFORMANCE
     * -------------------------------------------------------
     */

    const therapistMap =
      new Map();

    therapists.forEach(
      therapist => {
        therapistMap.set(
          String(
            therapist._id
          ),
          {
            therapistId:
              String(
                therapist._id
              ),

            name:
              therapist.name ||
              therapist.username,

            appointments: 0,
            completed: 0,
            scheduled: 0,
            cancelled: 0,
            paidAppointments: 0,
            unpaidAppointments: 0,
            revenue: 0,
            unpaidAmount: 0,
            averageRevenue: 0,
            cancellationRate: 0,
            completionRate: 0
          }
        );
      }
    );

    appointments.forEach(
      appointment => {
        const therapist =
          appointment.therapist;

        if (!therapist) {
          return;
        }

        const id =
          String(
            therapist._id ||
            therapist
          );

        if (
          !therapistMap.has(
            id
          )
        ) {
          therapistMap.set(
            id,
            {
              therapistId:
                id,

              name:
                therapist.name ||
                therapist.username ||
                'Unknown therapist',

              appointments: 0,
              completed: 0,
              scheduled: 0,
              cancelled: 0,
              paidAppointments: 0,
              unpaidAppointments: 0,
              revenue: 0,
              unpaidAmount: 0,
              averageRevenue: 0,
              cancellationRate: 0,
              completionRate: 0
            }
          );
        }

        const item =
          therapistMap.get(
            id
          );

        item.appointments++;

        if (
          appointment.status ===
          'completed'
        ) {
          item.completed++;
        }

        if (
          appointment.status ===
          'scheduled'
        ) {
          item.scheduled++;
        }

        if (
          appointment.status ===
          'cancelled'
        ) {
          item.cancelled++;

          return;
        }

        if (
          appointment.paid
        ) {
          item.paidAppointments++;

          item.revenue +=
            Number(
              appointment.amount ||
              0
            );
        } else {
          item.unpaidAppointments++;

          item.unpaidAmount +=
            Number(
              appointment.amount ||
              0
            );
        }
      }
    );

    const therapistPerformance =
      Array.from(
        therapistMap.values()
      )
        .map(
          item => ({
            ...item,

            averageRevenue:
              item.paidAppointments
                ? item.revenue /
                  item
                    .paidAppointments
                : 0,

            cancellationRate:
              item.appointments
                ? (
                    item.cancelled /
                    item.appointments
                  ) * 100
                : 0,

            completionRate:
              item.appointments
                ? (
                    item.completed /
                    item.appointments
                  ) * 100
                : 0
          })
        )
        .filter(
          item =>
            !therapistId ||
            item.therapistId ===
              therapistId
        )
        .sort(
          (a, b) =>
            b.revenue -
            a.revenue
        );

    /*
     * -------------------------------------------------------
     * DAYS OF WEEK
     * -------------------------------------------------------
     */

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];

    const dayCounts =
      dayNames.map(
        day => ({
          day,
          appointments: 0
        })
      );

    appointments.forEach(
      appointment => {
        const date =
          new Date(
            appointment.startsAt
          );

        dayCounts[
          date.getDay()
        ].appointments++;
      }
    );

    const busiestDays =
      [
        ...dayCounts.slice(
          1
        ),
        dayCounts[0]
      ];

    /*
     * -------------------------------------------------------
     * HOURS OF DAY
     * -------------------------------------------------------
     */

    const hourMap =
      new Map();

    appointments.forEach(
      appointment => {
        const hour =
          new Date(
            appointment.startsAt
          ).getHours();

        if (
          !hourMap.has(
            hour
          )
        ) {
          hourMap.set(
            hour,
            0
          );
        }

        hourMap.set(
          hour,
          hourMap.get(
            hour
          ) + 1
        );
      }
    );

    const busiestHours =
      Array.from(
        hourMap.entries()
      )
        .map(
          ([
            hour,
            count
          ]) => ({
            hour,
            label:
              new Date(
                2000,
                0,
                1,
                hour
              ).toLocaleTimeString(
                'en-US',
                {
                  hour: 'numeric'
                }
              ),
            appointments:
              count
          })
        )
        .sort(
          (a, b) =>
            a.hour -
            b.hour
        );

    /*
     * -------------------------------------------------------
     * PATIENT INFORMATION
     * -------------------------------------------------------
     */

    let newPatients = 0;

    if (
      from ||
      to
    ) {
      newPatients =
        activePatients.filter(
          patient => {
            const created =
              new Date(
                patient.createdAt
              );

            if (
              from &&
              created <
                startOfDay(
                  from
                )
            ) {
              return false;
            }

            if (
              to &&
              created >
                endOfDay(
                  to
                )
            ) {
              return false;
            }

            return true;
          }
        ).length;
    }

    return res.json({
      range: {
        from:
          from
            ? startOfDay(
                from
              )
            : null,

        to:
          to
            ? endOfDay(
                to
              )
            : null,

        therapist:
          therapistId ||
          null
      },

      summary: {
        totalAppointments,

        scheduled:
          scheduledAppointments
            .length,

        completed:
          completedAppointments
            .length,

        cancelled:
          cancelledAppointments
            .length,

        paidAppointments:
          paidAppointments
            .length,

        unpaidAppointments:
          unpaidAppointments
            .length,

        revenue,

        unpaidAmount,

        averageSessionRevenue,

        cancellationRate,

        completionRate,

        activePatients:
          activePatients.length,

        newPatients
      },

      status: {
        scheduled:
          scheduledAppointments
            .length,

        completed:
          completedAppointments
            .length,

        cancelled:
          cancelledAppointments
            .length
      },

      payments: {
        paid:
          paidAppointments
            .length,

        unpaid:
          unpaidAppointments
            .length
      },

      monthlyTrend,

      therapistPerformance,

      busiestDays,

      busiestHours
    });
  } catch (error) {
    next(error);
  }
};