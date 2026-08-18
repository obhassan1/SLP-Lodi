import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/patient.model';
@Component({ selector: 'app-users', templateUrl: './users.component.html', styleUrls: ['./users.component.css'] })
export class UsersComponent implements OnInit {
    users: User[] = [];
    showForm = false;
    error = '';
    form = this.fb.group({ name: ['', Validators.required], username: ['', Validators.required], password: ['', [Validators.required, Validators.minLength(8)]], role: ['therapist' as 'admin' | 'therapist', Validators.required] });
    constructor(private fb: FormBuilder, private usersApi: UserService, public auth: AuthService) { }
    ngOnInit() { this.load(); }
    load() { this.usersApi.list().subscribe(users => this.users = users); }
    save() { if (this.form.invalid)
        return; const v = this.form.getRawValue(); this.usersApi.create({ name: v.name!, username: v.username!, password: v.password!, role: this.auth.user?.role === 'admin' ? v.role! : 'therapist' }).subscribe({ next: () => { this.showForm = false; this.form.reset({ role: 'therapist' }); this.load(); }, error: error => this.error = error.error?.message || 'Could not create user' }); }
}
