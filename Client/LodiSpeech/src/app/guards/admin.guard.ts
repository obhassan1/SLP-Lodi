import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate() {
    if (this.auth.user?.role === 'admin') {
      return true;
    }

    return this.router.createUrlTree(['/dashboard']);
  }
}
