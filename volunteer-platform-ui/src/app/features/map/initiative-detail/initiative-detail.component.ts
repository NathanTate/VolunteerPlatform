import {
  Component, input, output, signal, computed, inject, OnInit, OnChanges, SimpleChanges, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InitiativeDto, InitiativeCategory, InitiativeStatus, UrgencyLevel } from '../../../shared/models/initiative.model';
import { ApplicationDto } from '../../../shared/models/application.model';
import { ApplicationsService } from '../../../core/services/applications.service';
import { InitiativesService } from '../../../core/services/initiatives.service';
import { AuthService } from '../../../core/services/auth.service';
import { RecommendedVolunteersComponent } from '../../volunteers/recommended-volunteers/recommended-volunteers.component';
import { LocationPickerComponent } from '../../../shared/components/location-picker/location-picker.component';

const URGENCY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  Low:      { label: 'Низька',    color: '#2e7d32', bg: '#e8f5e9', icon: 'signal_cellular_1_bar' },
  Medium:   { label: 'Середня',   color: '#e65100', bg: '#fff3e0', icon: 'signal_cellular_2_bar' },
  High:     { label: 'Висока',    color: '#c62828', bg: '#ffebee', icon: 'signal_cellular_3_bar' },
  Critical: { label: 'Критична',  color: '#6a1b9a', bg: '#f3e5f5', icon: 'signal_cellular_4_bar' }
};

