import {
  Component, OnInit, Inject, signal, computed, inject
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TasksService } from '../../../core/services/tasks.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  TaskDto, TaskStatus,
  TASK_STATUS_LABELS, TASK_STATUS_COLORS, TASK_PRIORITY_COLORS
} from '../../../shared/models/task.model';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatDividerModule, MatProgressSpinnerModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSnackBarModule, MatTabsModule, MatTooltipModule,
    DatePipe
  ],
  template: `
    <div class="task-dialog">
      <!-- Header -->
      <div class="dialog-header">
        @if (task()) {
          <div class="header-left">
            <div class="priority-dot" [style.background]="getPriorityColor(task()!.priority)"></div>
            <h2 class="task-title">{{ task()!.title }}</h2>
          </div>
          <div class="header-right">
            <span class="status-badge" [style.background]="getStatusColor(task()!.status)">
              {{ getStatusLabel(task()!.status) }}
            </span>
            <button mat-icon-button (click)="close()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        } @else {
          <h2>Завдання</h2>
          <button mat-icon-button (click)="close()"><mat-icon>close</mat-icon></button>
        }
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (task()) {
        <mat-tab-group animationDuration="200ms" class="task-tabs">

          <!-- ── Details tab ─────────────────────────────── -->
          <mat-tab label="Деталі">
            <div class="tab-content">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Ініціатива</span>
                  <span class="info-value">{{ task()!.initiativeTitle }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Виконавець</span>
                  <span class="info-value">{{ task()!.assignedVolunteerName ?? '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Пріоритет</span>
                  <span class="info-value priority-text"
                    [style.color]="getPriorityColor(task()!.priority)">
                    {{ task()!.priority }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Дедлайн</span>
                  <span class="info-value" [class.overdue-text]="task()!.isOverdue">
                    {{ task()!.deadline ? (task()!.deadline! | date:'dd.MM.yyyy HH:mm') : '—' }}
                    @if (task()!.isOverdue) { <span class="overdue-tag">Прострочено</span> }
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Створив</span>
                  <span class="info-value">{{ task()!.createdByName }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Оновлено</span>
                  <span class="info-value">{{ task()!.updatedAt | date:'dd.MM.yyyy HH:mm' }}</span>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="description-section">
                <h4>Опис завдання</h4>
                <p class="description-text">{{ task()!.description }}</p>
              </div>

              @if (task()!.completionProofUrl) {
                <div class="proof-section">
                  <h4>Доказ виконання</h4>
                  <a [href]="task()!.completionProofUrl" target="_blank" class="proof-link">
                    <mat-icon>attach_file</mat-icon>
                    Переглянути доказ
                  </a>
                </div>
              }

              @if (task()!.verificationNote) {
                <div class="note-section">
                  <h4>Примітка координатора</h4>
                  <p class="note-text">{{ task()!.verificationNote }}</p>
                </div>
              }

              <!-- Status transition actions -->
              <mat-divider></mat-divider>
              @if (canManage()) {
                <div class="actions-section">
                  <h4>Змінити статус</h4>
                  <div class="status-actions">
                    @for (transition of availableTransitions(); track transition.status) {
                      <button
                        mat-stroked-button
                        [style.border-color]="transition.color"
                        [style.color]="transition.color"
                        (click)="updateStatus(transition.status)">
                        {{ transition.label }}
                      </button>
                    }
                  </div>
                  @if (availableTransitions().length === 0) {
                    <p class="no-transitions">Немає доступних переходів для цього статусу.</p>
                  }
                </div>
              } @else {
                <div class="read-only-notice">
                  <mat-icon>visibility</mat-icon>
                  <span>Переглядати завдання може будь-хто — змінювати статус може лише організатор ініціативи.</span>
                </div>
              }
            </div>
          </mat-tab>

          <!-- ── Comments tab ────────────────────────────── -->
          <mat-tab [label]="'Коментарі (' + task()!.comments.length + ')'">
            <div class="tab-content">
              <div class="comments-list">
                @for (comment of task()!.comments; track comment.id) {
                  <div class="comment-item">
                    <div class="comment-avatar">
                      {{ comment.authorName.charAt(0).toUpperCase() }}
                    </div>
                    <div class="comment-body">
                      <div class="comment-header">
                        <span class="comment-author">{{ comment.authorName }}</span>
                        <span class="comment-time">{{ comment.createdAt | date:'dd.MM HH:mm' }}</span>
                      </div>
                      <p class="comment-text">{{ comment.text }}</p>
                    </div>
                  </div>
                }
                @if (task()!.comments.length === 0) {
                  <p class="empty-text">Немає коментарів.</p>
                }
              </div>

              <div class="comment-form">
                <mat-form-field appearance="outline" class="comment-input">
                  <mat-label>Додати коментар</mat-label>
                  <textarea matInput [(ngModel)]="newComment" rows="2"
                    placeholder="Напишіть коментар..."></textarea>
                </mat-form-field>
                <button mat-raised-button color="primary"
                  [disabled]="!newComment.trim() || submittingComment()"
                  (click)="submitComment()">
                  @if (submittingComment()) { <mat-spinner diameter="20"></mat-spinner> }
                  @else { Надіслати }
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- ── History tab ─────────────────────────────── -->
          <mat-tab [label]="'Історія (' + task()!.history.length + ')'">
            <div class="tab-content">
              @for (entry of task()!.history; track entry.id) {
                <div class="history-item">
                  <div class="history-icon">
                    <mat-icon>history</mat-icon>
                  </div>
                  <div class="history-body">
                    <span class="history-user">{{ entry.changedByName }}</span>
                    змінив статус:
                    <span class="status-from">{{ getStatusLabel(entry.fromStatus) }}</span>
                    →
                    <span class="status-to" [style.color]="getStatusColor(entry.toStatus)">
                      {{ getStatusLabel(entry.toStatus) }}
                    </span>
                    @if (entry.note) {
                      <p class="history-note">{{ entry.note }}</p>
                    }
                    <span class="history-time">{{ entry.changedAt | date:'dd.MM.yyyy HH:mm' }}</span>
                  </div>
                </div>
              }
              @if (task()!.history.length === 0) {
                <p class="empty-text">Немає записів в історії.</p>
              }
            </div>
          </mat-tab>

          <!-- ── Attachments tab ─────────────────────────── -->
          <mat-tab [label]="'Вкладення (' + task()!.attachments.length + ')'">
            <div class="tab-content">
              @for (att of task()!.attachments; track att.id) {
                <div class="attachment-item">
                  <mat-icon class="att-icon">{{ getFileIcon(att.contentType) }}</mat-icon>
                  <div class="att-info">
                    <a [href]="att.url" target="_blank" class="att-name">{{ att.fileName }}</a>
                    <span class="att-meta">
                      {{ formatBytes(att.fileSizeBytes) }} · {{ att.uploadedByName }}
                    </span>
                  </div>
                </div>
              }
              @if (task()!.attachments.length === 0) {
                <p class="empty-text">Немає вкладень.</p>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      } @else {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <p>Завдання не знайдено.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .task-dialog { display: flex; flex-direction: column; min-height: 480px; }
    .dialog-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; border-bottom: 1px solid #e0e0e0;
    }
    .header-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
    .header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .priority-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .task-title { margin: 0; font-size: 1rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .status-badge {
      color: white; padding: 4px 12px; border-radius: 12px;
      font-size: 0.75rem; font-weight: 500;
    }
    .loading-center { display: flex; justify-content: center; align-items: center; padding: 48px; }
    .task-tabs { flex: 1; }
    .tab-content { padding: 16px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .info-item { display: flex; flex-direction: column; gap: 2px; }
    .info-label { font-size: 0.72rem; color: #9e9e9e; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 0.875rem; color: #212121; }
    .priority-text { font-weight: 600; }
    .overdue-text { color: #e53935; }
    .overdue-tag { background: #ffebee; color: #e53935; padding: 1px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 4px; }
    .description-section, .proof-section, .note-section { margin: 16px 0; }
    .description-section h4, .proof-section h4, .note-section h4, .actions-section h4 {
      margin: 0 0 8px; font-size: 0.85rem; font-weight: 600; color: #616161;
    }
    .description-text, .note-text {
      margin: 0; font-size: 0.875rem; color: #424242; line-height: 1.6;
    }
    .proof-link { display: flex; align-items: center; gap: 6px; color: #1565c0; text-decoration: none; }
    .proof-link:hover { text-decoration: underline; }
    .actions-section { margin-top: 16px; }
    .status-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .no-transitions { font-size: 0.8rem; color: #9e9e9e; margin: 0; }
    .read-only-notice {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 0; font-size: 12px; color: #78909c;
    }
    .read-only-notice mat-icon { font-size: 16px; width: 16px; height: 16px; }
    /* Comments */
    .comments-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; max-height: 300px; overflow-y: auto; }
    .comment-item { display: flex; gap: 10px; }
    .comment-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: #1565c0; color: white;
      display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem; flex-shrink: 0;
    }
    .comment-body { flex: 1; }
    .comment-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .comment-author { font-weight: 600; font-size: 0.85rem; }
    .comment-time { font-size: 0.72rem; color: #9e9e9e; }
    .comment-text { margin: 0; font-size: 0.85rem; color: #424242; }
    .comment-form { display: flex; flex-direction: column; gap: 8px; }
    .comment-input { width: 100%; }
    /* History */
    .history-item { display: flex; gap: 10px; margin-bottom: 12px; font-size: 0.85rem; }
    .history-icon { color: #9e9e9e; }
    .history-body { flex: 1; color: #424242; line-height: 1.6; }
    .history-user { font-weight: 600; }
    .status-from { color: #9e9e9e; }
    .status-to { font-weight: 600; }
    .history-note { margin: 2px 0 0; font-style: italic; color: #757575; }
    .history-time { font-size: 0.72rem; color: #9e9e9e; display: block; margin-top: 2px; }
    /* Attachments */
    .attachment-item { display: flex; align-items: center; gap: 12px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 8px; }
    .att-icon { color: #616161; }
    .att-info { display: flex; flex-direction: column; }
    .att-name { font-size: 0.875rem; color: #1565c0; text-decoration: none; }
    .att-meta { font-size: 0.72rem; color: #9e9e9e; }
    .empty-text { text-align: center; color: #9e9e9e; padding: 32px 0; font-size: 0.85rem; }
    .error-state { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #9e9e9e; gap: 8px; }
  `]
})
export class TaskDetailComponent implements OnInit {
  private tasksService = inject(TasksService);
  private snackBar = inject(MatSnackBar);
  private auth = inject(AuthService);

