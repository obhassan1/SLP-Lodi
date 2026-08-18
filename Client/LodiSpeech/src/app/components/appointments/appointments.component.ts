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
    showForm = false;
    showNoteForm = false;
    error = '';
    form = this.fb.group({
        patient: ['', Validators.required],
        therapist: [''],
        startsAt: ['', Validators.required],
        durationMinutes: [50, Validators.required],
        amount: [0],
        paid: [false],
        note: ['']
    });
    noteForm = this.fb.group({
        focus: ['', Validators.required],
        note: ['', Validators.required]
    });
    constructor(private fb: FormBuilder, private practice: PracticeService, private usersApi: UserService, public auth: AuthService) { }
    ngOnInit() {
        this.load();
        this.practice.getPatients().subscribe(patients => this.patients = patients);
        if (this.auth.user?.role === 'admin') {
            this.usersApi.list().subscribe(users => {
                this.therapists = users.filter(user => user.role === 'therapist' && user.active);
            });
        }
    }
    load() {
        this.practice.getAppointments().subscribe(appointments => {
            this.appointments = appointments;
        });
    }
    patientName(appointment: Appointment) {
        return typeof appointment.patient === 'string'
            ? 'Patient'
            : appointment.patient.name;
    }
    therapistName(appointment: Appointment) {
        return !appointment.therapist || typeof appointment.therapist === 'string'
            ? 'Not assigned'
            : appointment.therapist.name;
    }
    openSessionNote(appointment: Appointment) {
        this.selectedAppointment = appointment;
        this.noteForm.reset();
        this.showNoteForm = true;
    }
    canAddNote(appointment: Appointment) {
        return new Date(appointment.startsAt).getTime() <= Date.now() &&
            appointment.status !== 'cancelled';
    }
    saveSessionNote() {
        if (!this.selectedAppointment?._id || this.noteForm.invalid)
            return;
        const value = this.noteForm.getRawValue();
        this.practice.addAppointmentNote(this.selectedAppointment._id, value.focus!, value.note!).subscribe({
            next: () => {
                this.showNoteForm = false;
                this.load();
            },
            error: error => this.error = error.error?.message || 'Could not save note'
        });
    }
    save() {
        if (this.form.invalid)
            return;
        const value = this.form.getRawValue();
        this.practice.createAppointment({
            patient: value.patient!,
            therapist: value.therapist || undefined,
            startsAt: value.startsAt!,
            durationMinutes: Number(value.durationMinutes || 50),
            status: 'scheduled',
            paid: !!value.paid,
            amount: Number(value.amount || 0),
            note: value.note || ''
        }).subscribe({
            next: () => {
                this.showForm = false;
                this.form.reset({ durationMinutes: 50, amount: 0, paid: false });
                this.load();
            },
            error: error => this.error = error.error?.message || 'Could not save appointment'
        });
    }
}
