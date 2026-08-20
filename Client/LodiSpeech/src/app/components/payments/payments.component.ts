import {
  Component,
  OnInit
} from '@angular/core';

import {
  Appointment,
  User
} from '../../models/patient.model';

import {
  AuthService
} from '../../services/auth.service';

import {
  PracticeService
} from '../../services/practice.service';

import {
  UserService
} from '../../services/user.service';


@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: [
    './payments.component.css'
  ]
})
export class PaymentsComponent implements OnInit {

  appointments: Appointment[] = [];

  therapists: User[] = [];

  selectedTherapist = '';


  constructor(
    private practice: PracticeService,
    private usersApi: UserService,
    public auth: AuthService
  ) {}


  ngOnInit(): void {

    this.load();

    if (this.auth.user?.role === 'admin') {

      this.usersApi
        .list()
        .subscribe(users => {

          this.therapists =
            users.filter(user =>
              user.active &&
              (
                user.role === 'therapist' ||
                !!user.canTreatPatients
              )
            );

        });

    }

  }


  /* =====================================================
     LOAD PAYMENTS
  ===================================================== */

  load(): void {

    this.practice
      .getAppointments(
        undefined,
        undefined,
        this.selectedTherapist
      )
      .subscribe(appointments => {

        /*
         * Cancelled appointments are NOT financial
         * transactions.
         *
         * They are completely removed from the finance
         * page.
         */
        this.appointments =
          appointments.filter(
            appointment =>
              appointment.status !== 'cancelled'
          );

      });

  }


  /* =====================================================
     PATIENT NAME
  ===================================================== */

  name(
    appointment: Appointment
  ): string {

    return typeof appointment.patient === 'string'
      ? 'Patient'
      : appointment.patient.name;

  }


  /* =====================================================
     THERAPIST NAME
  ===================================================== */

  therapistName(
    appointment: Appointment
  ): string {

    return (
      !appointment.therapist ||
      typeof appointment.therapist === 'string'
    )
      ? 'Not assigned'
      : appointment.therapist.name;

  }


  /* =====================================================
     MARK PAID / UNPAID
  ===================================================== */

  markPaid(
    appointment: Appointment
  ): void {

    /*
     * Safety:
     * cancelled appointments can never be paid.
     */
    if (appointment.status === 'cancelled') {
      return;
    }

    const id =
      appointment._id ||
      String(
        (
          appointment as Appointment & {
            id?: string;
          }
        ).id || ''
      );

    if (!id) {
      return;
    }

    this.practice
      .updateAppointment(
        id,
        {
          startsAt:
            appointment.startsAt,

          durationMinutes:
            appointment.durationMinutes,

          status:
            appointment.status,

          paid:
            !appointment.paid,

          amount:
            appointment.amount,

          note:
            appointment.note || ''
        }
      )
      .subscribe(() => {

        this.load();

      });

  }


  /* =====================================================
     TOTAL BILLED
  ===================================================== */

  get total(): number {

    return this.appointments
      .filter(
        appointment =>
          appointment.status !== 'cancelled'
      )
      .reduce(
        (
          total,
          appointment
        ) =>
          total +
          Number(
            appointment.amount || 0
          ),
        0
      );

  }


  /* =====================================================
     OUTSTANDING
  ===================================================== */

  get outstanding(): number {

    return this.appointments
      .filter(
        appointment =>
          !appointment.paid &&
          appointment.status !== 'cancelled'
      )
      .reduce(
        (
          total,
          appointment
        ) =>
          total +
          Number(
            appointment.amount || 0
          ),
        0
      );

  }

}