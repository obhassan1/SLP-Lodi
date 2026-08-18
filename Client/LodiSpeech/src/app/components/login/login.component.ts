import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
@Component({ selector: 'app-login', templateUrl: './login.component.html', styleUrls: ['./login.component.css'] })
export class LoginComponent {
    loading = false;
    error = '';
    form = this.fb.group({ username: ['', Validators.required], password: ['', Validators.required] });
    constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) { }
    login() { if (this.form.invalid)
        return; this.loading = true; this.error = ''; const v = this.form.getRawValue(); this.auth.login(v.username!, v.password!).subscribe({ next: () => this.router.navigate(['/dashboard']), error: error => { this.error = error.error?.message || 'Login failed'; this.loading = false; } }); }
}
