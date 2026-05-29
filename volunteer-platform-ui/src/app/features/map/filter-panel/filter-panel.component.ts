import { Component, output, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { InitiativeFilters } from '../../../shared/models/initiative.model';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatFormFieldModule, MatIconModule, MatCheckboxModule
  ],
  template: `
    <div class="filter-panel" [formGroup]="form">
      <div class="filter-header">
        <mat-icon class="filter-icon">tune</mat-icon>
        <h3 class="filter-title">Фільтри</h3>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Пошук</mat-label>
        <input matInput formControlName="search" placeholder="Назва або адреса...">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Категорія</mat-label>
        <mat-select formControlName="category">
          <mat-option value="">Всі категорії</mat-option>
          <mat-option value="Environmental">🌿 Екологічна</mat-option>
          <mat-option value="Social">🤝 Соціальна</mat-option>
          <mat-option value="Medical">🏥 Медична</mat-option>
          <mat-option value="Educational">📚 Освітня</mat-option>
          <mat-option value="Other">🔧 Інша</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Статус</mat-label>
        <mat-select formControlName="status">
          <mat-option value="">Всі статуси</mat-option>
          <mat-option value="Active">Активна</mat-option>
          <mat-option value="Planned">Запланована</mat-option>
          <mat-option value="Completed">Завершена</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Рівень терміновості</mat-label>
        <mat-select formControlName="urgencyLevel">
          <mat-option value="">Будь-який</mat-option>
          <mat-option value="Low">🟢 Низький</mat-option>
          <mat-option value="Medium">🟡 Середній</mat-option>
          <mat-option value="High">🟠 Високий</mat-option>
          <mat-option value="Critical">🔴 Критичний</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Сортування</mat-label>
        <mat-select formControlName="sortBy">
          <mat-option value="date">За датою</mat-option>
          <mat-option value="urgency">За терміновістю</mat-option>
          <mat-option value="distance">За відстанню</mat-option>
          <mat-option value="participants">За учасниками</mat-option>
        </mat-select>
      </mat-form-field>

      <div class="emergency-toggle">
        <mat-checkbox formControlName="isEmergency" color="warn">
          🚨 Лише екстрені
        </mat-checkbox>
      </div>

      <button mat-stroked-button color="warn" class="full-width reset-btn" (click)="reset()">
        <mat-icon>clear</mat-icon>
        Скинути фільтри
      </button>
    </div>
  `,
  styles: [`
    .filter-panel {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .filter-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .filter-icon { color: #616161; font-size: 18px; }
    .filter-title {
      font-size: 15px;
      font-weight: 600;
      color: #212121;
      margin: 0;
    }
    .full-width { width: 100%; }
    .emergency-toggle {
      padding: 4px 0 8px;
    }
    .reset-btn {
      margin-top: 4px;
    }
  `]
})
export class FilterPanelComponent {
  filtersChanged = output<Partial<InitiativeFilters>>();
  initialStatus    = input<string>('');
  initialEmergency = input<boolean>(false);

  form = this.fb.group({
    search: [''],
    category: [''],
    status: [''],
    urgencyLevel: [''],
    sortBy: ['date'],
    isEmergency: [false]
  });

  constructor(private fb: FormBuilder) {
    this.form.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(val => {
      this.filtersChanged.emit({
        search: val.search || undefined,
        category: (val.category || undefined) as any,
        status: (val.status || undefined) as any,
        urgencyLevel: (val.urgencyLevel || undefined) as any,
        sortBy: (val.sortBy as any) || 'date',
        isEmergency: val.isEmergency === true ? true : undefined
      });
    });

    // React to signal inputs — ngOnChanges doesn't fire for input<T>() signal inputs
    effect(() => {
      const s = this.initialStatus();
      if (s) {
        this.form.patchValue({ status: s }, { emitEvent: false });
      } else {
        this.form.patchValue({ status: '' }, { emitEvent: false });
      }
    });

    effect(() => {
      const e = this.initialEmergency();
      this.form.patchValue({ isEmergency: e }, { emitEvent: false });
    });
  }

  reset() {
    this.form.reset({
      search: '', category: '', status: '',
      urgencyLevel: '', sortBy: 'date', isEmergency: false
    });
  }
}
