import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment, Patient, SessionNote } from '../models/patient.model';
import { environment } from '../../environments/environment';
import { AnamnesisReport } from '../models/anamnesis.model';
@Injectable({ providedIn: 'root' })
export class PracticeService {
    private api = environment.apiUrl;
    constructor(private http: HttpClient) { }
    getPatients(q = '', mine = false): Observable<Patient[]> {
        let params = new HttpParams();
        if (q)
            params = params.set('q', q);
        if (mine)
            params = params.set('mine', 'true');
        return this.http.get<Patient[]>(`${this.api}/patients`, {
            params
        });
    }
    getPatient(id: string) {
        return this.http.get<{
            patient: Patient;
            appointments: Appointment[];
        }>(`${this.api}/patients/${id}`);
    }
    createPatient(patient: Patient) {
        return this.http.post<Patient>(`${this.api}/patients`, patient);
    }
    updatePatient(id: string, patient: Partial<Patient>) {
        return this.http.put<Patient>(`${this.api}/patients/${id}`, patient);
    }
    assignPatient(id: string, therapistIds: string[]) {
        return this.http.put<Patient>(`${this.api}/patients/${id}/assign`, {
            therapistIds
        });
    }
    addSessionNote(id: string, note: SessionNote) {
        return this.http.post<Patient>(`${this.api}/patients/${id}/notes`, note);
    }
    getAppointments(from?: string, to?: string, therapist?: string) {
        let params = new HttpParams();
        if (from)
            params = params.set('from', from);
        if (to)
            params = params.set('to', to);
        if (therapist)
            params = params.set('therapist', therapist);
        return this.http.get<Appointment[]>(`${this.api}/appointments`, {
            params
        });
    }
    createAppointment(item: Appointment) {
        return this.http.post<Appointment>(`${this.api}/appointments`, item);
    }
    updateAppointment(id: string, item: Partial<Appointment>) {
        return this.http.put<Appointment>(`${this.api}/appointments/${id}`, item);
    }
    deleteAppointment(id: string) {
        return this.http.delete<void>(`${this.api}/appointments/${id}`);
    }
    addAppointmentNote(id: string, focus: string, note: string) {
        return this.http.post(`${this.api}/appointments/${id}/session-note`, {
            focus,
            note
        });
    }

    getAnamnesis(id: string) {
        return this.http.get<any>(`${this.api}/patients/${id}/anamnesis`);
    }
    createAnamnesis(id: string, report: AnamnesisReport) {
        return this.http.post<any>(`${this.api}/patients/${id}/anamnesis`, report);
    }
    updateAnamnesis(id: string, report: AnamnesisReport) {
        return this.http.put<any>(`${this.api}/patients/${id}/anamnesis`, report);
    }

cancelAppointment(id: string) {
  return this.http.put<Appointment>(
    `${this.api}/appointments/${id}`,
    {
      status: 'cancelled'
    }
  );
}
}