import {
  Component, OnInit, OnDestroy, signal, computed, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { NotificationsService } from '../../../core/services/notifications.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { NotificationDto, NotificationType } from '../../../shared/models/notification.model';

const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string }> = {
  NewInitiative: { icon: 'volunteer_activism', color: '#1565c0' },
  TaskAssigned: { icon: 'assignment_ind', color: '#6a1b9a' },
  TaskUpdated: { icon: 'task_alt', color: '#e65100' },
  ApplicationStatusChanged: { icon: 'how_to_reg', color: '#2e7d32' },
  Emergency: { icon: 'warning', color: '#c62828' },
  System: { icon: 'info', color: '#37474f' }
};

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatButtonModule, MatMenuModule,
    MatBadgeModule, MatTooltipModule, MatDividerModule, MatProgressSpinnerModule
  ],
  template: `
    <!-- Bell button -->
    <button
      mat-icon-button
      [matMenuTriggerFor]="notifMenu"
      (menuOpened)="onMenuOpen()"
      matTooltip="Сповіщення"
      class="bell-btn">
      <mat-icon
        [matBadge]="unreadCount() > 0 ? (unreadCount() > 99 ? '99+' : unreadCount().toString()) : null"
        matBadgeColor="warn"
        matBadgeSize="small"
        [matBadgeHidden]="unreadCount() === 0">
        notifications
      </mat-icon>
    </button>

    <!-- Dropdown panel -->
    <mat-menu #notifMenu="matMenu" class="notif-menu-panel" xPosition="before">
      <div class="notif-panel" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="notif-header">
          <span class="notif-title">Сповіщення</span>
          @if (unreadCount() > 0) {
            <button mat-button color="primary" class="mark-all-btn"
              (click)="markAllRead()">
              Позначити всі прочитаними
            </button>
          }
        </div>

        <mat-divider></mat-divider>

        <!-- Loading -->
        @if (loading()) {
          <div class="notif-loading">
            <mat-spinner diameter="32"></mat-spinner>
          </div>
        }

        <!-- Empty state -->
        @if (!loading() && notifications().length === 0) {
          <div class="notif-empty">
            <mat-icon>notifications_none</mat-icon>
            <p>Немає сповіщень</p>
          </div>
        }

        <!-- Notification list -->
        @if (!loading()) {
          <div class="notif-list">
            @for (n of notifications(); track n.id) {
              <div
                class="notif-item"
                [class.unread]="!n.isRead"
                [class.emergency]="n.type === 'Emergency'"
                (click)="onNotifClick(n)">
                <div class="notif-icon-wrap" [style.background]="typeConfig(n.type).color + '18'">
                  <mat-icon [style.color]="typeConfig(n.type).color">
                    {{ typeConfig(n.type).icon }}
                  </mat-icon>
                </div>
                <div class="notif-body">
                  <div class="notif-item-title">{{ n.title }}</div>
                  <div class="notif-item-msg">{{ n.message }}</div>
                  <div class="notif-time">{{ relativeTime(n.createdAt) }}</div>
                </div>
                @if (!n.isRead) {
                  <span class="unread-dot"></span>
                }
              </div>
            }

            @if (hasMore()) {
              <button mat-button class="load-more-btn" (click)="loadMore()">
                Завантажити ще
              </button>
            }
          </div>
        }
      </div>
    </mat-menu>
  `,
  styles: [`
    .bell-btn { color: white; }

    /* Panel sizing — mat-menu will size to content */
    .notif-panel {
      width: 280px;
      max-height: 480px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 8px;
      flex-shrink: 0;
    }
    .notif-title { font-size: 15px; font-weight: 600; color: #212121; }
    .mark-all-btn { font-size: 12px; min-width: 0; }

    .notif-loading, .notif-empty {
      display: flex; flex-direction: column; align-items: center;
      padding: 32px 16px; color: #bdbdbd; gap: 8px;
    }
    .notif-empty mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .notif-empty p { margin: 0; font-size: 13px; }

    .notif-list {
      overflow-y: auto;
      flex: 1;
    }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 16px;
      cursor: pointer;
      transition: background 0.15s;
      position: relative;
      border-bottom: 1px solid #f5f5f5;
    }
    .notif-item:hover { background: #f9f9f9; }
    .notif-item.unread { background: #f0f4ff; }
    .notif-item.unread:hover { background: #e8effe; }
    .notif-item.emergency { border-left: 3px solid #c62828; }

    .notif-icon-wrap {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-top: 2px;
    }
    .notif-icon-wrap mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .notif-body { flex: 1; min-width: 0; }
    .notif-item-title {
      font-size: 13px; font-weight: 600; color: #212121;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .notif-item-msg {
      font-size: 12px; color: #616161; margin-top: 2px;
      display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
    }
    .notif-time { font-size: 11px; color: #9e9e9e; margin-top: 4px; }

    .unread-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #1565c0; flex-shrink: 0; margin-top: 6px;
    }

    .load-more-btn {
      width: 100%; font-size: 12px; color: #1565c0;
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private notifService = inject(NotificationsService);
  private signalR = inject(SignalRService);
  private router = inject(Router);

  notifications = signal<NotificationDto[]>([]);
  unreadCount = signal(0);
  loading = signal(false);
  hasMore = signal(false);
  private page = 1;
  private subs = new Subscription();

  ngOnInit() {
    this.loadNotifications();

    this.subs.add(
      this.signalR.notificationReceived$.subscribe(data => {
        // Prepend new notification to list
        const newNotif: NotificationDto = {
          id: crypto.randomUUID(),
          type: data.type as NotificationType,
          title: data.title,
          message: data.message,
          isRead: false,
          relatedEntityId: data.relatedEntityId,
          relatedEntityType: data.relatedEntityType,
          createdAt: new Date().toISOString()
        };
        this.notifications.update(list => [newNotif, ...list]);
        this.unreadCount.update(c => c + 1);
      })
    );
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  loadNotifications(append = false) {
    this.loading.set(true);
    this.notifService.getMy(this.page).subscribe({
      next: result => {
        this.notifications.update(list =>
          append ? [...list, ...result.items] : result.items
        );
        this.unreadCount.set(result.unreadCount);
        this.hasMore.set(result.hasMore);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onMenuOpen() {
    // Reload when panel opens to get latest
    this.page = 1;
    this.loadNotifications();
  }

  onNotifClick(n: NotificationDto) {
    if (!n.isRead) {
      this.notifService.markRead(n.id).subscribe();
      this.notifications.update(list =>
        list.map(item => item.id === n.id ? { ...item, isRead: true } : item)
      );
      this.unreadCount.update(c => Math.max(0, c - 1));
    }

    // Navigate to related entity
    if (n.relatedEntityId && n.relatedEntityType) {
      if (n.relatedEntityType === 'Initiative') {
        this.router.navigate(['/initiatives', n.relatedEntityId]);
      } else if (n.relatedEntityType === 'Task') {
        this.router.navigate(['/tasks/my']);
      }
    }
  }

  markAllRead() {
    this.notifService.markAllRead().subscribe();
    this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
    this.unreadCount.set(0);
  }

  loadMore() {
    this.page++;
    this.loadNotifications(true);
  }

  typeConfig(type: string) {
    return TYPE_CONFIG[type as NotificationType] ?? TYPE_CONFIG['System'];
  }

  relativeTime(isoDate: string): string {
    // Ensure the date string is parsed as UTC (ASP.NET may omit the Z suffix)
    const utcIso = isoDate.endsWith('Z') || isoDate.includes('+') ? isoDate : isoDate + 'Z';
    const diff = Date.now() - new Date(utcIso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'щойно';
    if (mins < 60) return `${mins} хв тому`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} год тому`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} д тому`;
    return new Date(isoDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  }
}
