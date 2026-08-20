import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PracticeService } from '../../services/practice.service';
import { AnamnesisReport, emptyAnamnesis } from '../../models/anamnesis.model';
import { Patient } from '../../models/patient.model';

@Component({
  selector: 'app-anamnesis',
  templateUrl: './anamnesis.component.html',
  styleUrls: ['./anamnesis.component.css']
})
export class AnamnesisComponent implements OnInit {
  patientId = '';
  patient?: Patient;
  report: AnamnesisReport = emptyAnamnesis();
  exists = false;
  loading = true;
  saving = false;
  message = '';
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private practice: PracticeService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.patientId) {
      this.router.navigate(['/patients']);
      return;
    }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.practice.getPatient(this.patientId).subscribe({
      next: result => {
        this.patient = result.patient;
        this.practice.getAnamnesis(this.patientId).subscribe({
          next: data => {
            this.patient = data.patient;
            this.report = this.normalizeReport(data.report);
            this.exists = true;
            this.loading = false;
          },
          error: err => {
            if (err.status === 404) {
              this.report = emptyAnamnesis();
              this.exists = false;
            } else {
              this.error = err.error?.message || 'Could not load anamnesis';
            }
            this.loading = false;
          }
        });
      },
      error: err => {
        this.error = err.error?.message || 'Could not load patient';
        this.loading = false;
      }
    });
  }

  private normalizeReport(report: any): AnamnesisReport {
    const base = emptyAnamnesis();
    return {
      ...base,
      ...report,
      formDate: report.formDate ? String(report.formDate).slice(0, 10) : base.formDate,
      identifying: { ...base.identifying, ...(report.identifying || {}) },
      birthHistory: { ...base.birthHistory, ...(report.birthHistory || {}) },
      medicalHistory: {
        ...base.medicalHistory,
        ...(report.medicalHistory || {}),
        conditions: { ...base.medicalHistory.conditions, ...(report.medicalHistory?.conditions || {}) }
      },
      developmentalHistory: {
        ...base.developmentalHistory,
        ...(report.developmentalHistory || {}),
        milestones: { ...base.developmentalHistory.milestones, ...(report.developmentalHistory?.milestones || {}) }
      },
      speechLanguageHistory: {
        ...base.speechLanguageHistory,
        ...(report.speechLanguageHistory || {}),
        childAbilities: { ...base.speechLanguageHistory.childAbilities, ...(report.speechLanguageHistory?.childAbilities || {}) },
        communicationMethods: { ...base.speechLanguageHistory.communicationMethods, ...(report.speechLanguageHistory?.communicationMethods || {}) },
        speechSounds: { ...base.speechLanguageHistory.speechSounds, ...(report.speechLanguageHistory?.speechSounds || {}) },
        language: { ...base.speechLanguageHistory.language, ...(report.speechLanguageHistory?.language || {}) },
        fluencyVoice: { ...base.speechLanguageHistory.fluencyVoice, ...(report.speechLanguageHistory?.fluencyVoice || {}) }
      },
      socialInteraction: { ...base.socialInteraction, ...(report.socialInteraction || {}) },
      playSkills: { ...base.playSkills, ...(report.playSkills || {}) },
      educationHistory: { ...base.educationHistory, ...(report.educationHistory || {}) }
    };
  }

  get age(): string {
    if (!this.patient?.dateOfBirth) return '';
    const dob = new Date(this.patient.dateOfBirth);
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years--;
    return String(Math.max(0, years));
  }

  addSibling(): void {
    this.report.identifying.siblings.push({ name: '', age: '', speechHearingProblems: '' });
  }

  removeSibling(index: number): void {
    this.report.identifying.siblings.splice(index, 1);
  }

  save(): void {
    if (!this.patientId || this.saving) return;
    if (!this.exists && !this.auth.user?.canCreateAnamnesis) {
      this.error = 'Your account is not allowed to create anamnesis reports.';
      return;
    }

    this.saving = true;
    this.message = '';
    this.error = '';
    const request = this.exists
      ? this.practice.updateAnamnesis(this.patientId, this.report)
      : this.practice.createAnamnesis(this.patientId, this.report);

    request.subscribe({
      next: data => {
        this.report = this.normalizeReport(data.report);
        this.exists = true;
        this.saving = false;
        this.message = 'Anamnesis saved successfully.';
      },
      error: err => {
        this.saving = false;
        this.error = err.error?.message || 'Could not save anamnesis';
      }
    });
  }

  back(): void {
    this.router.navigate(['/patients']);
  }
}
