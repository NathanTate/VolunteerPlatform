import {
  Component, OnInit, OnDestroy, signal, computed, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { Subscription } from 'rxjs';

import { TasksService } from '../../../core/services/tasks.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  TaskSummaryDto, TaskStatus, TASK_STATUS_LABELS, TASK_STATUS_COLORS, TASK_PRIORITY_COLORS
} from '../../../shared/models/task.model';
import { TaskDetailComponent } from '../task-detail/task-detail.component';
import { CreateTaskDialogComponent } from '../create-task/create-task-dialog.component';

interface KanbanColumn {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: TaskSummaryDto[];
}

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
    MatTooltipModule, MatBadgeModule
  ],
  template: `
    <div class="board-container">
      <!-- Header -->
      <div class="board-header">
        <div class="board-title">
          <mat-icon>view_kanban</mat-icon>
          <h2>Дошка завдань</h2>
          <p class="board-subtitle">
            @if (initiativeId()) {
              Координатори створюють завдання для цієї ініціативи — волонтери виконують їх. Натисніть на картку для деталей та зміни статусу.
            } @else {
              Тут відображаються завдання, призначені особисто вам координаторами.
            }
          </p>
          @if (initiativeId()) {
            <span class="initiative-badge">Ініціатива</span>
          }
        </div>
        <div class="header-actions">
          @if (canCreateTasks() && initiativeId()) {
            <button mat-raised-button color="primary" (click)="openCreateDialog()">
              <mat-icon>add</mat-icon>
              Нове завдання
            </button>
          }
          <button mat-stroked-button (click)="loadTasks()">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- Loading state -->
      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else {
        <!-- Kanban columns -->
        <div class="kanban-board">
          @for (col of columns(); track col.status) {
            <div class="kanban-column">
              <div class="column-header" [style.border-top-color]="col.color">
                <span class="column-title">{{ col.label }}</span>
                <span class="task-count">{{ col.tasks.length }}</span>
              </div>

              <div class="column-body">
                @for (task of col.tasks; track task.id) {
                  <div
                    class="task-card"
                    [class.overdue]="task.isOverdue"
                    [class.emergency]="task.isOverdue"
                    (click)="openTaskDetail(task.id)">
                    <!-- Priority indicator -->
                    <div
                      class="priority-stripe"
                      [style.background]="getPriorityColor(task.priority)">
                    </div>

                    <div class="task-content">
                      <div class="task-title">{{ task.title }}</div>

                      @if (task.assignedVolunteerName) {
                        <div class="task-assignee">
                          <mat-icon class="assignee-icon">person</mat-icon>
                          {{ task.assignedVolunteerName }}
                        </div>
                      } @else {
                        <div class="task-unassigned">Не призначено</div>
                      }

                      <div class="task-meta">
                        @if (task.deadline) {
                          <span
                            class="deadline"
                            [class.overdue-text]="task.isOverdue"
                            [matTooltip]="task.isOverdue ? 'Прострочено!' : ''">
                            <mat-icon class="meta-icon">schedule</mat-icon>
                            {{ task.deadline | date:'dd.MM' }}
                          </span>
                        }
                        <span class="priority-chip" [style.color]="getPriorityColor(task.priority)">
                          {{ task.priority }}
                        </span>
                      </div>
                    </div>
                  </div>
                }

                @if (col.tasks.length === 0) {
                  <div class="empty-column">
                    <mat-icon>inbox</mat-icon>
                    <span>Немає завдань</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .board-container {
      padding: 20px;
      height: calc(100vh - 64px);
      display: flex;
      flex-direction: column;
      background: #f5f5f5;
    }
    .board-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      background: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    }
    .board-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .board-title h2 { margin: 0; font-size: 1.2rem; font-weight: 600; }
    .board-subtitle { margin: 2px 0 0; font-size: 12px; color: #78909c; }
    .initiative-badge {
      background: #e3f2fd;
      color: #1565c0;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }
    .header-actions { display: flex; gap: 8px; align-items: center; }
    .loading-center {
      display: flex; justify-content: center; align-items: center;
      flex: 1;
    }
    .kanban-board {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      flex: 1;
      padding-bottom: 8px;
    }
    .kanban-column {
      min-width: 240px;
      max-width: 280px;
      flex: 1;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      display: flex;
      flex-direction: column;
      max-height: 100%;
    }
    .column-header {
      padding: 12px 16px;
      border-top: 4px solid transparent;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 0.9rem;
      background: #fafafa;
    }
    .task-count {
      background: #e0e0e0;
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 400;
    }
    .column-body {
      padding: 8px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .task-card {
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      background: white;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      overflow: hidden;
      display: flex;
    }
    .task-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    .task-card.overdue { border-color: #ef9a9a; }
    .priority-stripe { width: 4px; flex-shrink: 0; }
    .task-content { padding: 10px; flex: 1; }
    .task-title {
      font-size: 0.85rem;
      font-weight: 500;
      color: #212121;
      margin-bottom: 6px;
      line-height: 1.4;
    }
    .task-assignee {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #616161;
      margin-bottom: 6px;
    }
    .assignee-icon { font-size: 14px; width: 14px; height: 14px; }
    .task-unassigned {
      font-size: 0.75rem;
      color: #9e9e9e;
      font-style: italic;
      margin-bottom: 6px;
    }
    .task-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.72rem;
    }
    .deadline {
      display: flex;
      align-items: center;
      gap: 2px;
      color: #757575;
    }
    .deadline.overdue-text { color: #e53935; font-weight: 600; }
    .meta-icon { font-size: 12px; width: 12px; height: 12px; }
    .priority-chip { font-weight: 500; }
    .empty-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 8px;
      color: #bdbdbd;
      gap: 8px;
      font-size: 0.8rem;
    }
    .empty-column mat-icon { font-size: 32px; width: 32px; height: 32px; }

    @media (max-width: 768px) {
      .kanban-board { flex-direction: column; overflow-x: unset; overflow-y: auto; }
      .kanban-column { min-width: unset; max-width: unset; }
    }
  `]
})
export class TaskBoardComponent implements OnInit, OnDestroy {
  private tasksService = inject(TasksService);
  private signalR = inject(SignalRService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);

