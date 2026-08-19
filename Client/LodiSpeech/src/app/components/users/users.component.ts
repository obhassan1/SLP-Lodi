import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { User } from '../../models/patient.model';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  editingUser?: User;
  showForm = false;
  error = '';

  form = this.fb.group({
    name: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    password: [''],
    role: ['therapist' as 'admin' | 'therapist', Validators.required],
    active: [true]
  });

  constructor(
    private fb: FormBuilder,
    private usersApi: UserService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.usersApi.list().subscribe(users => {
      this.users = users;
    });
  }

  canEdit(user: User): boolean {
    return this.auth.user?.role === 'admin' ||
      this.auth.user?._id === user._id;
  }

  openCreate(): void {
    this.error = '';
    this.editingUser = undefined;
    this.form.controls.password.setValidators([
      Validators.required,
      Validators.minLength(8)
    ]);
    this.form.controls.password.updateValueAndValidity();
    this.form.reset({
      name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      role: 'therapist',
      active: true
    });
    this.showForm = true;
  }

  openEdit(user: User): void {
    if (!this.canEdit(user)) return;

    this.error = '';
    this.editingUser = user;
    this.form.controls.password.clearValidators();
    this.form.controls.password.addValidators(Validators.minLength(8));
    this.form.controls.password.updateValueAndValidity();
    this.form.setValue({
      name: user.name,
      username: user.username,
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role,
      active: user.active
    });
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingUser = undefined;
    this.error = '';
  }

  save(): void {
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    const input = {
      name: value.name!,
      username: value.username!,
      email: value.email!,
      phone: value.phone!,
      password: value.password || undefined,
      role: this.auth.user?.role === 'admin'
        ? value.role!
        : 'therapist' as const,
      active: this.auth.user?.role === 'admin'
        ? !!value.active
        : true
    };

    const request = this.editingUser
      ? this.usersApi.update(this.editingUser._id, input)
      : this.usersApi.create({
          ...input,
          password: value.password!
        });

    request.subscribe({
      next: updatedUser => {
        if (this.auth.user?._id === updatedUser._id) {
          this.auth.updateCurrentUser(updatedUser);
        }
        this.closeForm();
        this.load();
      },
      error: error => {
        this.error = error.error?.message || 'Could not save user';
      }
    });
  }
}
