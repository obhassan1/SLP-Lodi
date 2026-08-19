import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  showPasswordForm = false;
  passwordError = '';
  passwordSuccess = '';

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  constructor(
    public router: Router,
    private fb: FormBuilder,
    private usersApi: UserService,
    public auth: AuthService
  ) {}

  /**
   * Keep public pages independent from NavigationEnd timing.
   * This also handles query strings and an accidental trailing slash.
   */
  get publicPage(): boolean {
    const url = (this.router.url || '/').split('?')[0].split('#')[0];
    const normalized = url.length > 1 ? url.replace(/\/+$/, '') : url;
    return normalized === '/' || normalized === '/staff-login';
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