@Component({
  selector: 'app-initiative-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatChipsModule,
    MatDividerModule, MatSnackBarModule, MatProgressBarModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatExpansionModule,
    MatProgressSpinnerModule, RecommendedVolunteersComponent, LocationPickerComponent
  ],
  template: `
    <div class="detail-panel">

      <!-- ── Header ──────────────────────────────────────────────── -->
      <div class="detail-header">
        <button mat-icon-button (click)="close.emit()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-title">
          @if (initiative().isEmergency) {
            <span class="emergency-badge">🚨</span>
          }
          <h2>{{ initiative().title }}</h2>
        </div>
        <!-- Edit / Delete menu for owners/admins -->
        @if (canEdit()) {
          <div class="header-actions">
            <button mat-icon-button [matTooltip]="'Редагувати'" (click)="startEdit()" [disabled]="editMode()">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button [matTooltip]="'Видалити'" color="warn" (click)="deleteInitiative()" [disabled]="deleting()">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        }
      </div>

      <!-- ── Cover image ──────────────────────────────────────────── -->
      @if (coverImageUrl() && !editMode()) {
        <div class="cover-image-container">
          <img [src]="coverImageUrl()" [alt]="initiative().title" class="cover-image" />
        </div>
      }

      <mat-divider></mat-divider>

      <div class="detail-content">

        <!-- ════════════════ EDIT FORM ════════════════ -->
        @if (editMode()) {
          <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="edit-form">
            <div class="edit-section-label">
              <mat-icon>edit</mat-icon> Редагування ініціативи
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Назва</mat-label>
              <input matInput formControlName="title" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Опис</mat-label>
              <textarea matInput formControlName="description" rows="3"></textarea>
            </mat-form-field>

            <div class="edit-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Категорія</mat-label>
                <mat-select formControlName="category">
                  <mat-option value="Environmental">🌿 Екологічна</mat-option>
                  <mat-option value="Social">🤝 Соціальна</mat-option>
                  <mat-option value="Medical">🏥 Медична</mat-option>
                  <mat-option value="Educational">📚 Освітня</mat-option>
                  <mat-option value="Other">🔧 Інша</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Терміновість</mat-label>
                <mat-select formControlName="urgencyLevel">
                  <mat-option value="Low">Низька</mat-option>
                  <mat-option value="Medium">Середня</mat-option>
                  <mat-option value="High">Висока</mat-option>
                  <mat-option value="Critical">Критична</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="edit-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Статус</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="Planned">Запланована</mat-option>
                  <mat-option value="Active">Активна</mat-option>
                  <mat-option value="Completed">Завершена</mat-option>
                  <mat-option value="Archived">Архівована</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Дата початку</mat-label>
                <input matInput [matDatepicker]="editStartPicker" formControlName="startDate" />
                <mat-datepicker-toggle matSuffix [for]="editStartPicker"></mat-datepicker-toggle>
                <mat-datepicker #editStartPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Дата завершення</mat-label>
              <input matInput [matDatepicker]="editEndPicker" formControlName="endDate" />
              <mat-datepicker-toggle matSuffix [for]="editEndPicker"></mat-datepicker-toggle>
              <mat-datepicker #editEndPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Адреса</mat-label>
              <input matInput formControlName="address" />
            </mat-form-field>

            <div class="edit-location-label">
              <mat-icon>map</mat-icon>
              <span>Оновити місцезнаходження</span>
            </div>
            <app-location-picker
              [lat]="editForm.get('latitude')?.value ?? initiative().latitude"
              [lng]="editForm.get('longitude')?.value ?? initiative().longitude"
              #editLocationPicker
              (locationChange)="onEditLocationPicked($event)"
              (addressChange)="onEditAddressPicked($event)" />

            <div class="edit-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Потрібно волонтерів</mat-label>
                <input matInput type="number" formControlName="requiredVolunteers" min="0" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Макс. учасників</mat-label>
                <input matInput type="number" formControlName="maxParticipants" min="1" />
              </mat-form-field>
            </div>

            <div class="edit-actions">
              <button mat-stroked-button type="button" (click)="cancelEdit()">Скасувати</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="saving() || editForm.invalid">
                @if (saving()) { <mat-spinner diameter="18" class="btn-spinner"></mat-spinner> }
                Зберегти
              </button>
            </div>
          </form>
        }

        <!-- ════════════════ VIEW MODE ════════════════ -->
        @if (!editMode()) {

          <!-- ── Status / Urgency badges ──────────────────── -->
          <div class="badges-row">
            <span class="status-chip" [class]="'status-' + initiative().status.toLowerCase()">
              {{ statusLabel() }}
            </span>
            <span class="urgency-chip"
              [style.background]="urgencyConfig().bg"
              [style.color]="urgencyConfig().color"
              [matTooltip]="'Рівень терміновості: ' + urgencyConfig().label">
              <mat-icon class="urgency-icon" [style.color]="urgencyConfig().color">{{ urgencyConfig().icon }}</mat-icon>
              {{ urgencyConfig().label }}
            </span>
            @if (initiative().isEmergency) {
              <span class="emergency-chip">🚨 Екстрена</span>
            }
          </div>

          <!-- ── Description ────────────────────────────── -->
          <p class="description">{{ initiative().description }}</p>

          <mat-divider></mat-divider>

          <!-- ── Info rows ──────────────────────────────── -->
          <div class="info-section">
            <div class="info-row">
              <mat-icon>place</mat-icon>
              <span>{{ initiative().address }}</span>
            </div>
            @if (initiative().radiusKm) {
              <div class="info-row">
                <mat-icon>radar</mat-icon>
                <span>Радіус охоплення: {{ initiative().radiusKm }} км</span>
              </div>
            }
            <div class="info-row">
              <mat-icon>event</mat-icon>
              <span>{{ initiative().startDate | date:'dd MMMM yyyy' }}</span>
              @if (initiative().endDate) {
                <span class="date-separator"> — {{ initiative().endDate | date:'dd MMMM yyyy' }}</span>
              }
            </div>
            <div class="info-row">
              <mat-icon>people</mat-icon>
              <span>{{ initiative().currentParticipants }} / {{ initiative().maxParticipants }} учасників</span>
              @if (initiative().requiredVolunteers) {
                <span class="volunteers-needed">(потрібно: {{ initiative().requiredVolunteers }})</span>
              }
            </div>
            <div class="info-row">
              <mat-icon>person</mat-icon>
              <span>{{ initiative().organizerName }}</span>
            </div>
            <div class="info-row">
              <mat-icon>category</mat-icon>
              <span>{{ categoryLabel() }}</span>
            </div>
          </div>

          <!-- ── Task progress ──────────────────────────── -->
          @if (initiative().tasksTotal != null && initiative().tasksTotal! > 0) {
            <mat-divider></mat-divider>
            <div class="tasks-section">
              <div class="tasks-header">
                <mat-icon class="tasks-icon">task_alt</mat-icon>
                <span class="tasks-label">Прогрес завдань</span>
                <span class="tasks-count">{{ initiative().tasksCompleted }} / {{ initiative().tasksTotal }}</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="taskProgressPercent()"
                [color]="taskProgressPercent() === 100 ? 'accent' : 'primary'" class="tasks-progress-bar">
              </mat-progress-bar>
              <a [routerLink]="['/initiatives', initiative().id, 'tasks']" class="view-tasks-link" (click)="close.emit()">
                <mat-icon>view_kanban</mat-icon> Відкрити дошку завдань
              </a>
            </div>
          } @else {
            <div class="no-tasks-row">
              <a [routerLink]="['/initiatives', initiative().id, 'tasks']" class="view-tasks-link" (click)="close.emit()">
                <mat-icon>view_kanban</mat-icon> Дошка завдань
              </a>
            </div>
          }

          <!-- ── My Application Status ──────────────────── -->
          @if (auth.isLoggedIn()) {
            <mat-divider></mat-divider>
            <div class="apply-section">
              @if (!isOrganizer() && myApplicationStatus() === null && (initiative().status === 'Active' || initiative().status === 'Planned')) {
                <!-- Not applied yet — open for Planned and Active -->
                <button mat-raised-button color="primary" class="full-btn"
                  [disabled]="applying()"
                  (click)="apply()">
                  <mat-icon>how_to_reg</mat-icon>
                  {{ applying() ? 'Подається...' : (initiative().status === 'Planned' ? 'Попередньо зареєструватися' : 'Подати заявку на участь') }}
                </button>
                @if (initiative().status === 'Planned') {
                  <p class="planned-hint">
                    <mat-icon>event</mat-icon>
                    Ініціатива ще не розпочалась — ви можете заздалегідь залишити заявку
                  </p>
                }
              }
              @if (myApplicationStatus() === 'Pending') {
                <div class="app-status pending">
                  <mat-icon>hourglass_empty</mat-icon>
                  <div>
                    <strong>Заявку подано</strong>
                    <p>Очікуйте підтвердження від координатора</p>
                  </div>
                </div>
              }
              @if (myApplicationStatus() === 'Approved') {
                <div class="app-status approved">
                  <mat-icon>check_circle</mat-icon>
                  <div>
                    <strong>Ви учасник!</strong>
                    <p>Вашу заявку підтверджено. Ласкаво просимо до команди.</p>
                  </div>
                </div>
              }
              @if (myApplicationStatus() === 'Rejected') {
                <div class="app-status rejected">
                  <mat-icon>cancel</mat-icon>
                  <div>
                    <strong>Заявку відхилено</strong>
                    <p>Ви можете подати заявку знову, якщо є місця.</p>
                  </div>
                  @if (initiative().status === 'Active' || initiative().status === 'Planned') {
                    <button mat-stroked-button color="primary" [disabled]="applying()" (click)="apply()">
                      Подати знову
                    </button>
                  }
                </div>
              }
              @if ((initiative().status === 'Completed' || initiative().status === 'Archived') && myApplicationStatus() === null) {
                <p class="not-active-hint">
                  <mat-icon>info_outline</mat-icon>
                  Ініціатива завершена і більше не приймає заявок
                </p>
              }
            </div>
          }
          @if (!auth.isLoggedIn()) {
            <mat-divider></mat-divider>
            <p class="login-hint">
              <mat-icon>lock</mat-icon>
              Увійдіть, щоб подати заявку
            </p>
          }

          <!-- ── Applications list (coordinators/admins) ─── -->
          @if (canSeeRecommendations()) {
            <mat-divider></mat-divider>
            <mat-expansion-panel class="apps-panel" hideToggle>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon class="panel-icon">how_to_reg</mat-icon>
                  Заявки
                  @if (pendingCount() > 0) {
                    <span class="pending-badge">{{ pendingCount() }}</span>
                  }
                </mat-panel-title>
                <mat-panel-description>{{ applications().length }} всього</mat-panel-description>
              </mat-expansion-panel-header>

              @if (appsLoading()) {
                <div class="apps-loading"><mat-spinner diameter="28"></mat-spinner></div>
              } @else if (applications().length === 0) {
                <p class="apps-empty">Заявок немає</p>
              } @else {
                <div class="apps-list">
                  @for (app of applications(); track app.id) {
                    <div class="app-row" [class]="'app-' + app.status.toLowerCase()">
                      <div class="app-info">
                        <span class="app-name">{{ app.userName }}</span>
                        <span class="app-time">{{ app.submittedAt | date:'dd.MM.yyyy HH:mm' }}</span>
                        @if (app.comment) {
                          <span class="app-comment">« {{ app.comment }} »</span>
                        }
                      </div>
                      <div class="app-status-badge" [class]="'badge-' + app.status.toLowerCase()">
                        {{ appStatusLabel(app.status) }}
                      </div>
                      @if (app.status === 'Pending') {
                        <div class="app-btn-row">
                          <button mat-icon-button color="primary" [matTooltip]="'Схвалити'" (click)="approveApp(app)">
                            <mat-icon>check_circle</mat-icon>
                          </button>
                          <button mat-icon-button color="warn" [matTooltip]="'Відхилити'" (click)="rejectApp(app)">
                            <mat-icon>cancel</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </mat-expansion-panel>
          }

          <!-- ── Recommendations (coordinators/admins) ─────── -->
          @if (canSeeRecommendations()) {
            <mat-divider></mat-divider>
            <div class="rec-section">
              <app-recommended-volunteers [initiativeId]="initiative().id" />
            </div>
          }

          <!-- ── Image gallery ──────────────────────────── -->
          @if (extraImages().length > 0) {
            <mat-divider></mat-divider>
            <div class="gallery-section">
              <div class="gallery-label"><mat-icon>photo_library</mat-icon><span>Фото</span></div>
              <div class="gallery-row">
                @for (img of extraImages(); track img) {
                  <img [src]="img" class="gallery-thumb" [alt]="initiative().title" (click)="activeImage.set(img)" />
                }
              </div>
            </div>
          }

          <!-- ── Lightbox ───────────────────────────────── -->
          @if (activeImage()) {
            <div class="lightbox-overlay" (click)="activeImage.set(null)">
              <img [src]="activeImage()!" class="lightbox-img" />
            </div>
          }

          <!-- ── Admin actions (archive / emergency alert) ─── -->
          @if (canArchive() || canSeeRecommendations()) {
            <mat-divider></mat-divider>
            <div class="actions-section">
              @if (canArchive()) {
                <button mat-stroked-button color="warn" class="full-btn"
                  [disabled]="archiving()"
                  (click)="archiveInitiative()">
                  <mat-icon>archive</mat-icon>
                  {{ archiving() ? 'Архівується...' : 'Архівувати ініціативу' }}
                </button>
              }
              @if (canSeeRecommendations()) {
                <button mat-raised-button class="full-btn emergency-alert-btn"
                  [disabled]="alertSending()"
                  (click)="triggerEmergencyAlert()">
                  <mat-icon>emergency_share</mat-icon>
                  {{ alertSending() ? 'Надсилається...' : 'Надіслати екстрений сигнал' }}
                </button>
              }
            </div>
          }

        } <!-- end !editMode -->
      </div>
    </div>
  `,
  styles: [`
    .detail-panel { height: 100%; display: flex; flex-direction: column; overflow: hidden; }

    /* Header */
    .detail-header {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; flex-shrink: 0;
    }
    .header-title { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; }
    .detail-header h2 { font-size: 15px; font-weight: 600; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .emergency-badge { font-size: 18px; flex-shrink: 0; }
    .header-actions { display: flex; gap: 0; margin-left: auto; flex-shrink: 0; }

    /* Cover image */
    .cover-image-container { width: 100%; height: 160px; overflow: hidden; flex-shrink: 0; }
    .cover-image { width: 100%; height: 100%; object-fit: cover; }

    /* Content */
    .detail-content { padding: 12px 16px; overflow-y: auto; flex: 1; }

    /* Edit form */
    .edit-form { padding: 4px 0; }
    .edit-section-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600; color: #1565c0; margin-bottom: 14px;
    }
    .edit-section-label mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .full-width { width: 100%; }
    .half-width { width: calc(50% - 6px); }
    .edit-row { display: flex; gap: 12px; }
    .edit-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; padding-bottom: 8px; }
    .edit-location-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 500; color: #424242;
      margin: 8px 0 6px;
    }
    .edit-location-label mat-icon { font-size: 17px; width: 17px; height: 17px; color: #1565c0; }
    .btn-spinner { display: inline-block; vertical-align: middle; margin-right: 6px; }

    /* Badges */
    .badges-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
    .status-chip { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; background: #e0e0e0; color: #444; }
    .status-chip.status-active    { background: #e8f5e9; color: #2e7d32; }
    .status-chip.status-planned   { background: #e3f2fd; color: #1565c0; }
    .status-chip.status-completed { background: #f3e5f5; color: #6a1b9a; }
    .status-chip.status-archived  { background: #fafafa; color: #757575; }
    .urgency-chip {
      display: flex; align-items: center; gap: 3px;
      padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;
    }
    .urgency-icon { font-size: 14px; width: 14px; height: 14px; }
    .emergency-chip { padding: 2px 8px; border-radius: 12px; background: #ffebee; color: #c62828; font-size: 12px; font-weight: 600; }

    /* Description */
    .description { color: #444; margin-bottom: 12px; line-height: 1.6; font-size: 14px; }

    /* Info rows */
    .info-section { margin: 12px 0; }
    .info-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; font-size: 13px; color: #555; }
    .info-row mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; color: #757575; }
    .date-separator { margin-left: 2px; }
    .volunteers-needed { margin-left: 6px; color: #9e9e9e; font-size: 12px; }

    /* Tasks */
    .tasks-section { padding: 10px 0; }
    .tasks-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 13px; font-weight: 500; color: #424242; }
    .tasks-icon { font-size: 18px; width: 18px; height: 18px; color: #1565c0; }
    .tasks-label { flex: 1; }
    .tasks-count { font-size: 12px; color: #757575; }
    .tasks-progress-bar { border-radius: 4px; height: 8px; margin-bottom: 8px; }
    .no-tasks-row { padding: 8px 0; }
    .view-tasks-link { display: inline-flex; align-items: center; gap: 4px; color: #1565c0; font-size: 13px; text-decoration: none; cursor: pointer; }
    .view-tasks-link:hover { text-decoration: underline; }
    .view-tasks-link mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Apply section */
    .apply-section { padding: 10px 0; }
    .full-btn { width: 100%; }
    .app-status {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 12px; border-radius: 8px; font-size: 13px;
    }
    .app-status mat-icon { font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; margin-top: 2px; }
    .app-status strong { display: block; font-weight: 600; }
    .app-status p { margin: 2px 0 0; color: #616161; }
    .app-status.pending  { background: #fff8e1; color: #f57f17; }
    .app-status.pending mat-icon { color: #f57f17; }
    .app-status.approved { background: #e8f5e9; color: #2e7d32; }
    .app-status.approved mat-icon { color: #2e7d32; }
    .app-status.rejected { background: #ffebee; color: #c62828; flex-direction: column; gap: 8px; }
    .app-status.rejected mat-icon { color: #c62828; }
    .not-active-hint { display: flex; align-items: center; gap: 6px; color: #9e9e9e; font-size: 13px; padding: 8px 0; }
    .not-active-hint mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .planned-hint { display: flex; align-items: center; gap: 6px; color: #1565c0; font-size: 12px; margin: 6px 0 0; background: #e3f2fd; padding: 6px 10px; border-radius: 6px; }
    .planned-hint mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
    .organizer-hint { display: flex; align-items: center; gap: 8px; background: #fff8e1; color: #f57f17; padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 500; }
    .organizer-hint mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .login-hint { display: flex; align-items: center; gap: 6px; color: #9e9e9e; font-size: 13px; justify-content: center; padding: 12px 0; }
    .login-hint mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Applications panel */
    .apps-panel { margin: 8px 0; box-shadow: none !important; border: 1px solid #e0e0e0 !important; border-radius: 8px !important; }
    .panel-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 6px; color: #1565c0; }
    .pending-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; border-radius: 50%; background: #f57f17; color: white;
      font-size: 11px; font-weight: 700; margin-left: 6px;
    }
    .apps-loading { display: flex; justify-content: center; padding: 20px; }
    .apps-empty { color: #9e9e9e; font-size: 13px; text-align: center; padding: 16px; }
    .apps-list { display: flex; flex-direction: column; gap: 6px; padding: 4px 0; }
    .app-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 6px;
      border-left: 3px solid #e0e0e0; background: #fafafa;
      font-size: 13px;
    }
    .app-row.app-pending  { border-left-color: #f57f17; background: #fffde7; }
    .app-row.app-approved { border-left-color: #4caf50; background: #f1f8e9; }
    .app-row.app-rejected { border-left-color: #ef5350; background: #ffebee; }
    .app-info { flex: 1; min-width: 0; }
    .app-name  { font-weight: 600; display: block; }
    .app-time  { color: #9e9e9e; font-size: 11px; display: block; }
    .app-comment { color: #616161; font-style: italic; font-size: 12px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .app-status-badge { padding: 2px 7px; border-radius: 10px; font-size: 11px; font-weight: 600; flex-shrink: 0; }
    .badge-pending  { background: #fff3e0; color: #e65100; }
    .badge-approved { background: #e8f5e9; color: #2e7d32; }
    .badge-rejected { background: #ffebee; color: #c62828; }
    .app-btn-row { display: flex; gap: 0; }

    /* Recommendations */
    .rec-section { padding: 4px 0; }

    /* Gallery */
    .gallery-section { padding: 10px 0; }
    .gallery-label { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 13px; font-weight: 500; color: #424242; }
    .gallery-label mat-icon { font-size: 18px; width: 18px; height: 18px; color: #757575; }
    .gallery-row { display: flex; gap: 6px; flex-wrap: wrap; }
    .gallery-thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 1px solid #e0e0e0; transition: transform 0.15s, box-shadow 0.15s; }
    .gallery-thumb:hover { transform: scale(1.05); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }

    /* Lightbox */
    .lightbox-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 9999; cursor: zoom-out; }
    .lightbox-img { max-width: 90vw; max-height: 85vh; border-radius: 4px; }

    /* Admin actions */
    .actions-section { padding: 12px 0; display: flex; flex-direction: column; gap: 10px; }
    .emergency-alert-btn { background: #b71c1c !important; color: white !important; }
    .emergency-alert-btn:hover { background: #d32f2f !important; }
  `]
})
export class InitiativeDetailComponent implements OnInit, OnChanges {
  initiative = input.required<InitiativeDto>();
  close = output<void>();