  loading = signal(false);
  initiativeId = signal<string | null>(null);
  private allTasks = signal<TaskSummaryDto[]>([]);
  private subs = new Subscription();

  private readonly STATUS_ORDER: TaskStatus[] = [
    'Pending', 'Accepted', 'InProgress', 'Completed', 'Verified', 'Rejected'
  ];

  columns = computed<KanbanColumn[]>(() =>
    this.STATUS_ORDER.map(status => ({
      status,
      label: TASK_STATUS_LABELS[status],
      color: TASK_STATUS_COLORS[status],
      tasks: this.allTasks().filter(t => t.status === status)
    }))
  );

  canCreateTasks = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'Coordinator' || role === 'OrganizationAdmin' || role === 'SuperAdmin';
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('initiativeId');
    this.initiativeId.set(id);
    this.loadTasks();

    this.subs.add(
      this.signalR.taskUpdated$.subscribe(() => this.loadTasks())
    );
    this.subs.add(
      this.signalR.taskAssigned$.subscribe(data => {
        this.snackBar.open(`Вам призначено завдання: ${data.taskTitle}`, 'OK', { duration: 5000 });
        this.loadTasks();
      })
    );
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  loadTasks() {
    const id = this.initiativeId();
    this.loading.set(true);
    const obs$ = id
      ? this.tasksService.getForInitiative(id)
      : this.tasksService.getMyTasks();

    obs$.subscribe({
      next: tasks => { this.allTasks.set(tasks); this.loading.set(false); },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message ?? `Помилка завантаження завдань (${err?.status ?? 'network'})`;
        this.snackBar.open(msg, 'OK', { duration: 5000 });
      }
    });
  }

  openTaskDetail(taskId: string) {
    this.dialog.open(TaskDetailComponent, {
      data: { taskId },
      width: '720px',
      maxWidth: '95vw',
      panelClass: 'task-detail-dialog'
    }).afterClosed().subscribe(result => {
      if (result === 'updated') this.loadTasks();
    });
  }

  openCreateDialog() {
    const initiativeId = this.initiativeId();
    if (!initiativeId) return;
    this.dialog.open(CreateTaskDialogComponent, {
      data: { initiativeId },
      width: '560px',
      maxWidth: '95vw'
    }).afterClosed().subscribe(result => {
      if (result === 'created') this.loadTasks();
    });
  }

  getPriorityColor(priority: string): string {
    return TASK_PRIORITY_COLORS[priority as keyof typeof TASK_PRIORITY_COLORS] ?? '#9e9e9e';
  }
}
