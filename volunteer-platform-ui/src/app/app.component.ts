import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './core/services/auth.service';
import { NotificationBellComponent } from './features/notifications/notification-bell/notification-bell.component';
import { EmergencyBannerComponent } from './features/emergency/emergency-banner/emergency-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule,
    MatSidenavModule, MatListModule, MatDividerModule, MatTooltipModule,
    NotificationBellComponent, EmergencyBannerComponent
  ],
  template: `
    <app-emergency-banner />

    <mat-sidenav-container class="app-container" autosize>

      <!-- Mobile drawer -->
      <mat-sidenav #drawer mode="over" position="end" class="mobile-drawer"
        [opened]="drawerOpen()">
        <div class="drawer-header">
          <span class="drawer-logo">
            <mat-icon>volunteer_activism</mat-icon>
            VolunteerUA
          </span>
          <button mat-icon-button (click)="closeDrawer()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <mat-nav-list (click)="closeDrawer()">
          @if (auth.isLoggedIn()) {
            <a mat-list-item routerLink="/applications/my" routerLinkActive="active-nav-item">
              <mat-icon matListItemIcon>assignment</mat-icon>
              <span matListItemTitle>Мої заявки</span>
            </a>
            @if (showJoinButton()) {
              <a mat-list-item routerLink="/apply" routerLinkActive="active-nav-item">
                <mat-icon matListItemIcon>how_to_reg</mat-icon>
                <span matListItemTitle>{{ joinButtonLabel() }}</span>
              </a>
            }
            <a mat-list-item routerLink="/dashboard" routerLinkActive="active-nav-item">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Дашборд</span>
            </a>
            @if (isCoordinatorOrAbove()) {
              <a mat-list-item routerLink="/applications/review" routerLinkActive="active-nav-item">
                <mat-icon matListItemIcon>rate_review</mat-icon>
                <span matListItemTitle>Розгляд заявок</span>
              </a>
            }
            @if (isAdmin()) {
              <a mat-list-item routerLink="/admin/initiatives" routerLinkActive="active-nav-item">
                <mat-icon matListItemIcon>volunteer_activism</mat-icon>
                <span matListItemTitle>Ініціативи (адмін)</span>
              </a>
              <a mat-list-item routerLink="/admin/users" routerLinkActive="active-nav-item">
                <mat-icon matListItemIcon>manage_accounts</mat-icon>
                <span matListItemTitle>Користувачі</span>
              </a>
            }
            <mat-divider></mat-divider>
            <div class="drawer-user">
              <mat-icon>account_circle</mat-icon>
              <span>{{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}</span>
            </div>
            <a mat-list-item (click)="auth.logout()">
              <mat-icon matListItemIcon>logout</mat-icon>
              <span matListItemTitle>Вийти</span>
            </a>
          } @else {
            <a mat-list-item routerLink="/auth/login">
              <mat-icon matListItemIcon>login</mat-icon>
              <span matListItemTitle>Увійти</span>
            </a>
            <a mat-list-item routerLink="/auth/register">
              <mat-icon matListItemIcon>person_add</mat-icon>
              <span matListItemTitle>Реєстрація</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <!-- Top navbar -->
        <mat-toolbar color="primary" class="navbar">
          <a routerLink="/" class="logo" aria-label="VolunteerUA">
            <mat-icon>volunteer_activism</mat-icon>
            <span class="logo-text">VolunteerUA</span>
          </a>
          <span class="spacer"></span>

          @if (auth.isLoggedIn()) {
            <button mat-button routerLink="/applications/my" routerLinkActive="nav-active"
              class="nav-btn hide-mobile">
              <mat-icon>assignment</mat-icon>
              <span>Мої заявки</span>
            </button>

            <button mat-button routerLink="/dashboard" routerLinkActive="nav-active"
              class="nav-btn hide-mobile">
              <mat-icon>dashboard</mat-icon>
              <span>Дашборд</span>
            </button>

            @if (isCoordinatorOrAbove()) {
              <button mat-button routerLink="/applications/review" routerLinkActive="nav-active"
                class="nav-btn hide-mobile">
                <mat-icon>rate_review</mat-icon>
                <span>Заявки</span>
              </button>
            }

            @if (isAdmin()) {
              <button mat-button [matMenuTriggerFor]="adminMenu" class="nav-btn hide-mobile admin-btn-wrap">
                <mat-icon>admin_panel_settings</mat-icon>
                <span>Адмін</span>
                <mat-icon class="drop-arrow">arrow_drop_down</mat-icon>
              </button>
              <mat-menu #adminMenu="matMenu">
                <button mat-menu-item routerLink="/admin/initiatives">
                  <mat-icon>volunteer_activism</mat-icon> Ініціативи
                </button>
                <button mat-menu-item routerLink="/admin/users">
                  <mat-icon>manage_accounts</mat-icon> Користувачі
                </button>
              </mat-menu>
            }

            @if (showJoinButton()) {
              <button mat-raised-button color="accent" routerLink="/apply"
                routerLinkActive="nav-active" class="nav-btn hide-mobile join-btn"
                [matTooltip]="joinButtonTooltip()">
                <mat-icon>how_to_reg</mat-icon>
                <span>{{ joinButtonLabel() }}</span>
              </button>
            }

            <span class="nav-divider hide-mobile"></span>

            <app-notification-bell />

            <div class="nav-user-section hide-mobile">
              <span class="user-chip">
                <span class="user-avatar">{{ userInitials() }}</span>
                <span class="user-name">{{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}</span>
              </span>
              <button mat-icon-button (click)="auth.logout()" matTooltip="Вийти"
                class="logout-btn" aria-label="Вийти">
                <mat-icon>logout</mat-icon>
              </button>
            </div>

            <button mat-icon-button class="show-mobile-only hamburger"
              (click)="openDrawer()" aria-label="Меню">
              <mat-icon>menu</mat-icon>
            </button>
          } @else {
            <button mat-button routerLink="/auth/login" class="hide-mobile nav-btn">Увійти</button>
            <button mat-raised-button color="accent" routerLink="/auth/register"
              class="hide-mobile register-btn">Реєстрація</button>

            <button mat-icon-button class="show-mobile-only hamburger"
              (click)="openDrawer()" aria-label="Меню">
              <mat-icon>menu</mat-icon>
            </button>
          }
        </mat-toolbar>

        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-container { height: 100vh; display: flex; flex-direction: column; }

    /* ══ Navbar ══════════════════════════════════════════════════ */
    .navbar {
      position: sticky; top: 0; z-index: 200; flex-shrink: 0;
      min-height: 60px !important; height: 60px !important;
      padding: 0 16px !important;
      background: #1252a8 !important;
      box-shadow: 0 2px 10px rgba(0,0,0,0.22);
      gap: 2px;
    }

    /* Logo */
    .logo {
      display: flex; align-items: center; gap: 8px;
      text-decoration: none; color: white; flex-shrink: 0;
      margin-right: 8px;
    }
    .logo mat-icon { font-size: 24px; width: 24px; height: 24px; color: #90caf9; }
    .logo-text { font-size: 16px; font-weight: 700; color: white; letter-spacing: -0.02em; }

    .spacer { flex: 1; min-width: 8px; }

    /* Nav buttons */
    .nav-btn {
      color: rgba(255,255,255,0.85) !important;
      font-size: 13px !important; font-weight: 500 !important;
      border-radius: 6px !important;
      height: 34px !important;
      min-width: unset !important;
      padding: 0 8px !important;
      letter-spacing: 0 !important;
    }
    .nav-btn mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }
    .nav-btn span { white-space: nowrap; }
    .nav-btn:hover { background: rgba(255,255,255,0.14) !important; color: white !important; }
    ::ng-deep .nav-active { background: rgba(255,255,255,0.18) !important; color: white !important; }

    /* Divider */
    .nav-divider {
      width: 1px; height: 20px; align-self: center;
      background: rgba(255,255,255,0.2);
      margin: 0 4px; flex-shrink: 0;
    }

    /* Admin button */
    .drop-arrow { font-size: 16px !important; width: 16px !important; height: 16px !important; opacity: 0.6; }

    /* Join / status button */
    .join-btn {
      background: rgba(255,255,255,0.12) !important;
      border: 1px solid rgba(255,255,255,0.28) !important;
      color: white !important; font-weight: 600 !important;
    }
    .join-btn:hover { background: rgba(255,255,255,0.2) !important; }

    /* User section */
    .nav-user-section {
      display: flex; align-items: center; gap: 1px;
      margin-left: 6px; padding-left: 10px;
      border-left: 1px solid rgba(255,255,255,0.18);
    }
    .user-chip {
      display: flex; align-items: center; gap: 7px;
      padding: 3px 10px 3px 4px;
      border-radius: 20px;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 500;
      max-width: 150px; overflow: hidden; cursor: default;
    }
    .user-avatar {
      width: 24px; height: 24px; border-radius: 50%;
      background: rgba(255,255,255,0.25);
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700; color: white; flex-shrink: 0;
    }
    .user-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .logout-btn { color: rgba(255,255,255,0.7) !important; }
    .logout-btn:hover { background: rgba(255,80,80,0.15) !important; color: white !important; }
    .hamburger { color: white !important; }
    .register-btn { font-weight: 600 !important; }

    /* ── Mobile drawer ── */
    .mobile-drawer { width: 280px; }
    .drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px;
      background: #1252a8; color: white;
    }
    .drawer-logo { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
    .drawer-logo mat-icon { font-size: 20px; width: 20px; height: 20px; color: #90caf9; }
    .drawer-user { display: flex; align-items: center; gap: 8px; padding: 12px 16px; color: #616161; font-size: 13px; }
    .active-nav-item { background: rgba(21, 101, 192, 0.08) !important; }
    .page-content { min-height: calc(100vh - 60px); }

    @media (max-width: 768px) {
      .logo-text { display: none; }
      .navbar { padding: 0 10px !important; }
    }
  `]
})
export class AppComponent {
  drawerOpen = signal(false);

  constructor(public auth: AuthService) {}

  isAdmin(): boolean {
    return this.auth.currentUser()?.role === 'SuperAdmin';
  }

  showJoinButton(): boolean {
    return this.auth.currentUser()?.role === 'Guest';
  }

  joinButtonLabel(): string {
    const u = this.auth.currentUser();
    if (!u || u.role === 'Guest') return 'Приєднатись';
    return 'Статус заявки';
  }

  joinButtonTooltip(): string {
    const u = this.auth.currentUser();
    if (!u || u.role === 'Guest') return '';
    if (u.role === 'Volunteer') return 'Очікує підтвердження координатором';
    if (u.role === 'OrganizationAdmin') return 'Організація очікує схвалення';
    return '';
  }

  isCoordinatorOrAbove(): boolean {
    const role = this.auth.currentUser()?.role;
    return role === 'Coordinator' || role === 'OrganizationAdmin' || role === 'SuperAdmin';
  }

  userInitials(): string {
    const u = this.auth.currentUser();
    if (!u) return '?';
    return ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase() || '?';
  }

  openDrawer()  { this.drawerOpen.set(true); }
  closeDrawer() { this.drawerOpen.set(false); }
}