  applying = signal(false);
  archiving = signal(false);
  alertSending = signal(false);
  deleting = signal(false);
  saving = signal(false);
  editMode = signal(false);
  @ViewChild('editLocationPicker') private editLocationPicker?: LocationPickerComponent;
  activeImage = signal<string | null>(null);
  applications = signal<ApplicationDto[]>([]);
  appsLoading = signal(false);
  myApplicationStatus = signal<'Pending' | 'Approved' | 'Rejected' | null>(null);

  protected auth = inject(AuthService);
  private appService = inject(ApplicationsService);
  private initiativesService = inject(InitiativesService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  editForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    category: ['', Validators.required],
    urgencyLevel: ['Medium', Validators.required],
    status: ['', Validators.required],
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null],
    address: ['', [Validators.required, Validators.maxLength(500)]],
    latitude: [49.84 as number],
    longitude: [24.03 as number],
    requiredVolunteers: [1, [Validators.required, Validators.min(0)]],
    maxParticipants: [10, [Validators.required, Validators.min(1)]]
  });

  // ── Computed ────────────────────────────────────────────────────────────────

  coverImageUrl = computed(() => this.initiative().imageUrls?.[0] ?? null);
  extraImages = computed(() => this.initiative().imageUrls?.slice(1) ?? []);

  taskProgressPercent = computed(() => {
    const total = this.initiative().tasksTotal;
    const done = this.initiative().tasksCompleted;
    if (!total || total === 0) return 0;
    return Math.round((done! / total) * 100);
  });

  urgencyConfig = computed(() =>
    URGENCY_CONFIG[this.initiative().urgencyLevel ?? 'Medium'] ?? URGENCY_CONFIG['Medium']
  );

  pendingCount = computed(() => this.applications().filter(a => a.status === 'Pending').length);

  isOrganizer = computed(() =>
    !!this.auth.currentUser() && this.initiative().organizerId === this.auth.currentUser()!.id
  );

  canEdit = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return false;
    const role = user.role;
    const isAdmin = role === 'OrganizationAdmin' || role === 'SuperAdmin';
    const isOrganizer = this.initiative().organizerId === user.id;
    return isAdmin || isOrganizer || role === 'Coordinator';
  });

  canArchive = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return false;
    const role = user.role;
    const isAdmin = role === 'OrganizationAdmin' || role === 'SuperAdmin';
    const isOrganizer = this.initiative().organizerId === user.id;
    const archivable = ['Active', 'Planned', 'Completed'].includes(this.initiative().status);
    return archivable && (isAdmin || isOrganizer);
  });

  canSeeRecommendations = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'Coordinator' || role === 'OrganizationAdmin' || role === 'SuperAdmin';
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnInit() {
    this.loadMyApplication();
    if (this.canSeeRecommendations()) this.loadApplications();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initiative'] && !changes['initiative'].firstChange) {
      this.editMode.set(false);
      this.myApplicationStatus.set(null);
      this.applications.set([]);
      this.loadMyApplication();
      if (this.canSeeRecommendations()) this.loadApplications();
    }
  }

  // ── Labels ──────────────────────────────────────────────────────────────────

  statusLabel() {
    const map: Record<string, string> = {
      Active: 'Активна', Planned: 'Запланована',
      Completed: 'Завершена', Archived: 'Архівована', Cancelled: 'Скасована'
    };
    return map[this.initiative().status] ?? this.initiative().status;
  }

  categoryLabel() {
    const map: Record<string, string> = {
      Environmental: 'Екологічна', Social: 'Соціальна',
      Medical: 'Медична', Educational: 'Освітня', Other: 'Інша'
    };
    return map[this.initiative().category] ?? this.initiative().category;
  }

  appStatusLabel(status: string) {
    const map: Record<string, string> = {
      Pending: 'Очікує', Approved: 'Схвалено', Rejected: 'Відхилено'
    };
    return map[status] ?? status;
  }

  // ── Data loading ─────────────────────────────────────────────────────────────

  loadMyApplication() {
    if (!this.auth.isLoggedIn()) return;
    this.appService.getMine().subscribe({
      next: apps => {
        const mine = apps.find(a => a.initiativeId === this.initiative().id);
        this.myApplicationStatus.set(mine ? mine.status as any : null);
      },
      error: () => { }
    });
  }

  loadApplications() {
    this.appsLoading.set(true);
    this.appService.getForInitiative(this.initiative().id).subscribe({
      next: apps => { this.applications.set(apps); this.appsLoading.set(false); },
      error: () => this.appsLoading.set(false)
    });
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  apply() {
    this.applying.set(true);
    this.appService.submit(this.initiative().id).subscribe({
      next: () => {
        this.snackBar.open('Заявку подано!', 'OK', { duration: 3000, panelClass: 'success-snack' });
        this.myApplicationStatus.set('Pending');
        this.applying.set(false);
      },
      error: err => {
        this.snackBar.open(err.error?.detail ?? 'Помилка при поданні заявки', 'OK',
          { duration: 3000, panelClass: 'error-snack' });
        this.applying.set(false);
      }
    });
  }

  approveApp(app: ApplicationDto) {
    this.appService.approve(app.id).subscribe({
      next: () => {
        this.applications.update(list => list.map(a => a.id === app.id ? { ...a, status: 'Approved' as any } : a));
        this.snackBar.open('Заявку схвалено', 'OK', { duration: 2500, panelClass: 'success-snack' });
      },
      error: () => this.snackBar.open('Помилка', 'OK', { duration: 2500 })
    });
  }

  rejectApp(app: ApplicationDto) {
    this.appService.reject(app.id).subscribe({
      next: () => {
        this.applications.update(list => list.map(a => a.id === app.id ? { ...a, status: 'Rejected' as any } : a));
        this.snackBar.open('Заявку відхилено', 'OK', { duration: 2500 });
      },
      error: () => this.snackBar.open('Помилка', 'OK', { duration: 2500 })
    });
  }

  // ── Edit ────────────────────────────────────────────────────────────────────

  startEdit() {
    const i = this.initiative();
    this.editForm.patchValue({
      title: i.title,
      description: i.description,
      category: i.category,
      urgencyLevel: i.urgencyLevel,
      status: i.status,
      startDate: new Date(i.startDate),
      endDate: i.endDate ? new Date(i.endDate) : null,
      address: i.address,
      latitude: i.latitude,
      longitude: i.longitude,
      requiredVolunteers: i.requiredVolunteers,
      maxParticipants: i.maxParticipants
    });
    this.editMode.set(true);
    // Mapbox needs resize() after becoming visible
    setTimeout(() => this.editLocationPicker?.resize(), 50);
  }

  onEditLocationPicked(coords: { lat: number; lng: number }) {
    this.editForm.patchValue({ latitude: coords.lat, longitude: coords.lng });
  }

  onEditAddressPicked(address: string) {
    this.editForm.patchValue({ address });
  }

  cancelEdit() { this.editMode.set(false); }

  saveEdit() {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.editForm.value;
    const payload = {
      title: v.title!,
      description: v.description!,
      category: v.category as InitiativeCategory,
      urgencyLevel: v.urgencyLevel as any,
      status: v.status as InitiativeStatus,
      startDate: new Date(v.startDate!).toISOString(),
      endDate: v.endDate ? new Date(v.endDate).toISOString() : undefined,
      address: v.address!,
      latitude: v.latitude ?? this.initiative().latitude,
      longitude: v.longitude ?? this.initiative().longitude,
      radiusKm: this.initiative().radiusKm,
      requiredVolunteers: Number(v.requiredVolunteers),
      maxParticipants: Number(v.maxParticipants),
      isEmergency: this.initiative().isEmergency
    };
    this.initiativesService.update(this.initiative().id, payload as any).subscribe({
      next: () => {
        this.snackBar.open('Ініціативу оновлено', 'OK', { duration: 3000, panelClass: 'success-snack' });
        this.saving.set(false);
        this.editMode.set(false);
        // Reload by closing — parent can refresh
        this.close.emit();
      },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'Помилка збереження', 'OK', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  deleteInitiative() {
    if (!confirm(`Видалити ініціативу "${this.initiative().title}"?\nЦю дію неможливо скасувати.`)) return;
    this.deleting.set(true);
    this.initiativesService.delete(this.initiative().id).subscribe({
      next: () => {
        this.snackBar.open('Ініціативу видалено', 'OK', { duration: 3000, panelClass: 'success-snack' });
        this.deleting.set(false);
        this.close.emit();
      },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'Помилка видалення', 'OK', { duration: 3000 });
        this.deleting.set(false);
      }
    });
  }

  // ── Archive ──────────────────────────────────────────────────────────────────

  archiveInitiative() {
    this.archiving.set(true);
    this.initiativesService.archive(this.initiative().id).subscribe({
      next: () => {
        this.snackBar.open('Ініціативу архівовано', 'OK', { duration: 3000, panelClass: 'success-snack' });
        this.archiving.set(false);
        this.close.emit();
      },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'Помилка архівування', 'OK', { duration: 3000 });
        this.archiving.set(false);
      }
    });
  }

  // ── Emergency alert ──────────────────────────────────────────────────────────

  triggerEmergencyAlert() {
    this.alertSending.set(true);
    this.initiativesService.triggerEmergencyAlert(this.initiative().id).subscribe({
      next: count => {
        this.snackBar.open(`Екстрений сигнал надіслано ${count} волонтерам`, 'OK',
          { duration: 4000, panelClass: 'success-snack' });
        this.alertSending.set(false);
      },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'Помилка надсилання сигналу', 'OK', { duration: 3000 });
        this.alertSending.set(false);
      }
    });
  }
}
