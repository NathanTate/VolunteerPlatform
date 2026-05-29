import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApplicationsService } from '../../../core/services/applications.service';
import { ApplicationDto } from '../../../shared/models/application.model';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule,
    MatChipsModule, MatDividerModule, MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <mat-icon class="header-icon">assignment</mat-icon>
        <div>
          <h1>Мої заявки</h1>
          <p class="subtitle">Тут відображаються всі ваші заявки на участь в ініціативах</p>
        </div>
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (applications().length === 0) {
        <div class="empty-state">
          <mat-icon>inbox</mat-icon>
          <p>Ви ще не подавали заявок</p>
          <button mat-raised-button color="primary" routerLink="/">Переглянути ініціативи</button>
        </div>
      } @else {
        <div class="apps-grid">
          @for (app of applications(); track app.id) {
            <mat-card class="app-card" [class]="'status-' + app.status.toLowerCase()">
              <mat-card-content>
                <div class="card-top">
                  <div class="initiative-name">{{ app.initiativeTitle }}</div>
                  <span class="status-chip" [class]="'chip-' + app.status.toLowerCase()">
                    <mat-icon class="chip-icon">{{ statusIcon(app.status) }}</mat-icon>
                    {{ statusLabel(app.status) }}
                  </span>
                </div>

                @if (app.comment) {
                  <div class="comment">
                    <mat-icon>comment</mat-icon>
                    <span>{{ app.comment }}</span>
                  </div>
                }

                <div class="meta">
                  <mat-icon>schedule</mat-icon>
                  <span>Подано: {{ formatDate(app.submittedAt) }}</span>
                </div>

                @if (app.status === 'Pending') {
                  <div class="status-note pending-note">
                    <mat-icon>hourglass_empty</mat-icon>
                    Очікуйте — координатор розгляне вашу заявку найближчим часом
                  </div>
                }
                @if (app.status === 'Approved') {
                  <div class="status-note approved-note">
                    <mat-icon>check_circle</mat-icon>
                    Вітаємо! Вашу участь підтверджено
                  </div>
                }
                @if (app.status === 'Rejected') {
                  <div class="status-note rejected-note">
                    <mat-icon>cancel</mat-icon>
                    Заявку відхилено. Ви можете спробувати подати знову
                  </div>
                }
              </mat-card-content>
              <mat-card-actions>
                <button mat-button [routerLink]="['/initiatives', app.initiativeId]">
                  <mat-icon>open_in_new</mat-icon> Переглянути ініціативу
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-wrap { max-width: 800px; margin: 32px auto; padding: 0 16px; }
    .page-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 28px; }
    .header-icon { font-size: 40px; width: 40px; height: 40px; color: #1565c0; margin-top: 4px; }
    h1 { margin: 0 0 4px; font-size: 24px; font-weight: 600; }
    .subtitle { margin: 0; color: #757575; font-size: 14px; }
    .center { display: flex; justify-content: center; padding: 60px 0; }
    .empty-state { text-align: center; padding: 60px 0; color: #9e9e9e; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; margin-bottom: 12px; }
    .empty-state p { font-size: 16px; margin-bottom: 20px; }
    .apps-grid { display: flex; flex-direction: column; gap: 16px; }
    .app-card { border-left: 4px solid #e0e0e0; transition: box-shadow 0.2s; }
    .app-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
    .app-card.status-pending  { border-left-color: #f9a825; }
    .app-card.status-approved { border-left-color: #43a047; }
    .app-card.status-rejected { border-left-color: #e53935; }
    .card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
    .initiative-name { font-size: 16px; font-weight: 600; color: #212121; flex: 1; }
    .status-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; }
    .chip-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }
    .chip-pending  { background: #fff8e1; color: #f57f17; }
    .chip-approved { background: #e8f5e9; color: #2e7d32; }
    .chip-rejected { background: #ffebee; color: #c62828; }
    .comment { display: flex; align-items: flex-start; gap: 6px; color: #616161; font-size: 13px; margin-bottom: 8px; font-style: italic; }
    .comment mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
    .meta { display: flex; align-items: center; gap: 6px; color: #9e9e9e; font-size: 12px; margin-top: 4px; }
    .meta mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .status-note { display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 8px 10px; border-radius: 6px; margin-top: 10px; }
    .status-note mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
    .pending-note  { background: #fff8e1; color: #f57f17; }
    .approved-note { background: #e8f5e9; color: #2e7d32; }
    .rejected-note { background: #ffebee; color: #c62828; }
  `]
})
export class MyApplicationsComponent implements OnInit {
  applications = signal<ApplicationDto[]>([]);
  loading = signal(true);

  constructor(private appService: ApplicationsService) {}

  ngOnInit() {
    this.appService.getMine().subscribe({
      next: apps => {
        this.applications.set(apps.sort((a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        ));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  statusLabel(status: string): string {
    const m: Record<string, string> = { Pending: 'Очікує розгляду', Approved: 'Підтверджено', Rejected: 'Відхилено' };
    return m[status] ?? status;
  }

  statusIcon(status: string): string {
    const m: Record<string, string> = { Pending: 'hourglass_empty', Approved: 'check_circle', Rejected: 'cancel' };
    return m[status] ?? 'help';
  }

  formatDate(iso: string): string {
    const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  }
}
