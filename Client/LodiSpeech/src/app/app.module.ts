import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { UsersComponent } from './components/users/users.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PatientsComponent } from './components/patients/patients.component';
import { AppointmentsComponent } from './components/appointments/appointments.component';
import { PaymentsComponent } from './components/payments/payments.component';
import { SessionNotesComponent } from './components/session-notes/session-notes.component';
import { UnpaidCountPipe } from './pipes/unpaid-count.pipe';
import { AuthInterceptor } from './interceptors/auth.interceptor';
@NgModule({ declarations: [AppComponent, LandingComponent, LoginComponent, UsersComponent, DashboardComponent, PatientsComponent, AppointmentsComponent, PaymentsComponent, SessionNotesComponent, UnpaidCountPipe], imports: [BrowserModule, HttpClientModule, FormsModule, ReactiveFormsModule, AppRoutingModule], providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }], bootstrap: [AppComponent] })
export class AppModule {
}
