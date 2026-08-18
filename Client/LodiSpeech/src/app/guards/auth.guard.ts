import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(private auth: AuthService, private router: Router) { }
    canActivate() { return this.auth.isLoggedIn || this.router.createUrlTree(['/staff-login']); }
}
