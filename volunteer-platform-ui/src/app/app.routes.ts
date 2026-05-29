import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/map/map.component').then(m => m.MapComponent)
  },
  {
    path: 'initiative/create',
    canActivate: [authGuard],
    loadComponent: () => import('./features/map/create-initiative/create-initiative.component')
      .then(m => m.CreateInitiativeComponent)
  },
  {
    path: 'initiatives/:id',
    loadComponent: () => import('./features/map/initiative-detail-page/initiative-detail-page.component')
      .then(m => m.InitiativeDetailPageComponent)
  },
  {
    path: 'initiatives/:initiativeId/tasks',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tasks/task-board/task-board.component')
      .then(m => m.TaskBoardComponent)
  },
  {
    path: 'tasks/my',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tasks/task-board/task-board.component')
      .then(m => m.TaskBoardComponent)
  },
  {
    path: 'applications/my',
    canActivate: [authGuard],
    loadComponent: () => import('./features/applications/my-applications/my-applications.component')
      .then(m => m.MyApplicationsComponent)
  },
  {
    path: 'applications/review',
    canActivate: [authGuard, roleGuard(['Coordinator', 'OrganizationAdmin', 'SuperAdmin'])],
    loadComponent: () => import('./features/applications/applications-review/applications-review.component')
      .then(m => m.ApplicationsReviewComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['SuperAdmin'])],
    children: [
      {
        path: 'initiatives',
        loadComponent: () =>
          import('./features/admin/initiatives-admin/initiatives-admin.component')
            .then(m => m.InitiativesAdminComponent)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users-admin/users-admin.component')
            .then(m => m.UsersAdminComponent)
      },
      { path: '', redirectTo: 'initiatives', pathMatch: 'full' }
    ]
  },
  {
    path: 'apply',
    canActivate: [authGuard],
    loadComponent: () => import('./features/apply/apply.component').then(m => m.ApplyComponent)
  },
  { path: '**', redirectTo: '' }
];
