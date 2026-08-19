import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/patient.model';
@Injectable({ providedIn: 'root' })
export class UserService {
    private api = 'http://localhost:3000/api/users';
    constructor(private http: HttpClient) { }
    list() { return this.http.get<User[]>(this.api); }
    create(input: {
        name: string;
        username: string;
        email: string;
        phone: string;
        password: string;
        role: 'admin' | 'therapist';
    }) { return this.http.post<User>(this.api, input); }
    update(id: string, input: Partial<User> & {
        password?: string;
    }) { return this.http.put<User>(`${this.api}/${id}`, input); }
}
