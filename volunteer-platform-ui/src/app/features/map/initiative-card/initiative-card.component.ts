import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { InitiativeDto } from '../../../shared/models/initiative.model';

const CATEGORY_COLORS: Record<string, string> = {
  Environmental: '#1D9E75',
  Social: '#378ADD',
  Medical: '#E24B4A',
  Educational: '#EF9F27',
  Other: '#888780'
};

const CATEGORY_LABELS: Record<string, string> = {
  Environmental: '🌿 Екологічна',
  Social: '🤝 Соціальна',
  Medical: '🏥 Медична',
  Educational: '📚 Освітня',
  Other: '🔧 Інша'
};

const URGENCY_COLORS: Record<string, string> = {
  Low: '#4caf50',
  Medium: '#ff9800',
  High: '#f44336',
  Critical: '#9c27b0'
};

const URGENCY_LABELS: Record<string, string> = {
  Low: '🟢 Низька',
  Medium: '🟡 Середня',
  High: '🟠 Висока',
  Critical: '🔴 Критична'
};

@Component({
  selector: 'app-initiative-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatIconModule, MatTooltipModule, MatProgressBarModule],
  template: `
    <mat-card
      class="initiative-card"
      [class.highlighted]="highlighted()"
      [class.emergency]="initiative().isEmergency"
      (mouseenter)="hover.emit(initiative().id)"
      (mouseleave)="hover.emit(null)"
      (click)="select.emit(initiative())">

      <!-- Cover thumbnail -->
      @if (coverImageUrl()) {
        <div class="card-image">
          <img [src]="coverImageUrl()!" [alt]="initiative().title" />
          @if (initiative().isEmergency) {
            <span class="emergency-overlay-badge">🚨 ЕКСТРЕНА</span>
          }
        </div>
      }

      <mat-card-content>
        <!-- Category + Status + Emergency row -->
        <div class="card-header">
          <span class="category-badge" [style.background]="categoryColor()">
            {{ categoryLabel() }}
          </span>
          <div class="header-right">
            @if (urgencyLevel()) {
              <span
                class="urgency-dot"
                [style.background]="urgencyColor()"
                [matTooltip]="'Терміновість: ' + urgencyLabelText()">
              </span>
            }
            <span class="status-label">{{ statusLabel() }}</span>
          </div>
        </div>

        <!-- Title -->
        <h3 class="card-title">
          @if (initiative().isEmergency && !coverImageUrl()) {
            <span class="emergency-inline-badge">🚨</span>
          }
          {{ initiative().title }}
        </h3>

        <!-- Address -->
        <p class="card-address">
          <mat-icon inline>place</mat-icon> {{ initiative().address }}
        </p>

        <!-- Meta row -->
        <div class="card-meta">
          <span>
            <mat-icon inline>event</mat-icon>
            {{ initiative().startDate | date:'dd.MM.yyyy' }}
          </span>
          @if (initiative().distanceKm != null) {
            <span>
              <mat-icon inline>near_me</mat-icon>
              {{ initiative().distanceKm | number:'1.1-1' }} км
            </span>
          }
          <span>
            <mat-icon inline>people</mat-icon>
            {{ initiative().currentParticipants }}/{{ initiative().maxParticipants }}
          </span>
        </div>

        <!-- Task progress (if tasks exist) -->
        @if (initiative().tasksTotal != null && initiative().tasksTotal! > 0) {
          <div class="task-progress">
            <div class="task-progress-label">
              <mat-icon class="task-icon">task_alt</mat-icon>
              <span>Завдання: {{ initiative().tasksCompleted }}/{{ initiative().tasksTotal }}</span>
            </div>
            <mat-progress-bar
              mode="determinate"
              [value]="taskProgressPercent()"
              color="primary"
              class="task-bar">
            </mat-progress-bar>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .initiative-card {
      cursor: pointer;
      margin-bottom: 8px;
      transition: box-shadow 0.2s, transform 0.1s;
      border-radius: 8px;
      overflow: hidden;
      padding: 0;
    }
    .initiative-card:hover, .initiative-card.highlighted {
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      transform: translateY(-1px);
    }
    .initiative-card.emergency {
      border-left: 3px solid #e53935;
    }

    /* Cover image */
    .card-image {
      width: 100%; height: 100px; overflow: hidden; position: relative;
    }
    .card-image img { width: 100%; height: 100%; object-fit: cover; }
    .emergency-overlay-badge {
      position: absolute; top: 6px; right: 6px;
      background: rgba(198, 40, 40, 0.9); color: white;
      padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700;
    }

    /* Card content */
    mat-card-content { padding: 10px 12px 12px !important; }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .category-badge {
      padding: 2px 8px;
      border-radius: 10px;
      color: white;
      font-size: 11px;
      font-weight: 500;
    }
    .header-right {
      display: flex; align-items: center; gap: 6px;
    }
    .urgency-dot {
      width: 10px; height: 10px; border-radius: 50%;
      display: inline-block; flex-shrink: 0; cursor: default;
    }
    .status-label { font-size: 11px; color: #666; }

    .card-title {
      font-size: 14px;
      font-weight: 500;
      margin: 0 0 4px;
      line-height: 1.35;
      color: #212121;
    }
    .emergency-inline-badge { margin-right: 3px; }

    .card-address {
      font-size: 12px;
      color: #555;
      margin: 0 0 6px;
      display: flex;
      align-items: center;
      gap: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card-meta {
      display: flex;
      gap: 10px;
      font-size: 11px;
      color: #777;
      align-items: center;
      flex-wrap: wrap;
    }
    .card-meta span { display: flex; align-items: center; gap: 2px; }

    /* Task progress */
    .task-progress { margin-top: 8px; }
    .task-progress-label {
      display: flex; align-items: center; gap: 4px;
      font-size: 11px; color: #757575; margin-bottom: 3px;
    }
    .task-icon { font-size: 13px; width: 13px; height: 13px; }
    .task-bar { height: 4px !important; border-radius: 2px; }
  `]
})
export class InitiativeCardComponent {
  initiative = input.required<InitiativeDto>();
  highlighted = input<boolean>(false);
  hover = output<string | null>();
  select = output<InitiativeDto>();

  coverImageUrl = computed(() => this.initiative().imageUrls?.[0] ?? null);

  taskProgressPercent = computed(() => {
    const total = this.initiative().tasksTotal;
    const done = this.initiative().tasksCompleted;
    if (!total || total === 0) return 0;
    return Math.round((done! / total) * 100);
  });

  urgencyLevel = computed(() => this.initiative().urgencyLevel ?? null);
  urgencyColor() { return URGENCY_COLORS[this.initiative().urgencyLevel ?? ''] ?? '#9e9e9e'; }
  urgencyLabelText() { return URGENCY_LABELS[this.initiative().urgencyLevel ?? ''] ?? ''; }
  categoryColor() { return CATEGORY_COLORS[this.initiative().category] ?? '#888780'; }
  categoryLabel() { return CATEGORY_LABELS[this.initiative().category] ?? this.initiative().category; }

  statusLabel() {
    const map: Record<string, string> = {
      Active: 'Активна', Planned: 'Запланована',
      Completed: 'Завершена', Archived: 'Архівована', Cancelled: 'Скасована'
    };
    return map[this.initiative().status] ?? this.initiative().status;
  }
}
