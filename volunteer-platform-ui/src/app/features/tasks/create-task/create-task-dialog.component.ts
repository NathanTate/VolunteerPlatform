import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { TasksService } from '../../../core/services/tasks.service';

export interface CreateTaskDialogData {
  initiativeId: string;
}

@Component({
  selector: 'app-create-task-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="create-dialog">
      <div class="dialog-header">
        <mat-icon class="header-icon">add_task</mat-icon>
        <h2 class="dialog-title">Нове завдання</h2>
        <button mat-icon-button (click)="cancel()"><mat-icon>close</mat-icon></button>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="dialog-body">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Назва завдання *</mat-label>
          <input matInput formControlName="title" maxlength="200" />
          <mat-hint align="end">{{ form.get('title')?.value?.length ?? 0 }}/200</mat-hint>
          @if (form.get('title')?.invalid && form.get('title')?.touched) {
            <mat-error>Назва обов'язкова</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Опис</mat-label>
          <textarea matInput formControlName="description" rows="3" maxlength="1000"></textarea>
        </mat-form-field>

        <div class="row-2">
          <mat-form-field appearance="outline">
            <mat-label>Пріоритет *</mat-label>
            <mat-select formControlName="priority">
              <mat-option value="Low">🟢 Низький</mat-option>
              <mat-option value="Medium">🟡 Середній</mat-option>
              <mat-option value="High">🟠 Високий</mat-option>
              <mat-option value="Critical">🔴 Критичний</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Дедлайн</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="dueDate" />
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        </div>

        <div class="dialog-actions">
          <button mat-stroked-button type="button" (click)="cancel()">Скасувати</button>
          <button mat-raised-button color="primary" type="submit"
            style="display:flex;align-items:center;gap:6px"
            [disabled]="form.invalid || saving()">
            @if (saving()) {
              <mat-spinner diameter="18"></mat-spinner>
            } @else {
              <mat-icon>save</mat-icon>
            }
            Створити завдання
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .create-dialog { min-width: 480px; max-width: 560px; }
    .dialog-header {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 20px 12px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }
    .header-icon { color: #1565c0; font-size: 22px; width: 22px; height: 22px; }
    .dialog-title { margin: 0; flex: 1; font-size: 1.1rem; font-weight: 700; color: #1a237e; }
    .dialog-body { padding: 20px; display: flex; flex-direction: column; gap: 8px; }
    .full-width { width: 100%; }
    .row-2 {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    }
    .row-2 mat-form-field { width: 100%; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
    @media (max-width: 560px) {
      .create-dialog { min-width: unset; }
      .row-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class CreateTaskDialogComponent {
  private fb          = inject(FormBuilder);
  private tasksService = inject(TasksService);
  private snackBar    = inject(MatSnackBar);
  private dialogRef   = inject(MatDialogRef<CreateTaskDialogComponent>);
  private data        = inject<CreateTaskDialogData>(MAT_DIALOG_DATA);

  saving = signal(false);

  form = this.fb.group({
    title:       ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', Validators.maxLength(1000)],
    priority:    ['Medium', Validators.required],
    dueDate:     [null as Date | null]
  });

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    this.tasksService.create({
      initiativeId: this.data.initiativeId,
      title:        v.title ?? '',
      description:  v.description ?? '',
      priority:     v.priority as any,
      deadline:     v.dueDate ? new Date(v.dueDate).toISOString() : undefined
    }).subscribe({
      next: () => {
        this.snackBar.open('Завдання створено!', 'OK', { duration: 3000 });
        this.dialogRef.close('created');
      },
      error: err => {
        this.saving.set(false);
        this.snackBar.open(err?.error?.message ?? 'Помилка при створенні', 'OK', { duration: 4000 });
      }
    });
  }

  cancel() { this.dialogRef.close(); }
}
