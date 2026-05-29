import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';

export interface DashboardStatsDto {
  // Initiatives
  activeInitiatives: number;
  plannedInitiatives: number;
  completedInitiatives: number;
  emergencyInitiatives: number;
  totalInitiatives: number;

  // Volunteers
  totalVolunteers: number;

  // Tasks
  tasksPending: number;
  tasksAccepted: number;
  tasksInProgress: number;
  tasksCompleted: number;
  tasksVerified: number;
  tasksRejected: number;
  tasksOverdue: number;
  tasksCompletedToday: number;
  totalTasks: number;

  generatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/dashboard`;

  getStats() {
    return this.http
      .get<ApiResponse<DashboardStatsDto>>(`${this.url}/stats`)
      .pipe(map(r => r.data!));
  }
}
