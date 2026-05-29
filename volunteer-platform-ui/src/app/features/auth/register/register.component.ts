import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, MatCardModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule
  ],
  template: `
    <div class="auth-wrapper">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Реєстрація</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="name-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Ім'я</mat-label>
                <input matInput formControlName="firstName">
              </mat-form-field>
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Прізвище</mat-label>
                <input matInput formControlName="lastName">
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Пароль (мін. 6 символів)</mat-label>
              <input matInput formControlName="password" type="password">
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit"
              class="full-width" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Реєструємо...' : 'Зареєструватись' }}
            </button>
          </form>
          <p class="auth-link">Вже маєте акаунт? <a routerLink="/auth/login">Увійти</a></p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
    }
    .auth-card { width: 420px; padding: 16px; }
    .full-width { width: 100%; margin-bottom: 12px; }
    .name-row { display: flex; gap: 12px; }
    .half-width { flex: 1; }
    .auth-link { text-align: center; margin-top: 16px; font-size: 14px; }
  `]
})
export class RegisterComponent {
  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    const { email, password, firstName, lastName } = this.form.value;
    this.auth.register({ email: email!, password: password!, firstName: firstName!, lastName: lastName! }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        const msg = err.error?.errors?.join(', ') ?? 'Помилка реєстрації';
        this.snackBar.open(msg, 'OK', { duration: 4000, panelClass: 'error-snack' });
        this.loading.set(false);
      }
    });
  }
}
