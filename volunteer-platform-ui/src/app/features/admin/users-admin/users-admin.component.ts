import {
  Component, OnInit, signal, computed, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsersService } from '../../../core/services/users.service';
import { UserDto, UserRole } from '../../../shared/models/auth.model';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Guest: { label: 'Гість', color: '#757575', bg: '#f5f5f5' },
  Volunteer: { label: 'Волонтер', color: '#1565c0', bg: '#e3f2fd' },
  Coordinator: { label: 'Координатор', color: '#6a1b9a', bg: '#f3e5f5' },
  OrganizationAdmin: { label: 'Адмін орг.', color: '#e65100', bg: '#fff3e0' },
  SuperAdmin: { label: 'Суперадмін', color: '#c62828', bg: '#ffebee' },
};

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatTableModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule, MatSnackBarModule,
    MatTooltipModule, MatDividerModule, MatSlideToggleModule,
    MatChipsModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="admin-page">

      <!-- ── Page header ─────────────────────────────────────── -->
      <div class="page-header">
        <div class="header-left">
          <mat-icon class="header-icon">manage_accounts</mat-icon>
          <div>
            <h1 class="page-title">Управління користувачами</h1>
            <p class="page-subtitle">{{ users().length }} користувачів зареєстровано</p>
          </div>
        </div>
        <button mat-stroked-button (click)="load()" [disabled]="loading()">
          <mat-icon>refresh</mat-icon> Оновити
        </button>
      </div>

      <!-- ── Stats row ────────────────────────────────────────── -->
      <div class="stats-row">
        @for (stat of roleStats(); track stat.role) {
          <div class="stat-chip" [style.background]="stat.bg" [style.color]="stat.color">
            <strong>{{ stat.count }}</strong>
            <span>{{ stat.label }}</span>
          </div>
        }
        @if (pendingVolunteers() > 0) {
          <div class="stat-chip pending-vol clickable-chip"
            (click)="statusFilter.set('unconfirmed')"
            matTooltip="Натисніть, щоб показати">
            <mat-icon class="chip-icon">how_to_reg</mat-icon>
            <strong>{{ pendingVolunteers() }}</strong>
            <span>Волонтерів очікує підтвердження</span>
            <mat-icon class="chip-arrow">arrow_forward</mat-icon>
          </div>
        }
        @if (pendingOrgs() > 0) {
          <div class="stat-chip pending-org clickable-chip"
            (click)="statusFilter.set('pending-org')"
            matTooltip="Натисніть, щоб показати">
            <mat-icon class="chip-icon">domain_verification</mat-icon>
            <strong>{{ pendingOrgs() }}</strong>
            <span>Організацій очікує схвалення</span>
            <mat-icon class="chip-arrow">arrow_forward</mat-icon>
          </div>
        }
      </div>

      <!-- ── Search & filter ─────────────────────────────────── -->
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Пошук</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [ngModel]="searchText()" (ngModelChange)="searchSubject.next($event)" placeholder="Ім'я або email..." />
          @if (searchText()) {
            <button matSuffix mat-icon-button (click)="searchText.set(''); searchSubject.next('')">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="role-filter">
          <mat-label>Роль</mat-label>
          <mat-select [ngModel]="roleFilter()" (ngModelChange)="roleFilter.set($event)">
            <mat-option value="">Всі ролі</mat-option>
            <mat-option value="Guest">Гість</mat-option>
            <mat-option value="Volunteer">Волонтер</mat-option>
            <mat-option value="Coordinator">Координатор</mat-option>
            <mat-option value="OrganizationAdmin">Адмін організації</mat-option>
            <mat-option value="SuperAdmin">Суперадмін</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="role-filter">
          <mat-label>Статус</mat-label>
          <mat-select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
            <mat-option value="">Всі</mat-option>
            <mat-option value="unconfirmed">Не підтверджені</mat-option>
            <mat-option value="confirmed">Підтверджені</mat-option>
            <mat-option value="pending-org">Орг. на схваленні</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- ── Loading ─────────────────────────────────────────── -->
      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      }

      <!-- ── User cards ───────────────────────────────────────── -->
      @if (!loading()) {
        <div class="users-count">
          Показано {{ filteredUsers().length }} із {{ users().length }}
        </div>

        @if (filteredUsers().length === 0) {
          <div class="empty-state">
            <mat-icon>person_search</mat-icon>
            <p>Користувачів не знайдено</p>
          </div>
        }

        <div class="user-grid">
          @for (user of filteredUsers(); track user.id) {
            <mat-card class="user-card">
              <!-- Avatar + name -->
              <div class="user-header">
                <div class="avatar" [style.background]="avatarColor(user)">
                  {{ initials(user) }}
                </div>
                <div class="user-info">
                  <span class="user-name">{{ user.firstName }} {{ user.lastName }}</span>
                  <span class="user-email">{{ user.email }}</span>
                  @if (user.organizationName) {
                    <span class="user-org">
                      <mat-icon class="org-icon">business</mat-icon>
                      {{ user.organizationName }}
                    </span>
                  }
                </div>
                <div class="role-badge"
                  [style.color]="roleConfig(user.role).color"
                  [style.background]="roleConfig(user.role).bg">
                  {{ roleConfig(user.role).label }}
                </div>
              </div>

              <mat-divider></mat-divider>

              <!-- Status indicators -->
              <div class="user-status-row">
                <span class="status-pill" [class.green]="user.isVolunteerConfirmed" [class.grey]="!user.isVolunteerConfirmed"
                  [matTooltip]="user.isVolunteerConfirmed ? 'Волонтер підтверджений' : 'Не підтверджений'">
                  <mat-icon>{{ user.isVolunteerConfirmed ? 'verified_user' : 'person_outline' }}</mat-icon>
                  {{ user.isVolunteerConfirmed ? 'Підтверджений' : 'Не підтверджений' }}
                </span>
                @if (user.role === 'OrganizationAdmin') {
                  <span class="status-pill" [class.green]="user.isOrganizationApproved" [class.amber]="!user.isOrganizationApproved"
                    [matTooltip]="user.isOrganizationApproved ? 'Організацію схвалено' : 'Очікує схвалення'">
                    <mat-icon>{{ user.isOrganizationApproved ? 'verified' : 'pending' }}</mat-icon>
                    {{ user.isOrganizationApproved ? 'Орг. схвалена' : 'Очікує схвалення' }}
                  </span>
                }
                <span class="registered-date">
                  <mat-icon>event</mat-icon>
                  {{ user.createdAt | date:'dd.MM.yyyy' }}
                </span>
              </div>

              <!-- Actions -->
              <div class="user-actions">
                <!-- Role selector -->
                <mat-form-field appearance="outline" class="role-select">
                  <mat-label>Роль</mat-label>
                  <mat-select [value]="user.role" (selectionChange)="onRoleSelected(user, $event.value)">
                    <mat-option value="Guest">Гість</mat-option>
                    <mat-option value="Volunteer">Волонтер</mat-option>
                    <mat-option value="Coordinator">Координатор</mat-option>
                    <mat-option value="OrganizationAdmin">Адмін організації</mat-option>
                    <mat-option value="SuperAdmin">Суперадмін</mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Org name prompt (shown when changing to OrganizationAdmin) -->
                @if (orgNamePromptId() === user.id) {
                  <div class="org-name-prompt">
                    <mat-icon class="org-prompt-icon">business</mat-icon>
                    <mat-form-field appearance="outline" class="org-name-field">
                      <mat-label>Назва організації</mat-label>
                      <input matInput [formControl]="orgNameControl" maxlength="200"
                        placeholder="Введіть назву організації" />
                      @if (orgNameControl.invalid && orgNameControl.touched) {
                        <mat-error>Вкажіть назву організації</mat-error>
                      }
                    </mat-form-field>
                    <div class="org-prompt-btns">
                      <button mat-raised-button color="primary" class="org-confirm-btn"
                        [disabled]="orgNameControl.invalid || savingOrgName()"
                        (click)="confirmRoleAndOrg(user)">
                        @if (savingOrgName()) {
                          <mat-spinner diameter="14" class="btn-spinner"></mat-spinner>
                        } @else {
                          <mat-icon>check</mat-icon>
                        }
                        Зберегти
                      </button>
                      <button mat-stroked-button (click)="cancelOrgNamePrompt()">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  </div>
                }

                <div class="toggle-actions">
                  <!-- Confirm volunteer -->
                  <button mat-stroked-button
                    [color]="user.isVolunteerConfirmed ? 'warn' : 'primary'"
                    [matTooltip]="user.isVolunteerConfirmed ? 'Скасувати підтвердження' : 'Підтвердити волонтера'"
                    (click)="toggleConfirm(user)">
                    <mat-icon>{{ user.isVolunteerConfirmed ? 'person_remove' : 'how_to_reg' }}</mat-icon>
                    {{ user.isVolunteerConfirmed ? 'Скасувати' : 'Підтвердити' }}
                  </button>

                  <!-- Approve org -->
                  @if (user.role === 'OrganizationAdmin') {
                    <button mat-stroked-button
                      [color]="user.isOrganizationApproved ? 'warn' : 'accent'"
                      [matTooltip]="user.isOrganizationApproved ? 'Скасувати схвалення орг.' : 'Схвалити організацію'"
                      (click)="toggleOrgApproval(user)">
                      <mat-icon>{{ user.isOrganizationApproved ? 'domain_disabled' : 'domain_verification' }}</mat-icon>
                      {{ user.isOrganizationApproved ? 'Відкликати' : 'Схвалити орг.' }}
                    </button>
                  }
                </div>
              </div>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      animation: fadeInUp 0.3s ease both;
    }
    @keyframes fadeInUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }

    /* Header */
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .header-icon { font-size: 36px; width: 36px; height: 36px; color: #1565c0; }
    .page-title { margin: 0; font-size: 1.4rem; font-weight: 700; color: #212121; }
    .page-subtitle { margin: 2px 0 0; font-size: 0.85rem; color: #757575; }

    /* Stats */
    .stats-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .stat-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;
    }
    .stat-chip strong { font-size: 16px; font-weight: 700; }
    .pending-vol { background: #fff3e0; color: #e65100; }
    .pending-org { background: #fce4ec; color: #ad1457; }
    .clickable-chip {
      cursor: pointer; transition: opacity 0.15s, transform 0.15s;
      display: flex; align-items: center; gap: 6px;
    }
    .clickable-chip:hover { opacity: 0.82; transform: translateY(-1px); }
    .chip-icon { font-size: 16px; width: 16px; height: 16px; }
    .chip-arrow { font-size: 14px; width: 14px; height: 14px; opacity: 0.6; margin-left: auto; }

    /* Filter bar */
    .filter-bar { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
    .search-field { flex: 1; min-width: 220px; }
    .role-filter { width: 180px; }

    /* Loading / empty */
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: #bdbdbd; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }

    /* Count */
    .users-count { font-size: 12px; color: #9e9e9e; margin-bottom: 12px; }

    /* User grid */
    .user-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }

    /* Card */
    .user-card { padding: 16px; border-radius: 10px !important; }

    /* Card header */
    .user-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .avatar {
      width: 42px; height: 42px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 15px; flex-shrink: 0;
    }
    .user-info { flex: 1; min-width: 0; }
    .user-name { display: block; font-weight: 600; font-size: 14px; color: #212121; }
    .user-email { display: block; font-size: 12px; color: #757575; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .user-org { display: flex; align-items: center; gap: 3px; font-size: 12px; color: #e65100; margin-top: 2px; }
    .org-icon { font-size: 13px; width: 13px; height: 13px; }
    .role-badge { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; white-space: nowrap; }

    /* Status row */
    .user-status-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; padding: 10px 0 8px; font-size: 12px; }
    .status-pill { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500; }
    .status-pill mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .status-pill.green  { background: #e8f5e9; color: #2e7d32; }
    .status-pill.grey   { background: #f5f5f5; color: #757575; }
    .status-pill.amber  { background: #fff8e1; color: #f57f17; }
    .registered-date { display: flex; align-items: center; gap: 3px; color: #9e9e9e; font-size: 11px; margin-left: auto; }
    .registered-date mat-icon { font-size: 13px; width: 13px; height: 13px; }

    /* Actions */
    .user-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    .role-select { width: 100%; }
    .toggle-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .toggle-actions button { flex: 1; font-size: 12px; }

    /* Org name prompt */
    .org-name-prompt {
      display: flex; flex-direction: column; gap: 6px;
      padding: 10px 12px; background: #fff8e1;
      border: 1px solid #ffe082; border-radius: 8px;
    }
    .org-prompt-icon { font-size: 18px; width: 18px; height: 18px; color: #e65100; align-self: flex-start; margin-top: 4px; }
    .org-name-field { width: 100%; }
    .org-prompt-btns { display: flex; gap: 8px; }
    .org-confirm-btn { flex: 1; font-size: 12px; }

    @media (max-width: 600px) {
      .admin-page { padding: 12px; }
      .user-grid { grid-template-columns: 1fr; }
      .filter-bar { flex-direction: column; }
      .search-field, .role-filter { width: 100%; }
    }
  `]
})
export class UsersAdminComponent implements OnInit {
  private usersService = inject(UsersService);
  private snackBar = inject(MatSnackBar);
  private auth = inject(AuthService);
  public searchSubject = new Subject<string>();

  users = signal<UserDto[]>([]);
  loading = signal(false);
  searchText = signal('');
  roleFilter = signal('');
  statusFilter = signal('');
  orgNamePromptId = signal<string | null>(null);
  savingOrgName = signal(false);
  orgNameControl = new FormControl('', [Validators.required, Validators.minLength(2)]);
  private _pendingRole: UserRole | null = null;

  filteredUsers = computed(() => {
    const selfId = this.auth.currentUser()?.id;
    let list = this.users().filter(u => u.id !== selfId);
    const q = this.searchText().toLowerCase().trim();
    if (q) list = list.filter(u =>
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.organizationName?.toLowerCase().includes(q) ?? false)
    );
    if (this.roleFilter()) list = list.filter(u => u.role === this.roleFilter());
    if (this.statusFilter() === 'unconfirmed') list = list.filter(u => !u.isVolunteerConfirmed);
    if (this.statusFilter() === 'confirmed') list = list.filter(u => u.isVolunteerConfirmed);
    if (this.statusFilter() === 'pending-org') list = list.filter(u => u.role === 'OrganizationAdmin' && !u.isOrganizationApproved);
    return list;
  });

  roleStats = computed(() => {
    const counts: Record<string, number> = {};
    for (const u of this.users()) counts[u.role] = (counts[u.role] ?? 0) + 1;
    return Object.entries(ROLE_CONFIG).map(([role, cfg]) => ({
      role, count: counts[role] ?? 0, label: cfg.label, color: cfg.color, bg: cfg.bg
    })).filter(s => s.count > 0);
  });

  pendingVolunteers = computed(() => this.users().filter(u => !u.isVolunteerConfirmed && u.role === 'Volunteer').length);
  pendingOrgs = computed(() => this.users().filter(u => u.role === 'OrganizationAdmin' && !u.isOrganizationApproved).length);

  constructor() {
    this.searchSubject.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(v => this.searchText.set(v));
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.usersService.getAll().subscribe({
      next: users => { this.users.set(users); this.loading.set(false); },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'Помилка завантаження', 'OK', { duration: 3000, panelClass: 'error-snack' });
        this.loading.set(false);
      }
    });
  }

  onRoleSelected(user: UserDto, role: UserRole) {
    if (role === 'OrganizationAdmin') {
      this._pendingRole = role;
      this.orgNameControl.setValue(user.organizationName ?? '');
      this.orgNameControl.markAsUntouched();
      this.orgNamePromptId.set(user.id);
    } else {
      this.cancelOrgNamePrompt();
      this.updateRole(user, role);
    }
  }

  cancelOrgNamePrompt() {
    this.orgNamePromptId.set(null);
    this._pendingRole = null;
  }

  confirmRoleAndOrg(user: UserDto) {
    this.orgNameControl.markAllAsTouched();
    if (this.orgNameControl.invalid) return;
    const orgName = this.orgNameControl.value!.trim();
    const role = this._pendingRole ?? 'OrganizationAdmin';
    this.savingOrgName.set(true);
    this.usersService.updateRole(user.id, role).subscribe({
      next: () => {
        this.usersService.setOrganizationName(user.id, orgName).subscribe({
          next: () => {
            this.users.update(list => list.map(u =>
              u.id === user.id ? { ...u, role, organizationName: orgName } : u
            ));
            this.snackBar.open('Роль та організацію оновлено', 'OK', { duration: 2500, panelClass: 'success-snack' });
            this.savingOrgName.set(false);
            this.orgNamePromptId.set(null);
            this._pendingRole = null;
          },
          error: () => {
            this.savingOrgName.set(false);
            this.snackBar.open('Помилка збереження організації', 'OK', { duration: 3000 });
          }
        });
      },
      error: () => {
        this.savingOrgName.set(false);
        this.snackBar.open('Помилка оновлення ролі', 'OK', { duration: 3000, panelClass: 'error-snack' });
      }
    });
  }

  updateRole(user: UserDto, role: UserRole) {
    this.usersService.updateRole(user.id, role).subscribe({
      next: () => {
        this.users.update(list => list.map(u => u.id === user.id ? { ...u, role } : u));
        this.snackBar.open('Роль оновлено', 'OK', { duration: 2500, panelClass: 'success-snack' });
      },
      error: () => this.snackBar.open('Помилка оновлення ролі', 'OK', { duration: 3000, panelClass: 'error-snack' })
    });
  }

  toggleConfirm(user: UserDto) {
    const newVal = !user.isVolunteerConfirmed;
    this.usersService.confirmVolunteer(user.id, newVal).subscribe({
      next: () => {
        this.users.update(list => list.map(u => u.id === user.id ? { ...u, isVolunteerConfirmed: newVal } : u));
        this.snackBar.open(newVal ? 'Волонтера підтверджено' : 'Підтвердження скасовано', 'OK',
          { duration: 2500, panelClass: 'success-snack' });
      },
      error: () => this.snackBar.open('Помилка', 'OK', { duration: 3000 })
    });
  }

  toggleOrgApproval(user: UserDto) {
    const newVal = !user.isOrganizationApproved;
    this.usersService.approveOrganization(user.id, newVal).subscribe({
      next: () => {
        this.users.update(list => list.map(u => u.id === user.id ? { ...u, isOrganizationApproved: newVal } : u));
        this.snackBar.open(newVal ? 'Організацію схвалено' : 'Схвалення відкликано', 'OK',
          { duration: 2500, panelClass: 'success-snack' });
      },
      error: () => this.snackBar.open('Помилка', 'OK', { duration: 3000 })
    });
  }

  roleConfig(role: string) {
    return ROLE_CONFIG[role] ?? ROLE_CONFIG['Guest'];
  }

  initials(user: UserDto) {
    return ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')).toUpperCase() || '?';
  }

  avatarColor(user: UserDto): string {
    const colors = ['#1565c0', '#6a1b9a', '#2e7d32', '#e65100', '#ad1457', '#37474f'];
    let hash = 0;
    for (const c of user.email) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
    return colors[Math.abs(hash) % colors.length];
  }
}
