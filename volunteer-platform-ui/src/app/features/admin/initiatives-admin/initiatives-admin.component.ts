import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { InitiativesService } from '../../../core/services/initiatives.service';
import { ApplicationsService } from '../../../core/services/applications.service';
import { InitiativeDto } from '../../../shared/models/initiative.model';
import { ApplicationDto } from '../../../shared/models/application.model';

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  Environmental: { label: 'Екологічна', icon: '🌿', color: '#2e7d32', bg: '#e8f5e9' },
  Social:        { label: 'Соціальна',  icon: '🤝', color: '#1565c0', bg: '#e3f2fd' },
  Medical:       { label: 'Медична',    icon: '🏥', color: '#c62828', bg: '#ffebee' },
  Educational:   { label: 'Освітня',    icon: '📚', color: '#6a1b9a', bg: '#f3e5f5' },
  Other:         { label: 'Інша',       icon: '🔧', color: '#546e7a', bg: '#eceff1' },
};
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Active:    { label: 'Активна',     color: '#2e7d32', bg: '#e8f5e9' },
  Planned:   { label: 'Запланована', color: '#1565c0', bg: '#e3f2fd' },
  Completed: { label: 'Завершена',   color: '#6a1b9a', bg: '#f3e5f5' },
  Archived:  { label: 'Архівна',     color: '#757575', bg: '#f5f5f5' },
};
const APP_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Pending:  { label: 'Очікує',    color: '#e65100', bg: '#fff3e0' },
  Approved: { label: 'Ухвалено',  color: '#2e7d32', bg: '#e8f5e9' },
  Rejected: { label: 'Відхилено', color: '#c62828', bg: '#ffebee' },
};

