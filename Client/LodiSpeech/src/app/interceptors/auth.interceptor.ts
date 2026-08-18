import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private auth: AuthService, private router: Router) { }
    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> { const token = this.auth.token; const authorized = token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request; return next.handle(authorized).pipe(catchError(error => { if (error.status === 401 && token) {
        this.auth.logout();
        this.router.navigate(['/staff-login']);
    } return throwError(() => error); })); }
}
