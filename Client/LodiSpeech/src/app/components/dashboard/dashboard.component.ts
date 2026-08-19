import { Component, OnInit } from '@angular/core';
import { Appointment, Patient, User } from '../../models/patient.model';
import { AuthService } from '../../services/auth.service';
import { PracticeService } from '../../services/practice.service';
import { UserService } from '../../services/user.service';
@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    patients: Patient[] = [];
    appointments: Appointment[] = [];
    therapists: User[] = [];
    selectedTherapist = '';
    loading = true;
    today = new Date();
    constructor(
        private practice: PracticeService,
        private usersApi: UserService,
        public auth: AuthService
    ) { }
    ngOnInit() {
        this.practice.getPatients().subscribe({
            next: patients => {
                this.patients = patients;
                this.loading = false;
            },
            error: () => this.loading = false
        });
        this.loadAppointments();
        if (this.auth.user?.role === 'admin') {
            this.usersApi.list().subscribe(users => {
                this.therapists = users.filter(user =>
                    user.active &&
                    (user.role === 'therapist' || !!user.canTreatPatients)
                );
            });
        }
    }
    loadAppointments() {
        this.practice.getAppointments(
            undefined,
            undefined,
            this.selectedTherapist
        ).subscribe(appointments => {
            this.appointments = appointments;
        });
    }
    get displayedPatients() {
        if (!this.selectedTherapist) return this.patients;
        return this.patients.filter(patient =>
            (patient.assignedTherapists || []).some(therapist =>
                (typeof therapist === 'string' ? therapist : therapist._id) ===
                this.selectedTherapist
            )
        );
    }
    get greeting() {
        const hour = new Date().getHours();
        if (hour < 12)
            return 'Good morning';
        if (hour < 18)
            return 'Good afternoon';
        return 'Good evening';
    }
    get displayName() {
        return this.auth.user?.name || 'Therapist';
    }
    get upcomingAppointments() {
        const now = Date.now();
        return this.appointments.filter(appointment => new Date(appointment.startsAt).getTime() >= now &&
            appointment.status === 'scheduled');
    }
    get unpaid() {
        return this.appointments.filter(appointment => !appointment.paid && appointment.status !== 'cancelled').length;
    }
    get revenue() {
        return this.appointments
            .filter(appointment =>
                appointment.paid && appointment.status !== 'cancelled'
            )
            .reduce((total, appointment) => total + Number(appointment.amount || 0), 0);
    }
    patientName(appointment: Appointment) {
        return typeof appointment.patient === 'string'
            ? 'Patient'
            : appointment.patient.name;
    }
    therapistName(appointment: Appointment) {
        if (!appointment.therapist || typeof appointment.therapist === 'string') {
            return '';
        }
        return appointment.therapist.name;
    }
}
