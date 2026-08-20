import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import {
  Appointment,
  Patient,
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
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit {

  appointments: Appointment[] = [];
  patients: Patient[] = [];
  therapists: User[] = [];

  selectedAppointment?: Appointment;
  editingAppointment?: Appointment;

  showForm = false;
  showNoteForm = false;

  error = '';

  selectedTherapist = '';
  selectedPatient = '';
  selectedDay = '';


  form = this.fb.group({
    patient: ['', Validators.required],

    therapist: [''],

    startsAt: ['', Validators.required],

    durationMinutes: [
      50,
      [
        Validators.required,
        Validators.min(1)
      ]
    ],

    location: [''],

    status: [
      'scheduled' as Appointment['status'],
      Validators.required
    ],

    amount: [
      0,
      Validators.min(0)
    ],

    paid: [false],

    note: ['']
  });


  noteForm = this.fb.group({
    focus: [
      '',
      Validators.required
    ],

    note: [
      '',
      Validators.required
    ]
  });


  constructor(
    private fb: FormBuilder,
    private practice: PracticeService,
    private usersApi: UserService,
    public auth: AuthService
  ) {}


  ngOnInit(): void {

    /*
     * Location is required for:
     * - admin
     * - users allowed to manage location
     */
    if (
      this.auth.user?.role === 'admin' ||
      this.auth.user?.canManageLocation
    ) {
      this.form.controls.location
        .addValidators(
          Validators.required
        );

      this.form.controls.location
        .updateValueAndValidity();
    }


    this.load();


    this.practice
      .getPatients()
      .subscribe(patients => {

        this.patients = patients;

      });


    /*
     * Admin needs therapist selector.
     */
    if (
      this.auth.user?.role === 'admin'
    ) {

      this.form.controls.therapist
        .addValidators(
          Validators.required
        );

      this.form.controls.therapist
        .updateValueAndValidity();


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
     LOAD APPOINTMENTS
  ===================================================== */

  load(): void {

    this.practice
      .getAppointments(
        undefined,
        undefined,
        this.selectedTherapist
      )
      .subscribe({
        next: appointments => {

          this.appointments =
            appointments;

          this.error = '';

        },

        error: error => {

          this.error =
            error.error?.message ||
            'Could not load appointments';

        }
      });

  }


  /* =====================================================
     FILTERED APPOINTMENTS
  ===================================================== */

  get filteredAppointments(): Appointment[] {

    return this.appointments
      .filter(appointment => {

        const patientMatches =
          !this.selectedPatient ||
          this.referenceId(
            appointment.patient
          ) === this.selectedPatient;


        const dayMatches =
          !this.selectedDay ||
          this.localDay(
            appointment.startsAt
          ) === this.selectedDay;


        return (
          patientMatches &&
          dayMatches
        );

      });

  }


  /* =====================================================
     GROUP APPOINTMENTS BY DAY
  ===================================================== */

  get appointmentGroups(): Array<{
    day: string;
    appointments: Appointment[];
  }> {

    const groups =
      new Map<
        string,
        Appointment[]
      >();


    for (
      const appointment
      of this.filteredAppointments
    ) {

      const day =
        this.localDay(
          appointment.startsAt
        );


      const existing =
        groups.get(day) || [];


      existing.push(
        appointment
      );


      groups.set(
        day,
        existing
      );

    }


    return Array
      .from(
        groups.entries()
      )
      .map(
        ([day, appointments]) => ({
          day,
          appointments
        })
      );

  }


  /* =====================================================
     CLEAR FILTERS
  ===================================================== */

  clearFilters(): void {

    this.selectedPatient = '';
    this.selectedDay = '';
    this.selectedTherapist = '';

    this.load();

  }


  /* =====================================================
     PATIENT NAME
  ===================================================== */

  patientName(
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
     OWN APPOINTMENT
  ===================================================== */

  isOwnAppointment(
    appointment: Appointment
  ): boolean {

    return (
      this.referenceId(
        appointment.therapist
      ) ===
      this.auth.user?._id
    );

  }


  /* =====================================================
     REFERENCE ID
  ===================================================== */

  private referenceId(
    value:
      string |
      Patient |
      User |
      undefined
  ): string {

    if (!value) {
      return '';
    }

    return typeof value === 'string'
      ? value
      : value._id || '';

  }


  /* =====================================================
     DATE FOR DATETIME-LOCAL INPUT
  ===================================================== */

  private localDateTime(
    value: string
  ): string {

    const date =
      new Date(value);

    const offset =
      date.getTimezoneOffset() *
      60000;


    return new Date(
      date.getTime() -
      offset
    )
      .toISOString()
      .slice(
        0,
        16
      );

  }


  /* =====================================================
     LOCAL DAY
  ===================================================== */

  private localDay(
    value: string
  ): string {

    const date =
      new Date(value);


    const year =
      date.getFullYear();


    const month =
      String(
        date.getMonth() + 1
      )
        .padStart(
          2,
          '0'
        );


    const day =
      String(
        date.getDate()
      )
        .padStart(
          2,
          '0'
        );


    return (
      `${year}-${month}-${day}`
    );

  }


  /* =====================================================
     CREATE APPOINTMENT
  ===================================================== */

  openCreate(): void {

    this.editingAppointment =
      undefined;


    /*
     * Important:
     * re-enable financial controls because they
     * may have been disabled when editing a
     * paid appointment.
     */
    this.form.controls.amount.enable();
    this.form.controls.paid.enable();


    this.form.reset({
      patient: '',

      therapist: '',

      startsAt: '',

      durationMinutes: 50,

      location: '',

      status: 'scheduled',

      paid: false,

      amount: 0,

      note: ''
    });


    this.error = '';

    this.showForm = true;

  }


  /* =====================================================
     EDIT APPOINTMENT
  ===================================================== */

  openEdit(
    appointment: Appointment
  ): void {

    this.editingAppointment =
      appointment;


    /*
     * Enable controls first before reset.
     *
     * This prevents a previously locked form
     * from remaining disabled.
     */
    this.form.controls.amount.enable();
    this.form.controls.paid.enable();


    this.form.reset({

      patient:
        typeof appointment.patient === 'string'
          ? appointment.patient
          : appointment.patient._id,


      therapist:
        typeof appointment.therapist === 'string'
          ? appointment.therapist
          : appointment.therapist?._id || '',


      startsAt:
        this.localDateTime(
          appointment.startsAt
        ),


      durationMinutes:
        appointment.durationMinutes,


      location:
        appointment.location || '',


      status:
        appointment.status,


      paid:
        !!appointment.paid,


      amount:
        Number(
          appointment.amount || 0
        ),


      note:
        appointment.note || ''

    });


    /*
     * =====================================================
     * PAID APPOINTMENT LOCK
     * =====================================================
     *
     * Normal therapist:
     *
     * PAID appointment:
     * - Cannot change amount
     * - Cannot change Paid -> Unpaid
     *
     * Admin:
     * - Can change both
     */
    const isPaid =
      appointment.paid === true;


    const isAdmin =
      this.auth.user?.role ===
      'admin';


    if (
      isPaid &&
      !isAdmin
    ) {

      this.form.controls.amount
        .disable();

      this.form.controls.paid
        .disable();

    }


    this.error = '';

    this.showForm = true;

  }


  /* =====================================================
     CLOSE APPOINTMENT FORM
  ===================================================== */

  closeForm(): void {

    this.showForm = false;

    this.editingAppointment =
      undefined;


    /*
     * Reset locked controls for next use.
     */
    this.form.controls.amount.enable();
    this.form.controls.paid.enable();

  }


  /* =====================================================
     CANCEL APPOINTMENT
  ===================================================== */

  cancelAppointment(
    appointment: Appointment
  ): void {

    if (
      !appointment._id ||
      appointment.status === 'cancelled' ||
      appointment.status === 'completed'
    ) {
      return;
    }


    const allowed =
      this.auth.user?.role === 'admin' ||
      this.isOwnAppointment(
        appointment
      );


    if (!allowed) {

      this.error =
        'You can only cancel your own appointments';

      return;

    }


    const confirmed =
      confirm(
        `Cancel the appointment for ${this.patientName(
          appointment
        )}?`
      );


    if (!confirmed) {
      return;
    }


    this.practice
      .cancelAppointment(
        appointment._id
      )
      .subscribe({

        next: () => {

          this.error = '';

          this.load();

        },


        error: error => {

          this.error =
            error.error?.message ||
            'Could not cancel appointment';

        }

      });

  }


  /* =====================================================
     OPEN SESSION NOTE
  ===================================================== */

  openSessionNote(
    appointment: Appointment
  ): void {

    this.selectedAppointment =
      appointment;


    this.noteForm.reset();


    this.showNoteForm =
      true;

  }


  /* =====================================================
     CAN ADD NOTE
  ===================================================== */

  canAddNote(
    appointment: Appointment
  ): boolean {

    return (
      new Date(
        appointment.startsAt
      ).getTime() <= Date.now() &&

      appointment.status !==
        'cancelled'
    );

  }


  /* =====================================================
     SAVE SESSION NOTE
  ===================================================== */

  saveSessionNote(): void {

    if (
      !this.selectedAppointment?._id ||
      this.noteForm.invalid
    ) {
      return;
    }


    const value =
      this.noteForm.getRawValue();


    this.practice
      .addAppointmentNote(
        this.selectedAppointment._id,

        value.focus!,

        value.note!
      )
      .subscribe({

        next: () => {

          this.showNoteForm =
            false;

          this.load();

        },


        error: error => {

          this.error =
            error.error?.message ||
            'Could not save session note';

        }

      });

  }


  /* =====================================================
     SAVE APPOINTMENT
  ===================================================== */

  save(): void {

    if (
      this.form.invalid
    ) {
      return;
    }


    /*
     * IMPORTANT:
     *
     * getRawValue() includes disabled controls.
     *
     * This means that when a therapist edits an
     * already-paid appointment, the original amount
     * and paid=true are preserved in the request.
     */
    const value =
      this.form.getRawValue();


    /*
     * Extra frontend safety.
     *
     * Even if something somehow changes the disabled
     * controls, restore the original financial data
     * for a therapist editing a paid appointment.
     */
    if (
      this.editingAppointment?.paid === true &&
      this.auth.user?.role !== 'admin'
    ) {

      value.amount =
        Number(
          this.editingAppointment.amount ||
          0
        );

      value.paid =
        true;

    }


    const appointment:
      Appointment = {

      patient:
        value.patient!,


      therapist:
        value.therapist ||
        undefined,


      startsAt:
        value.startsAt!,


      durationMinutes:
        Number(
          value.durationMinutes ||
          50
        ),


      status:
        value.status!,


      paid:
        !!value.paid,


      amount:
        Number(
          value.amount ||
          0
        ),


      note:
        value.note ||
        '',


      ...(
        this.auth.user?.role === 'admin' ||
        this.auth.user?.canManageLocation
          ? {
              location:
                value.location ||
                ''
            }
          : {}
      )

    };


    const request =
      this.editingAppointment?._id

        ? this.practice
            .updateAppointment(
              this.editingAppointment._id,
              appointment
            )

        : this.practice
            .createAppointment(
              appointment
            );


    request.subscribe({

      next: () => {

        this.error = '';

        this.closeForm();

        this.load();

      },


      error: error => {

        this.error =
          error.error?.message ||
          'Could not save appointment';

      }

    });

  }


  /* =====================================================
     DELETE APPOINTMENT
  ===================================================== */

  deleteAppointment(
    appointment: Appointment
  ): void {

    if (
      this.auth.user?.role !== 'admin' ||
      !appointment._id ||
      !confirm(
        `Delete the appointment for ${this.patientName(
          appointment
        )}?`
      )
    ) {
      return;
    }


    this.practice
      .deleteAppointment(
        appointment._id
      )
      .subscribe({

        next: () => {

          this.error = '';

          this.load();

        },


        error: error => {

          this.error =
            error.error?.message ||
            'Could not delete appointment';

        }

      });

  }

}