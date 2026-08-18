import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Appointment, Patient, User } from '../../models/patient.model';
import { AuthService } from '../../services/auth.service';
import { PracticeService } from '../../services/practice.service';
import { UserService } from '../../services/user.service';
@Component({
    selector: 'app-patients',
    templateUrl: './patients.component.html',
    styleUrls: ['./patients.component.css']
})
export class PatientsComponent implements OnInit {
    patients: Patient[] = [];
    therapists: User[] = [];
    appointments: Appointment[] = [];
    selected?: Patient;
    selectedTherapistIds: string[] = [];
    search = '';
    showForm = false;
    loading = true;
    assignmentMessage = '';
    form = this.fb.group({
        name: ['', Validators.required],
        dateOfBirth: ['', Validators.required],
        caregiver: ['', Validators.required],
        relationship: [''],
        phone: ['', Validators.required],
        email: ['', Validators.email],
        therapyFocus: ['', Validators.required]
    });
    constructor(private fb: FormBuilder, private practice: PracticeService, private usersApi: UserService, public auth: AuthService) { }
    ngOnInit() {
        this.load();
        if (this.auth.user?.role === 'admin') {
            this.usersApi.list().subscribe(users => {
                this.therapists = users.filter(user => user.role === 'therapist' && user.active);
            });
        }
    }
    load() {
        this.loading = true;
        this.practice.getPatients(this.search).subscribe({
            next: patients => {
                this.patients = patients;
                if (patients.length && !this.selected) {
                    this.selectPatient(patients[0]);
                }
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }
    selectPatient(patient: Patient) {
        if (!patient._id)
            return;
        this.assignmentMessage = '';
        this.practice.getPatient(patient._id).subscribe(result => {
            this.selected = result.patient;
            this.appointments = result.appointments;
            this.selectedTherapistIds = (result.patient.assignedTherapists || []).map(item => typeof item === 'string' ? item : item._id);
        });
    }
    get previousAppointment() {
        const now = Date.now();
        return this.appointments
            .filter(item => new Date(item.startsAt).getTime() < now)
            .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())[0];
    }
    get nextAppointment() {
        const now = Date.now();
        return this.appointments
            .filter(item => new Date(item.startsAt).getTime() >= now)
            .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
    }
    therapistName(appointment: Appointment) {
        return !appointment.therapist || typeof appointment.therapist === 'string'
            ? ''
            : appointment.therapist.name;
    }
    toggleTherapist(id: string, checked: boolean) {
        this.selectedTherapistIds = checked
            ? Array.from(new Set([...this.selectedTherapistIds, id]))
            : this.selectedTherapistIds.filter(item => item !== id);
    }
    saveAssignments() {
        if (!this.selected?._id || this.auth.user?.role !== 'admin')
            return;
        this.practice.assignPatient(this.selected._id, this.selectedTherapistIds).subscribe(patient => {
            this.selected = patient;
            this.assignmentMessage = 'Patient access updated.';
        });
    }
    save() {
        if (this.form.invalid)
            return;
        const value = this.form.getRawValue();
        const patient: Patient = {
            name: value.name!,
            dateOfBirth: value.dateOfBirth!,
            caregivers: [{
                    name: value.caregiver!,
                    relationship: value.relationship || '',
                    phone: value.phone!,
                    email: value.email || ''
                }],
            contact: {
                phone: value.phone!,
                email: value.email || ''
            },
            therapyFocus: value.therapyFocus!,
            notes: []
        };
        this.practice.createPatient(patient).subscribe(created => {
            this.patients = [...this.patients, created];
            this.selectPatient(created);
            this.showForm = false;
            this.form.reset();
        });
    }
}
