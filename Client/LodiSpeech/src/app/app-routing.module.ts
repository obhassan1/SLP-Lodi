import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentsComponent } from './components/appointments/appointments.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { PatientsComponent } from './components/patients/patients.component';
import { PaymentsComponent } from './components/payments/payments.component';
import { SessionNotesComponent } from './components/session-notes/session-notes.component';
import { UsersComponent } from './components/users/users.component';
import { AuthGuard } from './guards/auth.guard';
import { TherapistGuard } from './guards/therapist.guard';
import { AdminGuard } from './guards/admin.guard';
import { AnamnesisComponent } from './components/anamnesis/anamnesis.component';
import { StatisticsComponent } from './components/statistics/statistics.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'staff-login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'patients', component: PatientsComponent, canActivate: [AuthGuard] },
  { path: 'patients/:id/anamnesis', component: AnamnesisComponent, canActivate: [AuthGuard, TherapistGuard] },
  { path: 'appointments', component: AppointmentsComponent, canActivate: [AuthGuard] },
  { path: 'payments', component: PaymentsComponent, canActivate: [AuthGuard] },
  {
    path: 'session-notes',
    component: SessionNotesComponent,
    canActivate: [AuthGuard, TherapistGuard]
  },

  {
  path: 'statistics',

  component:
    StatisticsComponent,

  canActivate: [
    AuthGuard,
    AdminGuard
  ]
},
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