  task = signal<TaskDto | null>(null);
  loading = signal(false);
  submittingComment = signal(false);
  newComment = '';

  private readonly ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    Pending:    ['Accepted', 'Rejected'],
    Accepted:   ['InProgress', 'Pending', 'Rejected'],
    InProgress: ['Completed', 'Accepted', 'Rejected'],
    Completed:  ['Verified', 'InProgress', 'Rejected'],
    Verified:   ['Completed'],
    Rejected:   ['Pending']
  };

  availableTransitions = computed(() => {
    const t = this.task();
    if (!t) return [];
    return (this.ALLOWED_TRANSITIONS[t.status] ?? []).map(s => ({
      status: s,
      label: TASK_STATUS_LABELS[s],
      color: TASK_STATUS_COLORS[s]
    }));
  });

  canManage = computed(() => {
    const t = this.task();
    const user = this.auth.currentUser();
    if (!t || !user) return false;
    const isOrganizer = t.initiativeOrganizerId === user.id;
    const role = user.role ?? '';
    const isAdmin = role === 'Coordinator' || role === 'OrganizationAdmin' || role === 'SuperAdmin';
    return isOrganizer || isAdmin;
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { taskId: string },
    private dialogRef: MatDialogRef<TaskDetailComponent>
  ) {}

  ngOnInit() { this.loadTask(); }

  loadTask() {
    this.loading.set(true);
    this.tasksService.getById(this.data.taskId).subscribe({
      next: t => { this.task.set(t); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  updateStatus(newStatus: TaskStatus) {
    this.tasksService.updateStatus(this.data.taskId, { newStatus }).subscribe({
      next: () => {
        this.snackBar.open('Статус оновлено', 'OK', { duration: 3000 });
        this.loadTask();
        this.dialogRef.close('updated');
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Помилка', 'OK', { duration: 4000 });
      }
    });
  }

  submitComment() {
    const text = this.newComment.trim();
    if (!text) return;
    this.submittingComment.set(true);
    this.tasksService.addComment(this.data.taskId, text).subscribe({
      next: () => {
        this.newComment = '';
        this.submittingComment.set(false);
        this.loadTask();
      },
      error: () => { this.submittingComment.set(false); }
    });
  }

  close() { this.dialogRef.close(); }

  getStatusLabel(s: TaskStatus): string { return TASK_STATUS_LABELS[s] ?? s; }
  getStatusColor(s: TaskStatus): string { return TASK_STATUS_COLORS[s] ?? '#9e9e9e'; }
  getPriorityColor(p: string): string {
    return TASK_PRIORITY_COLORS[p as keyof typeof TASK_PRIORITY_COLORS] ?? '#9e9e9e';
  }

  getFileIcon(contentType: string): string {
    if (contentType.startsWith('image/')) return 'image';
    if (contentType === 'application/pdf') return 'picture_as_pdf';
    if (contentType.includes('word')) return 'description';
    if (contentType.includes('sheet') || contentType.includes('excel')) return 'table_chart';
    return 'attach_file';
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }
}
