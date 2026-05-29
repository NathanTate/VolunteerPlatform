import { Component, OnInit, signal, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LocationPickerComponent } from '../../../shared/components/location-picker/location-picker.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { InitiativesService } from '../../../core/services/initiatives.service';
import { InitiativeCategory } from '../../../shared/models/initiative.model';

@Component({
  selector: 'app-create-initiative',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatIconModule,
    MatCheckboxModule, MatSliderModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatStepperModule, MatDividerModule, LocationPickerComponent
  ],
  template: `
    <div class="create-page">
      <mat-card class="create-card">
        <!-- Header -->
        <div class="card-header">
          <button mat-icon-button routerLink="/" type="button">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h2>Створити ініціативу</h2>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <!-- ─── Step 1: Basic info ───────────────────────────────── -->
          <div class="section-title">
            <mat-icon>info</mat-icon>
            <span>Основна інформація</span>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Назва ініціативи *</mat-label>
            <input matInput formControlName="title" maxlength="200" />
            <mat-hint align="end">{{ form.get('title')?.value?.length ?? 0 }}/200</mat-hint>
            @if (form.get('title')?.invalid && form.get('title')?.touched) {
              <mat-error>Назва обов'язкова</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Детальний опис *</mat-label>
            <textarea matInput formControlName="description" rows="4" maxlength="2000"></textarea>
            <mat-hint align="end">{{ form.get('description')?.value?.length ?? 0 }}/2000</mat-hint>
          </mat-form-field>

          <div class="grid-row">
            <mat-form-field appearance="outline">
              <mat-label>Категорія *</mat-label>
              <mat-select formControlName="category">
                <mat-option value="Environmental">🌿 Екологічна</mat-option>
                <mat-option value="Social">🤝 Соціальна</mat-option>
                <mat-option value="Medical">🏥 Медична</mat-option>
                <mat-option value="Educational">📚 Освітня</mat-option>
                <mat-option value="Other">🔧 Інша</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Рівень терміновості *</mat-label>
              <mat-select formControlName="urgencyLevel">
                <mat-option value="Low">🟢 Низький</mat-option>
                <mat-option value="Medium">🟡 Середній</mat-option>
                <mat-option value="High">🟠 Високий</mat-option>
                <mat-option value="Critical">🔴 Критичний</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <mat-divider></mat-divider>

          <!-- ─── Step 2: Dates ────────────────────────────────────── -->
          <div class="section-title">
            <mat-icon>event</mat-icon>
            <span>Дати проведення</span>
          </div>

          <div class="grid-row">
            <mat-form-field appearance="outline">
              <mat-label>Дата початку *</mat-label>
              <input matInput [matDatepicker]="startPicker" formControlName="startDate" />
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Дата завершення</mat-label>
              <input matInput [matDatepicker]="endPicker" formControlName="endDate" />
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
          </div>

          <mat-divider></mat-divider>

          <!-- ─── Step 3: Location ─────────────────────────────────── -->
          <div class="section-title">
            <mat-icon>location_on</mat-icon>
            <span>Місцезнаходження</span>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Адреса *</mat-label>
            <input matInput formControlName="address" maxlength="500" />
            <mat-icon matSuffix>place</mat-icon>
          </mat-form-field>

          <!-- ── Map picker ── -->
          <div class="map-picker-label">
            <mat-icon>map</mat-icon>
            <span>Виберіть місце на карті</span>
          </div>
          <app-location-picker
            [lat]="form.get('latitude')?.value ?? 49.84"
            [lng]="form.get('longitude')?.value ?? 24.03"
            (locationChange)="onLocationPicked($event)"
            (addressChange)="onAddressPicked($event)" />

          <mat-form-field appearance="outline" class="full-width" style="margin-top:8px">
            <mat-label>Радіус охоплення (км)</mat-label>
            <input matInput type="number" formControlName="radiusKm" min="0.5" max="100" step="0.5" />
            <mat-hint>Область, в якій ініціатива є актуальною</mat-hint>
          </mat-form-field>

          <mat-divider></mat-divider>

          <!-- ─── Step 4: Capacity ─────────────────────────────────── -->
          <div class="section-title">
            <mat-icon>group</mat-icon>
            <span>Учасники</span>
          </div>

          <div class="grid-row">
            <mat-form-field appearance="outline">
              <mat-label>Потрібно волонтерів *</mat-label>
              <input matInput type="number" formControlName="requiredVolunteers" min="0" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Максимум учасників *</mat-label>
              <input matInput type="number" formControlName="maxParticipants" min="1" />
            </mat-form-field>
          </div>

          <!-- Emergency flag -->
          <div class="emergency-section">
            <mat-checkbox formControlName="isEmergency" color="warn">
              <div class="emergency-label">
                <mat-icon color="warn">warning</mat-icon>
                <span>Позначити як екстрену ініціативу</span>
                <small>(з'явиться на карті з виділенням та сповіщеннями)</small>
              </div>
            </mat-checkbox>
          </div>

          <mat-divider></mat-divider>

          <!-- Actions -->
          <div class="actions-row">
            <button mat-stroked-button routerLink="/" type="button">Скасувати</button>
            <button
              mat-raised-button color="primary"
              type="submit"
              style="display:flex;align-items:center;gap:6px"
              [disabled]="form.invalid || loading()">
              @if (loading()) {
                <mat-spinner diameter="20" style="display:inline-block"></mat-spinner>
              } @else {
                <mat-icon>add_circle</mat-icon>
                Створити ініціативу
              }
            </button>
          </div>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .create-page {
      display: flex;
      justify-content: center;
      padding: 24px;
      background: #f5f5f5;
      min-height: calc(100vh - 64px);
    }
    .create-card {
      width: min(760px, 100%);
      padding: 28px 32px;
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .card-header h2 { margin: 0; font-size: 1.4rem; font-weight: 600; }
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      color: #424242;
      margin: 20px 0 12px;
    }
    .section-title mat-icon { color: #1565c0; font-size: 20px; }
    .full-width { width: 100%; }
    .grid-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 4px;
    }
    .grid-row mat-form-field { width: 100%; }
    .map-picker-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #424242;
      margin: 4px 0 8px;
    }
    .map-picker-label mat-icon { font-size: 18px; width: 18px; height: 18px; color: #1565c0; }
    .emergency-section {
      padding: 12px 0;
    }
    .emergency-label {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .emergency-label small {
      color: #9e9e9e;
      font-size: 0.75rem;
    }
    .actions-row {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    mat-divider { margin: 8px 0 4px; }
    @media (max-width: 600px) {
      .create-card { padding: 16px; }
      .grid-row { grid-template-columns: 1fr; }
    }
  `]
})
export class CreateInitiativeComponent implements OnInit {
  loading = signal(false);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    category: ['', Validators.required],
    urgencyLevel: ['Medium', Validators.required],
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null],
    address: ['', [Validators.required, Validators.maxLength(500)]],
    latitude: [49.84, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitude: [24.03, [Validators.required, Validators.min(-180), Validators.max(180)]],
    radiusKm: [5.0, [Validators.required, Validators.min(0.5), Validators.max(100)]],
    requiredVolunteers: [1, [Validators.required, Validators.min(0)]],
    maxParticipants: [10, [Validators.required, Validators.min(1)]],
    isEmergency: [false]
  });

  constructor(
    private fb: FormBuilder,
    private initiativesService: InitiativesService,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit() { }

  onLocationPicked(coords: { lat: number; lng: number }) {
    this.form.patchValue({ latitude: coords.lat, longitude: coords.lng });
  }

  onAddressPicked(address: string) {
    this.form.patchValue({ address });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const raw = this.form.value;

    this.initiativesService.create({
      title: raw.title!,
      description: raw.description!,
      category: raw.category as InitiativeCategory,
      urgencyLevel: raw.urgencyLevel as any,
      startDate: new Date(raw.startDate!).toISOString(),
      endDate: raw.endDate ? new Date(raw.endDate).toISOString() : undefined,
      address: raw.address!,
      latitude: Number(raw.latitude),
      longitude: Number(raw.longitude),
      radiusKm: Number(raw.radiusKm),
      requiredVolunteers: Number(raw.requiredVolunteers),
      maxParticipants: Number(raw.maxParticipants),
      isEmergency: raw.isEmergency ?? false,
      imageUrls: []
    }).subscribe({
      next: () => {
        this.snackBar.open('Ініціативу створено успішно!', 'OK', { duration: 5000 });
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message ?? 'Не вдалося створити ініціативу';
        this.snackBar.open(msg, 'OK', { duration: 5000 });
      }
    });
  }
}
