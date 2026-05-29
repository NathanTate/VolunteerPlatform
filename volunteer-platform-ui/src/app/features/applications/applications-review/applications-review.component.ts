import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApplicationsService } from '../../../core/services/applications.service';
import { ApplicationDto } from '../../../shared/models/application.model';

@Component({
  selector: 'app-applications-review',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule, MatSelectModule,
    MatFormFieldModule, MatInputModule, MatDividerModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule
  ],
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <mat-icon class="header-icon">rate_review</mat-icon>
        <div>
          <h1>Review Applications</h1>
          <p class="subtitle">{{ pending().length }} pending &bull; {{ applications().length }} total</p>
        </div>
        <button mat-stroked-button (click)="load()" [disabled]="loading()" class="refresh-btn">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search applicant or initiative</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="searchText" placeholder="Type to filter..." />
        </mat-form-field>
        <mat-form-field appearance="outline" class="status-field">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter">
            <mat-option value="">All</mat-option>
            <mat-option value="Pending">Pending</mat-option>
            <mat-option value="Approved">Approved</mat-option>
            <mat-option value="Rejected">Rejected</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <mat-icon>inbox</mat-icon>
          <p>No applications match the current filter</p>
        </div>
      } @else {
        <div class="apps-list">
          @for (app of filtered(); track app.id) {
            <div class="app-row" [class]="'row-' + app.status.toLowerCase()">
              <div class="app-main">
                <div class="app-person">
                  <div class="avatar">{{ initials(app.userName) }}</div>
                  <div>
                    <div class="app-name">{{ app.userName }}</div>
                    <div class="app-initiative">{{ app.initiativeTitle }}</div>
                  </div>
                </div>
                @if (app.comment) {
                  <div class="app-comment">"{{ app.comment }}"</div>
                }
                <div class="app-meta">
                  <mat-icon>schedule</mat-icon>
                  {{ formatDate(app.submittedAt) }}
                </div>
              </div>

              <div class="app-right">
                <span class="status-badge" [class]="'badge-' + app.status.toLowerCase()">
                  <mat-icon class="badge-icon">{{ statusIcon(app.status) }}</mat-icon>
                  {{ statusLabel(app.status) }}
                </span>

                @if (app.status === 'Pending') {
                  <div class="action-btns">
                    <button mat-raised-button color="primary"
                      [matTooltip]="'Approve this application'"
                      (click)="approve(app)">
                      <mat-icon>check</mat-icon> Approve
                    </button>
                    <button mat-stroked-button color="warn"
                      [matTooltip]="'Reject this application'"
                      (click)="reject(app)">
                      <mat-icon>close</mat-icon> Reject
                    </button>
                  </div>
                }
                <button mat-icon-button [routerLink]="['/initiatives', app.initiativeId]"
                  matTooltip="View initiative">
                  <mat-icon>open_in_new</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-wrap { max-width: 900px; margin: 32px auto; padding: 0 16px; }
    .page-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
    .header-icon { font-size: 40px; width: 40px; height: 40px; color: #6a1b9a; margin-top: 4px; }
    h1 { margin: 0 0 2px; font-size: 24px; font-weight: 600; }
    .subtitle { margin: 0; color: #757575; font-size: 14px; }
    .refresh-btn { margin-left: auto; align-self: center; }
    .filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 220px; }
    .status-field { width: 160px; }
    .center { display: flex; justify-content: center; padding: 60px 0; }
    .empty-state { text-align: center; padding: 60px 0; color: #9e9e9e; }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; display: block; margin: 0 auto 12px; }

    .apps-list { display: flex; flex-direction: column; gap: 12px; }
    .app-row {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 16px; padding: 16px; border-radius: 10px;
      background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      border-left: 4px solid #e0e0e0;
    }
    .row-pending  { border-left-color: #f9a825; }
    .row-approved { border-left-color: #43a047; }
    .row-rejected { border-left-color: #e53935; }

    .app-main { flex: 1; min-width: 0; }
    .app-person { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .avatar {
      width: 40px; height: 40px; border-radius: 50%; background: #e3f2fd;
      color: #1565c0; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; flex-shrink: 0;
    }
    .app-name { font-weight: 600; font-size: 15px; }
    .app-initiative { font-size: 12px; color: #1565c0; margin-top: 1px; }
    .app-comment { font-style: italic; color: #616161; font-size: 13px; margin: 4px 0 6px 52px; }
    .app-meta { display: flex; align-items: center; gap: 4px; color: #9e9e9e; font-size: 12px; margin-left: 52px; }
    .app-meta mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .app-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
    .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }
    .badge-pending  { background: #fff8e1; color: #f57f17; }
    .badge-approved { background: #e8f5e9; color: #2e7d32; }
    .badge-rejected { background: #ffebee; color: #c62828; }
    .action-btns { display: flex; gap: 8px; }
    .action-btns button { height: 34px; font-size: 13px; }
  `]
})
export class ApplicationsReviewComponent implements OnInit {
  applications = signal<ApplicationDto[]>([]);
  loading = signal(true);
  searchText = '';
  statusFilter = 'Pending';

  pending = computed(() => this.applications().filter(a => a.status === 'Pending'));

  filtered = computed(() => {
    const q = this.searchText.toLowerCase();
    return this.applications().filter(a => {
      const matchesStatus = !this.statusFilter || a.status === this.statusFilter;
      const matchesSearch = !q ||
        a.userName.toLowerCase().includes(q) ||
        a.initiativeTitle.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  });

  constructor(
    private appService: ApplicationsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.appService.getAll().subscribe({
      next: apps => { this.applications.set(apps); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  approve(app: ApplicationDto) {
    this.appService.approve(app.id).subscribe({
      next: () => {
        this.applications.update(list =>
          list.map(a => a.id === app.id ? { ...a, status: 'Approved' as any } : a)
        );
        this.snackBar.open('Application approved', 'OK', { duration: 2500, panelClass: 'success-snack' });
      },
      error: () => this.snackBar.open('Error approving', 'OK', { duration: 2500 })
    });
  }

  reject(app: ApplicationDto) {
    this.appService.reject(app.id).subscribe({
      next: () => {
        this.applications.update(list =>
          list.map(a => a.id === app.id ? { ...a, status: 'Rejected' as any } : a)
        );
        this.snackBar.open('Application rejected', 'OK', { duration: 2500 });
      },
      error: () => this.snackBar.open('Error rejecting', 'OK', { duration: 2500 })
    });
  }

  statusLabel(status: string): string {
    return { Pending: 'Pending', Approved: 'Approved', Rejected: 'Rejected' }[status] ?? status;
  }

  statusIcon(status: string): string {
    return { Pending: 'hourglass_empty', Approved: 'check_circle', Rejected: 'cancel' }[status] ?? 'help';
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(iso: string): string {
    const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  }
}
