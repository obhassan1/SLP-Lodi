import { Component, OnInit } from '@angular/core';
import { Appointment } from '../../models/patient.model';
import { PracticeService } from '../../services/practice.service';
@Component({ selector: 'app-payments', templateUrl: './payments.component.html', styleUrls: ['./payments.component.css'] })
export class PaymentsComponent implements OnInit {
    appointments: Appointment[] = [];
    constructor(private practice: PracticeService) { }
    ngOnInit() { this.load(); }
    load() { this.practice.getAppointments().subscribe(a => this.appointments = a); }
    name(a: Appointment) { return typeof a.patient === 'string' ? 'Patient' : a.patient.name; }
    markPaid(a: Appointment) { const id = a._id || String((a as Appointment & {
        id?: string;
    }).id || ''); if (!id)
        return; this.practice.updateAppointment(id, { startsAt: a.startsAt, durationMinutes: a.durationMinutes, status: a.status, paid: !a.paid, amount: a.amount, note: a.note || '' }).subscribe(() => this.load()); }
    get total() { return this.appointments.reduce((sum, a) => sum + Number(a.amount || 0), 0); }
    get outstanding() { return this.appointments.filter(a => !a.paid).reduce((sum, a) => sum + Number(a.amount || 0), 0); }
}
