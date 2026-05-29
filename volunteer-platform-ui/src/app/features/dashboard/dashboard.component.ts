import {
  Component, OnInit, OnDestroy, signal, computed, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { Subscription } from 'rxjs';
import { DashboardService, DashboardStatsDto } from '../../core/services/dashboard.service';
import { SignalRService } from '../../core/services/signalr.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  bg: string;
  subtitle?: string;
  routerLink?: string;
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatTooltipModule, MatDividerModule, MatBadgeModule,
    SkeletonComponent
  ],
  template: `
    <div class="dashboard-page">
      <!-- ── Page header ────────────────────────────────────────── -->
      <div class="page-header">
        <div class="header-left">
          <mat-icon class="header-icon">dashboard</mat-icon>
          <div>
            <h1 class="page-title">Дашборд платформи</h1>
            <p class="page-subtitle">Статистика в реальному часі</p>
          </div>
        </div>
        <div class="header-right">
          @if (stats()) {
            <span class="last-updated" [matTooltip]="'Оновлено: ' + (stats()!.generatedAt | date:'HH:mm:ss')">
              <mat-icon class="live-dot">circle</mat-icon>
              Живі дані
            </span>
          }
          <button mat-stroked-button (click)="refresh()" [disabled]="loading()">
            <mat-icon>refresh</mat-icon>
            Оновити
          </button>
        </div>
      </div>

      <!-- ── Skeleton loading ──────────────────────────────────── -->
      @if (loading() && !stats()) {
        @for (section of [0, 1, 2]; track section) {
          <section class="stat-section">
            <div class="section-label-skeleton">
              <app-skeleton width="120px" height="14px" />
            </div>
            <div class="cards-grid">
              @for (card of [0, 1, 2, 3]; track card) {
                <div class="stat-card skeleton-card">
                  <app-skeleton type="stat" />
                </div>
              }
            </div>
          </section>
        }
      }

      @if (stats(); as s) {
        <!-- ── Section: Initiatives ──────────────────────────────── -->
        <section class="stat-section">
          <div class="section-label">
            <mat-icon>volunteer_activism</mat-icon>
            <span>Ініціативи</span>
          </div>
          <div class="cards-grid">
            @for (card of initiativeCards(); track card.label) {
              <div class="stat-card" [style.--accent]="card.color" [style.background]="card.bg"
                [routerLink]="card.routerLink" [queryParams]="card.queryParams" [class.clickable]="card.routerLink">
                <div class="card-icon-wrap" [style.background]="card.color + '22'">
                  <mat-icon [style.color]="card.color">{{ card.icon }}</mat-icon>
                </div>
                <div class="card-body">
                  <div class="card-value" [style.color]="card.color">
                    {{ card.value | number }}
                  </div>
                  <div class="card-label">{{ card.label }}</div>
                  @if (card.subtitle) {
                    <div class="card-subtitle">{{ card.subtitle }}</div>
                  }
                </div>
              </div>
            }
          </div>
        </section>

        <mat-divider></mat-divider>

        <!-- ── Section: Tasks ────────────────────────────────────── -->
        <section class="stat-section">
          <div class="section-label">
            <mat-icon>task_alt</mat-icon>
            <span>Завдання</span>
          </div>
          <div class="cards-grid">
            @for (card of taskCards(); track card.label) {
              <div class="stat-card" [style.--accent]="card.color" [style.background]="card.bg"
                [class.clickable]="card.routerLink">
                <div class="card-icon-wrap" [style.background]="card.color + '22'">
                  <mat-icon [style.color]="card.color">{{ card.icon }}</mat-icon>
                </div>
                <div class="card-body">
                  <div class="card-value" [style.color]="card.color">
                    {{ card.value | number }}
                  </div>
                  <div class="card-label">{{ card.label }}</div>
                  @if (card.subtitle) {
                    <div class="card-subtitle">{{ card.subtitle }}</div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Task progress bar strip -->
          <div class="task-progress-strip">
            @if (s.totalTasks > 0) {
              <div class="progress-bar-container" matTooltip="Прогрес виконання завдань">
                <div class="progress-segment pending"
                  [style.width.%]="pct(s.tasksPending, s.totalTasks)"
                  [matTooltip]="'В очікуванні: ' + s.tasksPending">
                </div>
                <div class="progress-segment accepted"
                  [style.width.%]="pct(s.tasksAccepted, s.totalTasks)"
                  [matTooltip]="'Прийнято: ' + s.tasksAccepted">
                </div>
                <div class="progress-segment inprogress"
                  [style.width.%]="pct(s.tasksInProgress, s.totalTasks)"
                  [matTooltip]="'В роботі: ' + s.tasksInProgress">
                </div>
                <div class="progress-segment completed"
                  [style.width.%]="pct(s.tasksCompleted + s.tasksVerified, s.totalTasks)"
                  [matTooltip]="'Виконано: ' + (s.tasksCompleted + s.tasksVerified)">
                </div>
                <div class="progress-segment rejected"
                  [style.width.%]="pct(s.tasksRejected, s.totalTasks)"
                  [matTooltip]="'Відхилено: ' + s.tasksRejected">
                </div>
              </div>
              <div class="progress-legend">
                <span><span class="dot pending"></span>В очікуванні ({{ s.tasksPending }})</span>
                <span><span class="dot accepted"></span>Прийнято ({{ s.tasksAccepted }})</span>
                <span><span class="dot inprogress"></span>В роботі ({{ s.tasksInProgress }})</span>
                <span><span class="dot completed"></span>Виконано ({{ s.tasksCompleted + s.tasksVerified }})</span>
                <span><span class="dot rejected"></span>Відхилено ({{ s.tasksRejected }})</span>
              </div>
            } @else {
              <p class="no-tasks-hint">Завдань ще немає</p>
            }
          </div>
        </section>

        <mat-divider></mat-divider>

        <!-- ── Section: Volunteers ───────────────────────────────── -->
        <section class="stat-section">
          <div class="section-label">
            <mat-icon>people</mat-icon>
            <span>Волонтери</span>
          </div>
          <div class="cards-grid">
            @for (card of volunteerCards(); track card.label) {
              <div class="stat-card" [style.--accent]="card.color" [style.background]="card.bg">
                <div class="card-icon-wrap" [style.background]="card.color + '22'">
                  <mat-icon [style.color]="card.color">{{ card.icon }}</mat-icon>
                </div>
                <div class="card-body">
                  <div class="card-value" [style.color]="card.color">
                    {{ card.value | number }}
                  </div>
                  <div class="card-label">{{ card.label }}</div>
                </div>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .dashboard-page {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      animation: fadeInUp 0.3s ease both;
      min-height: calc(100vh - 64px);
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .header-icon { font-size: 36px; width: 36px; height: 36px; color: #1565c0; }
    .page-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: #212121; }
    .page-subtitle { margin: 2px 0 0; font-size: 0.85rem; color: #757575; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .last-updated {
      display: flex; align-items: center; gap: 5px;
      font-size: 13px; color: #4caf50; font-weight: 500;
    }
    .live-dot { font-size: 10px; width: 10px; height: 10px; animation: pulse 2s infinite; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* Loading */
    .loading-center {
      display: flex; flex-direction: column; align-items: center;
      padding: 80px 0; gap: 16px; color: #9e9e9e;
    }

    /* Skeleton */
    .section-label-skeleton { margin-bottom: 14px; }
    .skeleton-card { padding: 0; overflow: hidden; }

    /* Sections */
    .stat-section { padding: 20px 0; }
    .section-label {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.95rem; font-weight: 600; color: #424242; margin-bottom: 16px;
    }
    .section-label mat-icon { color: #1565c0; font-size: 20px; width: 20px; height: 20px; }

    /* Cards grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 14px;
      margin-bottom: 12px;
    }
    .stat-card {
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      border: 1px solid rgba(0,0,0,0.06);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .stat-card.clickable { cursor: pointer; }
    .stat-card.clickable:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }
    .card-icon-wrap {
      width: 44px; height: 44px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .card-icon-wrap mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .card-body { min-width: 0; }
    .card-value { font-size: 1.75rem; font-weight: 700; line-height: 1; }
    .card-label { font-size: 0.78rem; color: #616161; margin-top: 4px; font-weight: 500; }
    .card-subtitle { font-size: 0.7rem; color: #9e9e9e; margin-top: 2px; }

    /* Task progress strip */
    .task-progress-strip { margin-top: 8px; }
    .progress-bar-container {
      display: flex; height: 12px; border-radius: 6px; overflow: hidden;
      background: #f5f5f5; margin-bottom: 10px;
    }
    .progress-segment { transition: width 0.5s ease; }
    .progress-segment.pending    { background: #9e9e9e; }
    .progress-segment.accepted   { background: #42a5f5; }
    .progress-segment.inprogress { background: #ff9800; }
    .progress-segment.completed  { background: #66bb6a; }
    .progress-segment.rejected   { background: #ef5350; }

    .progress-legend {
      display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #616161;
    }
    .progress-legend span { display: flex; align-items: center; gap: 5px; }
    .dot {
      width: 10px; height: 10px; border-radius: 50%; display: inline-block;
    }
    .dot.pending    { background: #9e9e9e; }
    .dot.accepted   { background: #42a5f5; }
    .dot.inprogress { background: #ff9800; }
    .dot.completed  { background: #66bb6a; }
    .dot.rejected   { background: #ef5350; }

    .no-tasks-hint { color: #bdbdbd; font-size: 13px; margin: 0; }

    mat-divider { margin: 0; }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 600px) {
      .dashboard-page { padding: 12px; }
      .cards-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
      .header-right { width: 100%; justify-content: space-between; }
    }
    @media (max-width: 400px) {
      .cards-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private signalR = inject(SignalRService);

  loading = signal(true);
  stats = signal<DashboardStatsDto | null>(null);
  private subs = new Subscription();

  // ── Computed card arrays ──────────────────────────────────────────

  initiativeCards = computed((): StatCard[] => {
    const s = this.stats();
    if (!s) return [];
    return [
      {
        label: 'Активних',
        value: s.activeInitiatives,
        icon: 'play_circle',
        color: '#1565c0',
        bg: '#e3f2fd',
        routerLink: '/',
        queryParams: { status: 'Active' }
      },
      {
        label: 'Запланованих',
        value: s.plannedInitiatives,
        icon: 'event',
        color: '#6a1b9a',
        bg: '#f3e5f5',
        routerLink: '/',
        queryParams: { status: 'Planned' }
      },
      {
        label: 'Завершених',
        value: s.completedInitiatives,
        icon: 'check_circle',
        color: '#2e7d32',
        bg: '#e8f5e9',
        routerLink: '/',
        queryParams: { status: 'Completed' }
      },
      {
        label: '🚨 Екстрених',
        value: s.emergencyInitiatives,
        icon: 'warning',
        color: '#c62828',
        bg: '#ffebee',
        subtitle: 'Активних зараз',
        routerLink: '/',
        queryParams: { isEmergency: 'true' }
      },
      {
        label: 'Всього',
        value: s.totalInitiatives,
        icon: 'volunteer_activism',
        color: '#455a64',
        bg: '#eceff1',
        routerLink: '/'
      }
    ];
  });

  taskCards = computed((): StatCard[] => {
    const s = this.stats();
    if (!s) return [];
    return [
      {
        label: 'В очікуванні',
        value: s.tasksPending,
        icon: 'hourglass_empty',
        color: '#757575',
        bg: '#f5f5f5'
      },
      {
        label: 'Прийнято',
        value: s.tasksAccepted,
        icon: 'how_to_reg',
        color: '#1976d2',
        bg: '#e3f2fd'
      },
      {
        label: 'В роботі',
        value: s.tasksInProgress,
        icon: 'engineering',
        color: '#e65100',
        bg: '#fff3e0'
      },
      {
        label: 'Виконано',
        value: s.tasksCompleted + s.tasksVerified,
        icon: 'task_alt',
        color: '#2e7d32',
        bg: '#e8f5e9',
        subtitle: `Сьогодні: +${s.tasksCompletedToday}`
      },
      {
        label: 'Прострочено',
        value: s.tasksOverdue,
        icon: 'alarm_off',
        color: '#b71c1c',
        bg: '#ffebee'
      },
      {
        label: 'Всього завдань',
        value: s.totalTasks,
        icon: 'list_alt',
        color: '#37474f',
        bg: '#eceff1'
      }
    ];
  });

  volunteerCards = computed((): StatCard[] => {
    const s = this.stats();
    if (!s) return [];
    return [
      {
        label: 'Всього волонтерів',
        value: s.totalVolunteers,
        icon: 'people',
        color: '#1565c0',
        bg: '#e3f2fd'
      }
    ];
  });

  // —— Lifecycle ——————————————————————————————

  ngOnInit(): void {
    this.loadStats();
    this.subs.add(
      this.signalR.dashboardUpdated$.subscribe(() => this.loadStats())
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  refresh(): void {
    this.loadStats();
  }

  pct(part: number, total: number): number {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  }

  private loadStats(): void {
    this.loading.set(true);
    this.dashboardService.getStats().subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
