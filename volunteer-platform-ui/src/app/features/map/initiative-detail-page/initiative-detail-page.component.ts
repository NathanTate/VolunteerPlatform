import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InitiativesService } from '../../../core/services/initiatives.service';
import { InitiativeDetailComponent } from '../initiative-detail/initiative-detail.component';
import { InitiativeDto } from '../../../shared/models/initiative.model';

@Component({
  selector: 'app-initiative-detail-page',
  standalone: true,
  imports: [
    CommonModule, MatProgressSpinnerModule, MatButtonModule, MatIconModule,
    InitiativeDetailComponent
  ],
  template: `
    <div class="page-wrapper">
      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (error()) {
        <div class="error-center">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-stroked-button (click)="router.navigate(['/'])">
            <mat-icon>home</mat-icon>
            На головну
          </button>
        </div>
      } @else if (initiative()) {
        <div class="detail-page-panel">
          <app-initiative-detail
            [initiative]="initiative()!"
            (close)="router.navigate(['/'])" />
        </div>
      }
    </div>
  `,
  styles: [`
    .page-wrapper {
      min-height: calc(100vh - 64px);
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      padding: 24px 16px;
    }
    .loading-center, .error-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      flex: 1;
      color: #757575;
    }
    .error-icon { font-size: 48px; width: 48px; height: 48px; color: #ef5350; }
    .detail-page-panel {
      width: min(520px, 100%);
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      overflow: hidden;
      height: fit-content;
      max-height: calc(100vh - 112px);
    }
  `]
})
export class InitiativeDetailPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private initiativesService = inject(InitiativesService);
  protected router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  initiative = signal<InitiativeDto | null>(null);

  private sub = new Subscription();

  ngOnInit() {
    this.sub.add(
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (!id) {
          this.error.set('Ідентифікатор ініціативи не знайдено');
          this.loading.set(false);
          return;
        }
        this.loading.set(true);
        this.error.set(null);
        this.initiative.set(null);
        this.initiativesService.getById(id).subscribe({
          next: (dto) => {
            this.initiative.set(dto);
            this.loading.set(false);
          },
          error: (err) => {
            const msg = err?.status === 404
              ? 'Ініціативу не знайдено'
              : (err?.error?.message ?? 'Помилка завантаження ініціативи');
            this.error.set(msg);
            this.loading.set(false);
          }
        });
      })
    );
  }

  ngOnDestroy() { this.sub.unsubscribe(); }
}