@Component({
  selector: 'app-initiatives-admin',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatButtonModule, MatIconModule, MatSnackBarModule, MatTooltipModule,
    MatProgressBarModule, MatDividerModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatChipsModule,
  ],
  template: `
    <div class="page">

      <!-- ── Page header ─────────────────────────────────────────── -->
      <div class="page-header">
        <div class="header-left">
          <mat-icon class="page-icon">volunteer_activism</mat-icon>
          <div>
            <h1 class="page-title">Управління ініціативами</h1>
            <p class="page-sub">{{ initiatives().length }} ініціатив зареєстровано</p>
          </div>
        </div>
        <button mat-stroked-button (click)="reload()" [disabled]="loading()">
          <mat-icon>refresh</mat-icon>
          Оновити
        </button>
      </div>

      <!-- ── Filters ──────────────────────────────────────────────── -->
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Пошук за назвою</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="searchText" placeholder="Введіть назву...">
          @if (searchText) {
            <button matSuffix mat-icon-button (click)="searchText = ''">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="status-field">
          <mat-label>Статус</mat-label>
          <mat-select [(ngModel)]="statusFilter">
            <mat-option value="">Всі</mat-option>
            <mat-option value="Active">Активні</mat-option>
            <mat-option value="Planned">Заплановані</mat-option>
            <mat-option value="Completed">Завершені</mat-option>
            <mat-option value="Archived">Архівні</mat-option>
          </mat-select>
        </mat-form-field>

        <span class="filter-count">Показано {{ filtered().length }} із {{ initiatives().length }}</span>
      </div>

      <!-- ── Loading ──────────────────────────────────────────────── -->
      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      }

      <!-- ── Initiative cards ─────────────────────────────────────── -->
      @if (!loading()) {
        <div class="initiatives-list">
          @for (ini of filtered(); track ini.id) {
            <div class="ini-card" [class.expanded]="selectedInitiativeId() === ini.id">

              <!-- Card body -->
              <div class="ini-body">
                <div class="ini-main">
                  <div class="ini-title-row">
                    <span class="ini-title">{{ ini.title }}</span>
                    @if (ini.isEmergency) {
                      <span class="emergency-badge">🚨 Екстрена</span>
                    }
                  </div>
                  <div class="ini-meta">
                    <span class="category-chip"
                      [style.color]="catConfig(ini.category).color"
                      [style.background]="catConfig(ini.category).bg">
                      {{ catConfig(ini.category).icon }} {{ catConfig(ini.category).label }}
                    </span>
                    <span class="status-chip"
                      [style.color]="statusConfig(ini.status).color"
                      [style.background]="statusConfig(ini.status).bg">
                      {{ statusConfig(ini.status).label }}
                    </span>
                    <span class="date-meta">
                      <mat-icon class="meta-icon">event</mat-icon>
                      {{ ini.startDate | date:'dd.MM.yyyy' }}
                    </span>
                  </div>
                </div>

                <div class="ini-participants">
                  <span class="part-count">
                    <mat-icon class="part-icon">people</mat-icon>
                    {{ ini.currentParticipants ?? 0 }} / {{ ini.maxParticipants }}
                  </span>
                  <mat-progress-bar
                    mode="determinate"
                    [value]="(ini.currentParticipants ?? 0) / ini.maxParticipants * 100"
                    [color]="(ini.currentParticipants ?? 0) >= ini.maxParticipants ? 'warn' : 'primary'"
                    class="part-bar">
                  </mat-progress-bar>
                </div>

                <div class="ini-actions">
                  <button mat-stroked-button
                    [color]="selectedInitiativeId() === ini.id ? 'warn' : 'primary'"
                    (click)="toggleApplications(ini.id)"
                    matTooltip="Заявки учасників">
                    <mat-icon>{{ selectedInitiativeId() === ini.id ? 'close' : 'how_to_reg' }}</mat-icon>
                    {{ selectedInitiativeId() === ini.id ? 'Закрити' : 'Заявки' }}
                    @if (pendingCount(ini.id) > 0) {
                      <span class="pending-dot">{{ pendingCount(ini.id) }}</span>
                    }
                  </button>
                  <button mat-icon-button color="primary"
                    [routerLink]="['/', 'initiatives', ini.id]"
                    matTooltip="Переглянути ініціативу">
                    <mat-icon>open_in_new</mat-icon>
                  </button>
                  <button mat-icon-button color="warn"
                    (click)="delete(ini.id)"
                    matTooltip="Видалити ініціативу">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Applications panel (expands inline) -->
              @if (selectedInitiativeId() === ini.id) {
                <div class="apps-panel">
                  <mat-divider></mat-divider>

                  <div class="apps-header">
                    <mat-icon>how_to_reg</mat-icon>
                    <span class="apps-title">Заявки на участь</span>
                    <span class="apps-count">{{ applicationsForSelected().length }}</span>
                  </div>

                  @if (appsLoading()) {
                    <div class="apps-loading"><mat-spinner diameter="32"></mat-spinner></div>
                  } @else if (applicationsForSelected().length === 0) {
                    <div class="apps-empty">
                      <mat-icon>inbox</mat-icon>
                      <span>Заявок ще немає</span>
                    </div>
                  } @else {
                    <div class="apps-list">
                      @for (app of applicationsForSelected(); track app.id) {
                        <div class="app-card">
                          <div class="app-avatar">{{ initials(app.userName) }}</div>
                          <div class="app-info">
                            <div class="app-name">{{ app.userName }}</div>
                            <div class="app-date">{{ app.submittedAt | date:'dd MMM yyyy, HH:mm' }}</div>
                            @if (app.comment) {
                              <div class="app-comment">{{ app.comment }}</div>
                            }
                          </div>
                          <div class="app-right">
                            <span class="app-status-chip"
                              [style.color]="appStatusConfig(app.status).color"
                              [style.background]="appStatusConfig(app.status).bg">
                              {{ appStatusConfig(app.status).label }}
                            </span>
                            @if (app.status === 'Pending') {
                              <div class="app-btns">
                                <button mat-flat-button color="primary" (click)="approve(app.id)">
                                  <mat-icon>check</mat-icon> Прийняти
                                </button>
                                <button mat-flat-button color="warn" (click)="reject(app.id)">
                                  <mat-icon>close</mat-icon> Відхилити
                                </button>
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }

          @if (!loading() && filtered().length === 0) {
            <div class="empty-state">
              <mat-icon>search_off</mat-icon>
              <p>Ініціатив не знайдено</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page {
      padding: 24px 28px;
      background: #f5f7fb;
      min-height: calc(100vh - 64px);
    }

    /* Header */
    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .page-icon { font-size: 36px; width: 36px; height: 36px; color: #1565c0; }
    .page-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: #1a237e; }
    .page-sub { margin: 2px 0 0; font-size: 13px; color: #78909c; }

    /* Filters */
    .filter-bar {
      display: flex; align-items: center; gap: 12px;
      background: white; padding: 12px 16px;
      border-radius: 10px; margin-bottom: 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      flex-wrap: wrap;
    }
    .search-field { flex: 1; min-width: 200px; }
    .status-field { width: 160px; }
    .filter-count { font-size: 12px; color: #9e9e9e; margin-left: auto; white-space: nowrap; }

    /* Loading */
    .loading-center {
      display: flex; justify-content: center; padding: 60px;
    }

    /* Initiative list */
    .initiatives-list { display: flex; flex-direction: column; gap: 10px; }

    .ini-card {
      background: white;
      border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07);
      overflow: hidden;
      transition: box-shadow 0.2s;
    }
    .ini-card:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.12); }
    .ini-card.expanded { box-shadow: 0 4px 16px rgba(21,101,192,0.15); }

    .ini-body {
      display: flex; align-items: center; gap: 16px;
      padding: 14px 18px;
    }

    .ini-main { flex: 1; min-width: 0; }
    .ini-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .ini-title {
      font-size: 14px; font-weight: 600; color: #212121;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .emergency-badge {
      font-size: 11px; background: #ffebee; color: #c62828;
      padding: 1px 8px; border-radius: 10px; white-space: nowrap; flex-shrink: 0;
    }
    .ini-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .category-chip, .status-chip {
      font-size: 11px; font-weight: 600;
      padding: 2px 10px; border-radius: 10px; white-space: nowrap;
    }
    .date-meta {
      display: flex; align-items: center; gap: 3px;
      font-size: 11px; color: #9e9e9e;
    }
    .meta-icon { font-size: 13px; width: 13px; height: 13px; }

    .ini-participants {
      width: 120px; flex-shrink: 0; text-align: center;
    }
    .part-count {
      display: flex; align-items: center; justify-content: center; gap: 4px;
      font-size: 13px; color: #424242; margin-bottom: 4px;
    }
    .part-icon { font-size: 14px; width: 14px; height: 14px; color: #9e9e9e; }
    .part-bar { border-radius: 4px; height: 6px; }

    .ini-actions {
      display: flex; align-items: center; gap: 4px; flex-shrink: 0;
    }
    .pending-dot {
      display: inline-flex; align-items: center; justify-content: center;
      background: #ff5252; color: white;
      border-radius: 10px; font-size: 10px; font-weight: 700;
      min-width: 16px; height: 16px; padding: 0 4px; margin-left: 4px;
    }

    /* Applications panel */
    .apps-panel { padding: 0 18px 16px; }
    .apps-header {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 0 10px;
      font-size: 14px; font-weight: 600; color: #1a237e;
    }
    .apps-header mat-icon { color: #1565c0; font-size: 18px; width: 18px; height: 18px; }
    .apps-count {
      background: #e3f2fd; color: #1565c0;
      border-radius: 10px; font-size: 11px; font-weight: 700;
      padding: 1px 8px;
    }
    .apps-loading { display: flex; justify-content: center; padding: 24px; }
    .apps-empty {
      display: flex; align-items: center; gap: 8px;
      padding: 16px; color: #9e9e9e; font-size: 13px;
    }
    .apps-list { display: flex; flex-direction: column; gap: 8px; }

    .app-card {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 12px 14px;
      background: #fafafa; border-radius: 8px;
      border: 1px solid rgba(0,0,0,0.06);
    }
    .app-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #1565c0, #42a5f5);
      color: white; font-size: 13px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .app-info { flex: 1; min-width: 0; }
    .app-name { font-size: 13px; font-weight: 600; color: #212121; }
    .app-date { font-size: 11px; color: #9e9e9e; margin-top: 1px; }
    .app-comment {
      font-size: 12px; color: #616161; margin-top: 4px;
      font-style: italic; white-space: pre-wrap;
    }
    .app-right {
      display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0;
    }
    .app-status-chip {
      font-size: 11px; font-weight: 600;
      padding: 2px 10px; border-radius: 10px; white-space: nowrap;
    }
    .app-btns { display: flex; gap: 6px; }
    .app-btns button { font-size: 12px !important; height: 30px !important; line-height: 30px !important; display: flex; align-items: center; gap: 4px; }
    .app-btns mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Empty state */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px; padding: 60px; color: #9e9e9e;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }

    @media (max-width: 700px) {
      .ini-body { flex-wrap: wrap; }
      .ini-participants { width: auto; flex: 1; }
    }
  `]
})
export class InitiativesAdminComponent implements OnInit {
  initiatives      = signal<InitiativeDto[]>([]);
  loading          = signal(false);
  appsLoading      = signal(false);
  selectedInitiativeId = signal<string | null>(null);
  applicationsForSelected = signal<ApplicationDto[]>([]);
  searchText       = '';
  statusFilter     = '';

