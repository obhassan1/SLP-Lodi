import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Appointment, Patient, User } from '../../models/patient.model';
import { AuthService } from '../../services/auth.service';
import { PracticeService } from '../../services/practice.service';
import { UserService } from '../../services/user.service';

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
    durationMinutes: [50, [Validators.required, Validators.min(1)]],
    location: [''],
    status: ['scheduled' as Appointment['status'], Validators.required],
    amount: [0, Validators.min(0)],
    paid: [false],
    note: ['']
  });

  noteForm = this.fb.group({
    focus: ['', Validators.required],
    note: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private practice: PracticeService,
    private usersApi: UserService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    if (
      this.auth.user?.role === 'admin' ||
      this.auth.user?.canManageLocation
    ) {
      this.form.controls.location.addValidators(Validators.required);
      this.form.controls.location.updateValueAndValidity();
    }

    this.load();

    this.practice.getPatients().subscribe(patients => {
      this.patients = patients;
    });

    if (this.auth.user?.role === 'admin') {
      this.form.controls.therapist.addValidators(Validators.required);
      this.form.controls.therapist.updateValueAndValidity();

      this.usersApi.list().subscribe(users => {
        this.therapists = users.filter(user =>
          user.active &&
          (user.role === 'therapist' || !!user.canTreatPatients)
        );
      });
    }
  }

  load(): void {
    this.practice.getAppointments(
      undefined,
      undefined,
      this.selectedTherapist
    ).subscribe(appointments => {
      this.appointments = appointments;
    });
  }

  get filteredAppointments(): Appointment[] {
    return this.appointments.filter(appointment => {
      const patientMatches = !this.selectedPatient ||
        this.referenceId(appointment.patient) === this.selectedPatient;

      const dayMatches = !this.selectedDay ||
        this.localDay(appointment.startsAt) === this.selectedDay;

      return patientMatches && dayMatches;
    });
  }

  get appointmentGroups(): Array<{
    day: string;
    appointments: Appointment[];
  }> {
    const groups = new Map<string, Appointment[]>();

    for (const appointment of this.filteredAppointments) {
      const day = this.localDay(appointment.startsAt);
      const existing = groups.get(day) || [];
      existing.push(appointment);
      groups.set(day, existing);
    }

    return Array.from(groups.entries()).map(([day, appointments]) => ({
      day,
      appointments
    }));
  }

  clearFilters(): void {
    this.selectedPatient = '';
    this.selectedDay = '';
    this.selectedTherapist = '';
    this.load();
  }

  patientName(appointment: Appointment): string {
    return typeof appointment.patient === 'string'
      ? 'Patient'
      : appointment.patient.name;
  }


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
    this.isOwnAppointment(appointment);

  if (!allowed) {
    this.error =
      'You can only cancel your own appointments';

    return;
  }

  const confirmed = confirm(
    `Cancel the appointment for ${this.patientName(
      appointment
    )}?`
  );

  if (!confirmed) {
    return;
  }

  this.practice
    .cancelAppointment(appointment._id)
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
  therapistName(appointment: Appointment): string {
    return !appointment.therapist || typeof appointment.therapist === 'string'
      ? 'Not assigned'
      : appointment.therapist.name;
  }

  isOwnAppointment(appointment: Appointment): boolean {
    return this.referenceId(appointment.therapist) === this.auth.user?._id;
  }

  private referenceId(value: string | Patient | User | undefined): string {
    if (!value) return '';
    return typeof value === 'string' ? value : value._id || '';
  }

  private localDateTime(value: string): string {
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  private localDay(value: string): string {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  openCreate(): void {
    this.error = '';
    this.editingAppointment = undefined;
    this.form.reset({
      patient: '',
      therapist: '',
      durationMinutes: 50,
      location: '',
      status: 'scheduled',
      amount: 0,
      paid: false,
      note: ''
    });
    this.showForm = true;
  }

  openEdit(appointment: Appointment): void {
    this.error = '';
    this.editingAppointment = appointment;
    this.form.setValue({
      patient: this.referenceId(appointment.patient),
      therapist: this.referenceId(appointment.therapist),
      startsAt: this.localDateTime(appointment.startsAt),
      durationMinutes: appointment.durationMinutes,
      location: appointment.location || '',
      status: appointment.status,
      amount: appointment.amount,
      paid: appointment.paid,
      note: appointment.note || ''
    });
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingAppointment = undefined;
  }

  openSessionNote(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.noteForm.reset();
    this.showNoteForm = true;
  }

  canAddNote(appointment: Appointment): boolean {
    return new Date(appointment.startsAt).getTime() <= Date.now() &&
      appointment.status !== 'cancelled';
  }

  saveSessionNote(): void {
    if (!this.selectedAppointment?._id || this.noteForm.invalid) return;

    const value = this.noteForm.getRawValue();
    this.practice.addAppointmentNote(
      this.selectedAppointment._id,
      value.focus!,
      value.note!
    ).subscribe({
      next: () => {
        this.showNoteForm = false;
        this.load();
      },
      error: error => {
        this.error = error.error?.message || 'Could not save session note';
      }
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    const appointment: Appointment = {
      patient: value.patient!,
      therapist: value.therapist || undefined,
      startsAt: value.startsAt!,
      durationMinutes: Number(value.durationMinutes || 50),
      status: value.status!,
      paid: !!value.paid,
      amount: Number(value.amount || 0),
      note: value.note || '',
      ...(
        this.auth.user?.role === 'admin' ||
        this.auth.user?.canManageLocation
          ? { location: value.location || '' }
          : {}
      )
    };

    const request = this.editingAppointment?._id
      ? this.practice.updateAppointment(this.editingAppointment._id, appointment)
      : this.practice.createAppointment(appointment);

    request.subscribe({
      next: () => {
        this.closeForm();
        this.load();
      },
      error: error => {
        this.error = error.error?.message || 'Could not save appointment';
      }
    });
  }

  deleteAppointment(appointment: Appointment): void {
    if (
      this.auth.user?.role !== 'admin' ||
      !appointment._id ||
      !confirm(`Delete the appointment for ${this.patientName(appointment)}?`)
    ) {
      return;
    }

    this.practice.deleteAppointment(appointment._id).subscribe({
      next: () => this.load(),
      error: error => {
        this.error = error.error?.message || 'Could not delete appointment';
      }
    });
  }
}
