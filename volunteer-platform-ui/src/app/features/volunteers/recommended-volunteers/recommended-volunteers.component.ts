import {
  Component, input, signal, inject, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InitiativesService } from '../../../core/services/initiatives.service';
import { VolunteerRecommendationDto } from '../../../shared/models/volunteer-recommendation.model';

interface ScoreBar { label: string; value: number; color: string; tooltip: string; }

@Component({
  selector: 'app-recommended-volunteers',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    MatTooltipModule, MatDividerModule, MatSnackBarModule
  ],
  template: `
    <div class="rec-container">
      <div class="rec-header">
        <mat-icon class="header-icon">group_add</mat-icon>
        <span class="header-title">Рекомендовані волонтери</span>
        <button mat-icon-button class="refresh-btn" [disabled]="loading()" (click)="load()" matTooltip="Оновити список">
          <mat-icon [class.spin]="loading()">refresh</mat-icon>
        </button>
      </div>

      <mat-divider></mat-divider>

      @if (loading()) {
        <div class="rec-loading">
          <mat-spinner diameter="36"></mat-spinner>
          <span>Розраховуємо рейтинг…</span>
        </div>
      }

      @if (!loading() && error()) {
        <div class="rec-error">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error() }}</span>
          <button mat-button color="primary" (click)="load()">Спробувати знову</button>
        </div>
      }

      @if (!loading() && !error() && volunteers().length === 0) {
        <div class="rec-empty">
          <mat-icon>person_search</mat-icon>
          <span>Підтверджених волонтерів ще немає</span>
        </div>
      }

      @if (!loading() && !error()) {
        <div class="rec-list">
          @for (v of volunteers(); track v.volunteerId) {
            <div class="rec-card">
              <div class="avatar" [style.background]="avatarColor(v.fullName)">
                {{ initials(v.fullName) }}
              </div>
              <div class="card-body">
                <div class="name-row">
                  <span class="full-name">{{ v.fullName }}</span>
                </div>
                <div class="email">{{ v.email }}</div>

                <div class="stats-row">
                  <span class="stat" matTooltip="Заявки в цій категорії">
                    <mat-icon class="stat-icon">category</mat-icon>{{ v.categoryApplications }}
                  </span>
                  <span class="stat" matTooltip="Всього заявок">
                    <mat-icon class="stat-icon">how_to_reg</mat-icon>{{ v.totalApplications }}
                  </span>
                  <span class="stat" matTooltip="Активні завдання">
                    <mat-icon class="stat-icon">pending_actions</mat-icon>{{ v.activeTasks }}
                  </span>
                  <span class="stat" matTooltip="Завершені завдання">
                    <mat-icon class="stat-icon">task_alt</mat-icon>{{ v.completedTasks }}
                  </span>
                </div>

                <div class="score-bars">
                  @for (bar of scoreBars(v); track bar.label) {
                    <div class="score-bar-row" [matTooltip]="bar.tooltip">
                      <span class="bar-label">{{ bar.label }}</span>
                      <div class="bar-track">
                        <div class="bar-fill" [style.width.%]="bar.value" [style.background]="bar.color"></div>
                      </div>
                      <span class="bar-value">{{ bar.value | number:'1.0-0' }}</span>
                    </div>
                  }
                </div>

                <div class="invite-row">
                  <button mat-stroked-button color="primary" class="invite-btn"
                    [disabled]="invitedIds().has(v.volunteerId) || invitingId() === v.volunteerId"
                    (click)="invite(v.volunteerId)"
                    matTooltip="Надіслати запрошення цьому волонтеру">
                    @if (invitingId() === v.volunteerId) {
                      <mat-spinner diameter="14" class="btn-spinner"></mat-spinner>
                    } @else if (invitedIds().has(v.volunteerId)) {
                      <mat-icon class="btn-icon">check</mat-icon>
                    } @else {
                      <mat-icon class="btn-icon">send</mat-icon>
                    }
                    {{ invitedIds().has(v.volunteerId) ? 'Запрошено' : 'Запросити' }}
                  </button>
                </div>
              </div>
            </div>
            @if (!$last) { <mat-divider></mat-divider> }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .rec-container { display: flex; flex-direction: column; gap: 0; }
    .rec-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px 10px; }
    .header-icon { color: #1565c0; font-size: 20px; width: 20px; height: 20px; }
    .header-title { font-size: 14px; font-weight: 600; color: #212121; flex: 1; }
    .refresh-btn { color: #757575; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .rec-loading, .rec-error, .rec-empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px; padding: 28px 16px; color: #9e9e9e; font-size: 13px;
    }
    .rec-error { color: #c62828; }
    .rec-error mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .rec-empty mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .rec-list { display: flex; flex-direction: column; }
    .rec-card { display: flex; gap: 12px; padding: 12px 16px; transition: background 0.15s; }
    .rec-card:hover { background: #fafafa; }
    .avatar {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 600; color: white;
      flex-shrink: 0; align-self: flex-start; margin-top: 2px;
    }
    .card-body { flex: 1; min-width: 0; }
    .name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
    .full-name { font-size: 13px; font-weight: 600; color: #212121; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .email { font-size: 11px; color: #9e9e9e; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .stats-row { display: flex; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
    .stat { display: flex; align-items: center; gap: 3px; font-size: 12px; color: #616161; cursor: default; }
    .stat-icon { font-size: 14px; width: 14px; height: 14px; color: #9e9e9e; }
    .score-bars { display: flex; flex-direction: column; gap: 4px; margin-bottom: 4px; }
    .score-bar-row { display: flex; align-items: center; gap: 6px; cursor: default; }
    .bar-label { font-size: 10px; color: #9e9e9e; width: 60px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar-track { flex: 1; height: 5px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
    .bar-value { font-size: 10px; color: #757575; width: 24px; text-align: right; flex-shrink: 0; }
    .invite-row { margin-top: 8px; }
    .invite-btn { font-size: 12px !important; height: 30px !important; line-height: 30px !important; }
    .btn-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 4px; }
    .btn-spinner { display: inline-block; margin-right: 6px; }
  `]
})
export class RecommendedVolunteersComponent implements OnChanges {
  initiativeId = input.required<string>();

