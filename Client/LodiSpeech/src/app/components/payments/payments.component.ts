import { Component, OnInit } from '@angular/core';
import { Appointment, User } from '../../models/patient.model';
import { AuthService } from '../../services/auth.service';
import { PracticeService } from '../../services/practice.service';
import { UserService } from '../../services/user.service';
@Component({ selector: 'app-payments', templateUrl: './payments.component.html', styleUrls: ['./payments.component.css'] })
export class PaymentsComponent implements OnInit {
    appointments: Appointment[] = [];
    therapists: User[] = [];
    selectedTherapist = '';
    constructor(
        private practice: PracticeService,
        private usersApi: UserService,
        public auth: AuthService
    ) { }
    ngOnInit() {
        this.load();
        if (this.auth.user?.role === 'admin') {
            this.usersApi.list().subscribe(users => {
                this.therapists = users.filter(user =>
                    user.active &&
                    (user.role === 'therapist' || !!user.canTreatPatients)
                );
            });
        }
    }
    load() {
        this.practice.getAppointments(
            undefined,
            undefined,
            this.selectedTherapist
        ).subscribe(a => this.appointments = a);
    }
    name(a: Appointment) { return typeof a.patient === 'string' ? 'Patient' : a.patient.name; }
    therapistName(a: Appointment) {
        return !a.therapist || typeof a.therapist === 'string'
            ? 'Not assigned'
            : a.therapist.name;
    }
    markPaid(a: Appointment) { const id = a._id || String((a as Appointment & {
        id?: string;
    }).id || ''); if (!id)
        return; this.practice.updateAppointment(id, { startsAt: a.startsAt, durationMinutes: a.durationMinutes, status: a.status, paid: !a.paid, amount: a.amount, note: a.note || '' }).subscribe(() => this.load()); }
    get total() {
        return this.appointments
            .filter(a => a.status !== 'cancelled')
            .reduce((sum, a) => sum + Number(a.amount || 0), 0);
    }
    get outstanding() {
        return this.appointments
            .filter(a => !a.paid && a.status !== 'cancelled')
            .reduce((sum, a) => sum + Number(a.amount || 0), 0);
    }
}