  filtered = computed(() => {
    let list = this.initiatives();
    const q = this.searchText.toLowerCase().trim();
    if (q) list = list.filter(i => i.title.toLowerCase().includes(q));
    if (this.statusFilter) list = list.filter(i => i.status === this.statusFilter);
    return list;
  });

  constructor(
    private service: InitiativesService,
    private appsService: ApplicationsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() { this.reload(); }

  reload() {
    this.loading.set(true);
    this.service.getAll({ page: 1, pageSize: 200 }).subscribe({
      next: r => { this.initiatives.set(r.items); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Помилка завантаження', 'OK', { duration: 3000 }); }
    });
  }

  toggleApplications(id: string) {
    if (this.selectedInitiativeId() === id) {
      this.selectedInitiativeId.set(null);
      this.applicationsForSelected.set([]);
      return;
    }
    this.selectedInitiativeId.set(id);
    this.appsLoading.set(true);
    this.appsService.getForInitiative(id).subscribe({
      next: list => { this.applicationsForSelected.set(list); this.appsLoading.set(false); },
      error: () => { this.appsLoading.set(false); this.snackBar.open('Не вдалося завантажити заявки', 'OK', { duration: 3000 }); }
    });
  }

  delete(id: string) {
    this.service.delete(id).subscribe({
      next: () => {
        this.initiatives.update(list => list.filter(i => i.id !== id));
        if (this.selectedInitiativeId() === id) { this.selectedInitiativeId.set(null); this.applicationsForSelected.set([]); }
        this.snackBar.open('Ініціативу видалено', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Помилка видалення', 'OK', { duration: 3000 })
    });
  }

  approve(applicationId: string) {
    this.appsService.approve(applicationId).subscribe({
      next: () => {
        this.applicationsForSelected.update(list => list.map(a => a.id === applicationId ? { ...a, status: 'Approved' as any } : a));
        this.snackBar.open('Заявку ухвалено', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Помилка', 'OK', { duration: 3000 })
    });
  }

  reject(applicationId: string) {
    this.appsService.reject(applicationId).subscribe({
      next: () => {
        this.applicationsForSelected.update(list => list.map(a => a.id === applicationId ? { ...a, status: 'Rejected' as any } : a));
        this.snackBar.open('Заявку відхилено', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Помилка', 'OK', { duration: 3000 })
    });
  }

  pendingCount(initiativeId: string): number {
    if (this.selectedInitiativeId() !== initiativeId) return 0;
    return this.applicationsForSelected().filter(a => a.status === 'Pending').length;
  }

  catConfig(cat: string) { return CATEGORY_CONFIG[cat] ?? { label: cat, icon: '', color: '#546e7a', bg: '#eceff1' }; }
  statusConfig(s: string) { return STATUS_CONFIG[s] ?? { label: s, color: '#546e7a', bg: '#eceff1' }; }
  appStatusConfig(s: string) { return APP_STATUS_CONFIG[s] ?? { label: s, color: '#546e7a', bg: '#eceff1' }; }
  initials(name: string) {
    return (name ?? '?').split(' ').slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
  }
}
