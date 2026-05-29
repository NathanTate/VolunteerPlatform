import {
  Component, OnInit, OnDestroy, signal, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subscription, interval } from 'rxjs';
import { take } from 'rxjs/operators';
import { SignalRService } from '../../../core/services/signalr.service';
import { AuthService } from '../../../core/services/auth.service';

const AUTO_DISMISS_SECS = 30;

interface AlertItem {
  id: string;
  title: string;
  message: string;
  initiativeId: string;
  /** seconds remaining before auto-dismiss */
  secondsLeft: number;
  /** 0-100, drives the progress bar */
  progress: number;
}

@Component({
  selector: 'app-emergency-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="banners-host" aria-live="assertive" aria-atomic="false">
      @for (alert of alerts(); track alert.id) {
        <div class="banner" role="alert">

          <!-- Pulse icon -->
          <div class="pulse-wrap">
            <span class="pulse-ring"></span>
            <mat-icon class="siren-icon">warning</mat-icon>
          </div>

          <!-- Text -->
          <div class="banner-body">
            <div class="banner-title">{{ alert.title }}</div>
            <div class="banner-msg">{{ alert.message }}</div>
          </div>

          <!-- Actions -->
          <div class="banner-actions">
            @if (alert.initiativeId) {
              <button mat-stroked-button class="view-btn"
                (click)="navigate(alert)">
                <mat-icon>open_in_new</mat-icon>
                Переглянути
              </button>
            }
            <button mat-icon-button class="dismiss-btn"
              (click)="dismiss(alert.id)"
              [attr.aria-label]="'Закрити: ' + alert.title">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Countdown progress bar -->
          <div class="countdown-bar">
            <div class="countdown-fill"
              [style.width.%]="alert.progress"
              [class.urgent]="alert.secondsLeft <= 10">
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Host renders at top of the page, above everything */
    .banners-host {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10000;
      pointer-events: none;    /* let clicks fall through when empty */
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* Individual banner */
    .banner {
      pointer-events: all;
      position: relative;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px 20px;   /* extra bottom for countdown bar */
      background: #b71c1c;
      color: white;
      box-shadow: 0 4px 20px rgba(0,0,0,0.45);
      animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes slideDown {
      from { transform: translateY(-100%); opacity: 0; }
      to   { transform: translateY(0);     opacity: 1; }
    }

    /* Pulsing ring around the icon */
    .pulse-wrap {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 44px;
      height: 44px;
    }

    .pulse-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: rgba(255,255,255,0.25);
      animation: pulse-ring 1.4s ease-in-out infinite;
    }

    @keyframes pulse-ring {
      0%   { transform: scale(0.85); opacity: 0.9; }
      50%  { transform: scale(1.15); opacity: 0.4; }
      100% { transform: scale(0.85); opacity: 0.9; }
    }

    .siren-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #ffeb3b;
      position: relative;
      z-index: 1;
      animation: siren-flash 0.8s ease-in-out infinite alternate;
    }

    @keyframes siren-flash {
      from { color: #ffeb3b; }
      to   { color: #fff176; }
    }

    /* Text */
    .banner-body { flex: 1; min-width: 0; }
    .banner-title {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.02em;
      margin-bottom: 3px;
    }
    .banner-msg {
      font-size: 13px;
      opacity: 0.92;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    /* Actions */
    .banner-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .view-btn {
      color: white !important;
      border-color: rgba(255,255,255,0.6) !important;
      font-size: 12px;
    }
    .view-btn mat-icon { font-size: 15px; width: 15px; height: 15px; }

    .dismiss-btn { color: rgba(255,255,255,0.8); }

    /* Countdown bar — absolute at bottom of banner */
    .countdown-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: rgba(0,0,0,0.2);
    }
    .countdown-fill {
      height: 100%;
      background: rgba(255,255,255,0.7);
      transition: width 1s linear;
      border-radius: 0 2px 2px 0;
    }
    .countdown-fill.urgent {
      background: #ffeb3b;
    }
  `]
})
export class EmergencyBannerComponent implements OnInit, OnDestroy {
  private signalR = inject(SignalRService);
  private auth    = inject(AuthService);
  private router  = inject(Router);

  alerts = signal<AlertItem[]>([]);

  private subs = new Subscription();
  /** map alertId → ticker subscription */
  private tickers = new Map<string, Subscription>();

  ngOnInit() {
    this.subs.add(
      this.signalR.emergencyAlert$.subscribe(data => {
        if (!this.auth.isLoggedIn()) return;   // only logged-in users see the banner
        this.push(data.title, data.message, data.initiativeId);
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.tickers.forEach(s => s.unsubscribe());
  }

  private push(title: string, message: string, initiativeId: string) {
    const id: string = crypto.randomUUID();
    const item: AlertItem = {
      id, title, message, initiativeId,
      secondsLeft: AUTO_DISMISS_SECS,
      progress: 100
    };

    this.alerts.update(list => [item, ...list]);

    // Tick every second, auto-dismiss when countdown hits 0
    const ticker = interval(1000).pipe(take(AUTO_DISMISS_SECS)).subscribe({
      next: elapsed => {
        const left = AUTO_DISMISS_SECS - elapsed - 1;
        this.alerts.update(list =>
          list.map(a => a.id === id
            ? { ...a, secondsLeft: left, progress: (left / AUTO_DISMISS_SECS) * 100 }
            : a
          )
        );
      },
      complete: () => this.dismiss(id)
    });

    this.tickers.set(id, ticker);
  }

  dismiss(id: string) {
    this.tickers.get(id)?.unsubscribe();
    this.tickers.delete(id);
    this.alerts.update(list => list.filter(a => a.id !== id));
  }

  navigate(alert: AlertItem) {
    this.dismiss(alert.id);
    if (alert.initiativeId) {
      this.router.navigate(['/initiatives', alert.initiativeId]);
    }
  }
}
