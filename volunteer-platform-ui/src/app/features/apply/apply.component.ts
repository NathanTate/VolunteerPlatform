import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatDividerModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="apply-page">

      @if (!auth.isLoggedIn()) {
        <mat-card class="apply-card center-card">
          <mat-icon class="big-icon">lock</mat-icon>
          <h2>Потрібна авторизація</h2>
          <p>Будь ласка, увійдіть або зареєструйтесь, щоб подати заявку.</p>
          <button mat-raised-button color="primary" routerLink="/auth/login">Увійти</button>
        </mat-card>
      }

      @else if (submitted()) {
        <mat-card class="apply-card center-card success-card">
          <mat-icon class="big-icon success-icon">check_circle</mat-icon>
          <h2>Заявку подано!</h2>
          <p class="success-text">
            Ваша заявка прийнята та передана на розгляд адміністраторам.<br>
            Після підтвердження ваша роль буде оновлена автоматично.
          </p>
          <button mat-raised-button color="primary" routerLink="/">На головну</button>
        </mat-card>
      }

      @else if (auth.currentUser()?.role !== 'Guest') {
        <mat-card class="apply-card center-card">
          <mat-icon class="big-icon" style="color:#1565c0">verified_user</mat-icon>
          <h2>У вас вже є роль</h2>
          <p>Ваша поточна роль: <strong>{{ roleLabel() }}</strong></p>
          @if (auth.currentUser()?.role === 'Volunteer' && !auth.currentUser()?.isVolunteerConfirmed) {
            <div class="pending-banner">
              <mat-icon>hourglass_empty</mat-icon>
              <span>Ваш статус волонтера очікує підтвердження координатором.</span>
            </div>
          }
          @if (auth.currentUser()?.role === 'OrganizationAdmin' && !auth.currentUser()?.isOrganizationApproved) {
            <div class="pending-banner">
              <mat-icon>hourglass_empty</mat-icon>
              <span>Ваша організація очікує підтвердження адміністратором.</span>
            </div>
          }
          <button mat-stroked-button routerLink="/">На головну</button>
        </mat-card>
      }

      @else {
        <!-- Header -->
        <div class="page-header">
          <mat-icon class="page-icon">how_to_reg</mat-icon>
          <div>
            <h1>Приєднатися до платформи</h1>
            <p>Оберіть тип участі та заповніть заявку — адміністратор розгляне її найближчим часом.</p>
          </div>
        </div>

        <div class="cards-row">

          <!-- ── Volunteer card ── -->
          <mat-card class="role-card" [class.selected]="selectedRole() === 'volunteer'">
            <div class="role-icon-wrap volunteer-bg">
              <mat-icon class="role-icon">volunteer_activism</mat-icon>
            </div>
            <h2 class="role-title">Волонтер</h2>
            <p class="role-desc">
              Беріть участь в ініціативах, допомагайте координаторам та виконуйте завдання.
              Ваш статус буде підтверджено координатором.
            </p>
            <ul class="perks">
              <li><mat-icon class="perk-icon">check</mat-icon> Подавати заявки на ініціативи</li>
              <li><mat-icon class="perk-icon">check</mat-icon> Отримувати та виконувати завдання</li>
              <li><mat-icon class="perk-icon">check</mat-icon> Отримувати повідомлення про нові події</li>
            </ul>
            <mat-divider></mat-divider>
            <button mat-raised-button color="primary" class="apply-btn"
              [disabled]="loading()"
              (click)="applyVolunteer()">
              @if (loading() && selectedRole() === 'volunteer') {
                <mat-spinner diameter="18" style="display:inline-block;margin-right:8px"></mat-spinner>
              } @else {
                <mat-icon>send</mat-icon>
              }
              Подати заявку як волонтер
            </button>
          </mat-card>

          <!-- ── Organization card ── -->
          <mat-card class="role-card" [class.selected]="selectedRole() === 'organization'">
            <div class="role-icon-wrap org-bg">
              <mat-icon class="role-icon">business</mat-icon>
            </div>
            <h2 class="role-title">Організація</h2>
            <p class="role-desc">
              Створюйте ініціативи від імені організації, керуйте координаторами та відстежуйте статистику.
              Вашу організацію підтвердить адміністратор.
            </p>
            <ul class="perks">
              <li><mat-icon class="perk-icon">check</mat-icon> Створювати та редагувати ініціативи</li>
              <li><mat-icon class="perk-icon">check</mat-icon> Керувати учасниками та завданнями</li>
              <li><mat-icon class="perk-icon">check</mat-icon> Призначати координаторів</li>
            </ul>
            <mat-divider></mat-divider>

            @if (selectedRole() !== 'organization') {
              <button mat-raised-button color="accent" class="apply-btn"
                (click)="selectedRole.set('organization')">
                <mat-icon>edit</mat-icon>
                Заповнити заявку
              </button>
            } @else {
              <form [formGroup]="orgForm" (ngSubmit)="applyOrganization()" class="org-form">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Назва організації *</mat-label>
                  <input matInput formControlName="organizationName" maxlength="200" />
                  @if (orgForm.get('organizationName')?.invalid && orgForm.get('organizationName')?.touched) {
                    <mat-error>Назва обов'язкова (мін. 2 символи)</mat-error>
                  }
                </mat-form-field>
                <div class="org-btn-row">
                  <button mat-stroked-button type="button" (click)="selectedRole.set(null)">Скасувати</button>
                  <button mat-raised-button color="accent" type="submit"
                    [disabled]="orgForm.invalid || loading()">
                    @if (loading() && selectedRole() === 'organization') {
                      <mat-spinner diameter="18" style="display:inline-block;margin-right:8px"></mat-spinner>
                    } @else {
                      <mat-icon>send</mat-icon>
                    }
                    Подати заявку
                  </button>
                </div>
              </form>
            }
          </mat-card>

        </div>
      }

    </div>
  `,
  styles: [`
    .apply-page {
      min-height: calc(100vh - 64px);
      background: #f5f7fb;
      padding: 40px 24px;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      max-width: 900px;
      margin: 0 auto 32px;
    }
    .page-icon {
      font-size: 40px; width: 40px; height: 40px;
      color: #1565c0; flex-shrink: 0; margin-top: 4px;
    }
    .page-header h1 { margin: 0 0 6px; font-size: 1.6rem; font-weight: 700; color: #1a237e; }
    .page-header p  { margin: 0; color: #546e7a; font-size: 0.95rem; }

    .cards-row {
      display: flex;
      gap: 24px;
      max-width: 900px;
      margin: 0 auto;
      flex-wrap: wrap;
    }

    .role-card {
      flex: 1;
      min-width: 280px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .role-card.selected {
      box-shadow: 0 4px 20px rgba(21,101,192,0.18);
      transform: translateY(-2px);
    }

    .role-icon-wrap {
      width: 56px; height: 56px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
    }
    .volunteer-bg { background: #e3f2fd; }
    .org-bg { background: #e8f5e9; }
    .role-icon { font-size: 28px; width: 28px; height: 28px; }
    .volunteer-bg .role-icon { color: #1565c0; }
    .org-bg .role-icon      { color: #2e7d32; }

    .role-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: #212121; }
    .role-desc  { margin: 0; color: #546e7a; font-size: 0.88rem; line-height: 1.5; }

    .perks {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column; gap: 6px;
    }
    .perks li {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.87rem; color: #424242;
    }
    .perk-icon { font-size: 16px; width: 16px; height: 16px; color: #43a047; }

    .apply-btn {
      margin-top: 8px;
      display: flex; align-items: center; gap: 6px;
    }

    .org-form { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    .full-width { width: 100%; }
    .org-btn-row { display: flex; justify-content: flex-end; gap: 8px; }

    /* Center card (login prompt, success, already-has-role) */
    .center-card {
      max-width: 460px;
      margin: 60px auto 0;
      padding: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      text-align: center;
    }
    .big-icon { font-size: 56px; width: 56px; height: 56px; color: #9e9e9e; }
    .success-icon { color: #43a047 !important; }
    .center-card h2 { margin: 0; font-size: 1.3rem; }
    .center-card p  { margin: 0; color: #616161; }
    .success-text   { color: #424242; line-height: 1.6; }

    .pending-banner {
      display: flex; align-items: center; gap: 8px;
      background: #fff8e1; color: #f57f17;
      padding: 10px 14px; border-radius: 8px;
      font-size: 13px; width: 100%;
    }

    @media (max-width: 640px) {
      .cards-row { flex-direction: column; }
      .apply-page { padding: 20px 12px; }
    }
  `]
})
export class ApplyComponent {
  private fb   = inject(FormBuilder);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  protected auth = inject(AuthService);

  selectedRole = signal<'volunteer' | 'organization' | null>(null);
  loading      = signal(false);
  submitted    = signal(false);

  orgForm = this.fb.group({
    organizationName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]]
  });

  roleLabel = computed(() => {
    const role = this.auth.currentUser()?.role;
    const map: Record<string, string> = {
      Guest: 'Гість', Volunteer: 'Волонтер',
      Coordinator: 'Координатор', OrganizationAdmin: 'Адміністратор організації', SuperAdmin: 'Супер-адмін'
    };
    return role ? (map[role] ?? role) : '';
  });

  applyVolunteer() {
    this.selectedRole.set('volunteer');
    this.loading.set(true);
    this.http.post<ApiResponse<object>>(
      `${environment.apiUrl}/users/me/apply-role`,
      { role: 'Volunteer', organizationName: null }
    ).subscribe({
      next: () => { this.loading.set(false); this.submitted.set(true); this.auth.loadCurrentUser(); },
      error: err => {
        this.loading.set(false);
        this.snackBar.open(err?.error?.message ?? 'Помилка при поданні заявки', 'OK', { duration: 4000 });
      }
    });
  }

  applyOrganization() {
    if (this.orgForm.invalid) { this.orgForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.http.post<ApiResponse<object>>(
      `${environment.apiUrl}/users/me/apply-role`,
      { role: 'OrganizationAdmin', organizationName: this.orgForm.value.organizationName }
    ).subscribe({
      next: () => { this.loading.set(false); this.submitted.set(true); this.auth.loadCurrentUser(); },
      error: err => {
        this.loading.set(false);
        this.snackBar.open(err?.error?.message ?? 'Помилка при поданні заявки', 'OK', { duration: 4000 });
      }
    });
  }
}