  private initiativesService = inject(InitiativesService);
  private snackBar = inject(MatSnackBar);

  volunteers  = signal<VolunteerRecommendationDto[]>([]);
  loading     = signal(false);
  error       = signal<string | null>(null);
  invitedIds  = signal<Set<string>>(new Set());
  invitingId  = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initiativeId']) {
      // Reset invited state when switching initiatives
      this.invitedIds.set(new Set());
      this.invitingId.set(null);
      this.load();
    }
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.initiativesService.getRecommendedVolunteers(this.initiativeId(), 10).subscribe({
      next: data => { this.volunteers.set(data); this.loading.set(false); },
      error: () => { this.error.set('Не вдалося завантажити рекомендації'); this.loading.set(false); }
    });
  }

  invite(volunteerId: string) {
    if (this.invitedIds().has(volunteerId)) return;
    this.invitingId.set(volunteerId);
    this.initiativesService.inviteVolunteer(this.initiativeId(), volunteerId).subscribe({
      next: () => {
        this.invitingId.set(null);
        const updated = new Set(this.invitedIds());
        updated.add(volunteerId);
        this.invitedIds.set(updated);
        this.snackBar.open('Запрошення надіслано', 'OK', { duration: 3000 });
      },
      error: () => {
        this.invitingId.set(null);
        this.snackBar.open('Не вдалося надіслати запрошення', 'OK', { duration: 3000 });
      }
    });
  }

  scoreBars(v: VolunteerRecommendationDto): ScoreBar[] {
    return [
      { label: 'Категорія', value: v.categoryAffinityScore, color: '#1565c0', tooltip: `Спорідненість з категорією: ${v.categoryAffinityScore.toFixed(0)}/100` },
      { label: 'Виконання', value: v.completionRateScore,   color: '#2e7d32', tooltip: `Рівень виконання: ${v.completionRateScore.toFixed(0)}/100` },
      { label: 'Доступність', value: v.availabilityScore,   color: '#e65100', tooltip: `Доступність: ${v.availabilityScore.toFixed(0)}/100` },
      { label: 'Активність', value: v.activityScore,        color: '#6a1b9a', tooltip: `Загальна активність: ${v.activityScore.toFixed(0)}/100` }
    ];
  }

  initials(fullName: string): string {
    return fullName.split(' ').slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
  }

  avatarColor(fullName: string): string {
    const COLORS = ['#1565c0','#2e7d32','#c62828','#e65100','#6a1b9a','#00838f','#4e342e','#37474f'];
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) hash = (hash * 31 + fullName.charCodeAt(i)) & 0xffffffff;
    return COLORS[Math.abs(hash) % COLORS.length];
  }
}
