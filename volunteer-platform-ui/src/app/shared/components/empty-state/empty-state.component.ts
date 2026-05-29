import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
  template: `
    <div class="empty-state">
      <div class="icon-wrap">
        <mat-icon class="empty-icon">{{ icon() }}</mat-icon>
      </div>
      <h3 class="empty-title">{{ title() }}</h3>
      @if (subtitle()) {
        <p class="empty-subtitle">{{ subtitle() }}</p>
      }
      @if (actionLabel() && actionRoute()) {
        <a mat-raised-button color="primary" [routerLink]="actionRoute()" class="action-btn">
          <mat-icon>{{ actionIcon() }}</mat-icon>
          {{ actionLabel() }}
        </a>
      }
      @if (actionLabel() && !actionRoute()) {
        <ng-content></ng-content>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      animation: fadeInUp 0.35s ease both;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .icon-wrap {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #f0f4ff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;
    }

    .empty-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #1565c0;
      opacity: 0.65;
    }

    .empty-title {
      font-size: 16px;
      font-weight: 600;
      color: #424242;
      margin-bottom: 8px;
    }

    .empty-subtitle {
      font-size: 13px;
      color: #757575;
      max-width: 340px;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .action-btn {
      margin-top: 4px;
    }
  `]
})
export class EmptyStateComponent {
  icon        = input<string>('inbox');
  title       = input<string>('Нічого не знайдено');
  subtitle    = input<string | null>(null);
  actionLabel = input<string | null>(null);
  actionRoute = input<string | null>(null);
  actionIcon  = input<string>('add');
}
