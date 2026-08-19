import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Patient } from '../../models/patient.model';
import { PracticeService } from '../../services/practice.service';
@Component({ selector: 'app-session-notes', templateUrl: './session-notes.component.html', styleUrls: ['./session-notes.component.css'] })
export class SessionNotesComponent implements OnInit {
    patients: Patient[] = [];
    selected?: Patient;
    showForm = false;
    form = this.fb.group({ sessionDate: ['', Validators.required], focus: ['', Validators.required], note: ['', Validators.required], paid: [false], amount: [0] });
    constructor(private fb: FormBuilder, private practice: PracticeService) { }
    ngOnInit() { this.practice.getPatients('', true).subscribe(p => { this.patients = p; this.selected = p[0]; }); }
    select(id: string) { this.selected = this.patients.find(p => p._id === id); }
    save() { if (!this.selected?._id || this.form.invalid)
        return; const v = this.form.getRawValue(); this.practice.addSessionNote(this.selected._id, { sessionDate: v.sessionDate!, focus: v.focus!, note: v.note!, paid: !!v.paid, amount: Number(v.amount || 0) }).subscribe(updated => { this.selected = updated; this.patients = this.patients.map(p => p._id === updated._id ? updated : p); this.showForm = false; this.form.reset({ paid: false, amount: 0 }); }); }
}
