import { Component, HostListener } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  publicPage = true;
  showPasswordForm = false;
  passwordError = '';
  passwordSuccess = '';

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private usersApi: UserService,
    public auth: AuthService
  ) {
    this.updateLayout();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.updateLayout());
  }

  @HostListener('window:hashchange')
  onHashChange(): void {
    this.updateLayout();
  }

  @HostListener('window:popstate')
  onPopState(): void {
    this.updateLayout();
  }

  private updateLayout(): void {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    this.publicPage = path === '/' || path === '/staff-login';
  }

  openPasswordForm(): void {
    this.passwordError = '';
    this.passwordSuccess = '';
    this.passwordForm.reset();
    this.showPasswordForm = true;
  }

  closePasswordForm(): void {
    this.showPasswordForm = false;
    this.passwordForm.reset();
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    const value = this.passwordForm.getRawValue();

    if (value.newPassword !== value.confirmPassword) {
      this.passwordError = 'The new passwords do not match';
      return;
    }

    this.usersApi.changeOwnPassword({
      currentPassword: value.currentPassword!,
      newPassword: value.newPassword!
    }).subscribe({
      next: result => {
        this.passwordError = '';
        this.passwordSuccess = result.message;
        this.passwordForm.reset();
      },
      error: error => {
        this.passwordSuccess = '';
        this.passwordError = error.error?.message || 'Could not change password';
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/staff-login']);
  }
}
