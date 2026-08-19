import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { User } from '../models/patient.model';
@Injectable({ providedIn: 'root' })
export class AuthService {
    private api = 'http://localhost:3000/api';
    private userSubject = new BehaviorSubject<User | null>(this.readUser());
    user$ = this.userSubject.asObservable();
    constructor(private http: HttpClient) { }
    login(username: string, password: string) { return this.http.post<{
        token: string;
        user: User;
    }>(`${this.api}/auth/login`, { username, password }).pipe(tap(result => { localStorage.setItem('lodi_token', result.token); localStorage.setItem('lodi_user', JSON.stringify(result.user)); this.userSubject.next(result.user); })); }
    logout() { localStorage.removeItem('lodi_token'); localStorage.removeItem('lodi_user'); this.userSubject.next(null); }
    get token() { return localStorage.getItem('lodi_token'); }
    get user() { return this.userSubject.value; }
    get isLoggedIn() { return !!this.token && !!this.user; }
    updateCurrentUser(user: User) {
        localStorage.setItem('lodi_user', JSON.stringify(user));
        this.userSubject.next(user);
    }
    private readUser() { try {
        return JSON.parse(localStorage.getItem('lodi_user') || 'null') as User | null;
    }
    catch {
        return null;
    } }
}
