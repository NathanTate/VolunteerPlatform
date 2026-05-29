import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CreateTaskRequest, TaskDto, TaskSummaryDto,
  TaskStatus, UpdateTaskStatusRequest
} from '../../shared/models/task.model';
import { ApiResponse } from '../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly url = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getForInitiative(initiativeId: string, status?: TaskStatus) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http
      .get<ApiResponse<TaskSummaryDto[]>>(
        `${this.url}/tasks/initiatives/${initiativeId}/tasks`, { params })
      .pipe(map(r => r.data!));
  }

  getMyTasks(status?: TaskStatus) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http
      .get<ApiResponse<TaskSummaryDto[]>>(`${this.url}/tasks/my`, { params })
      .pipe(map(r => r.data!));
  }

  getById(id: string) {
    return this.http
      .get<ApiResponse<TaskDto>>(`${this.url}/tasks/${id}`)
      .pipe(map(r => r.data!));
  }

  create(data: CreateTaskRequest) {
    return this.http
      .post<ApiResponse<string>>(`${this.url}/tasks`, data)
      .pipe(map(r => r.data!));
  }

  assign(taskId: string, volunteerId: string) {
    return this.http
      .post<ApiResponse<void>>(`${this.url}/tasks/${taskId}/assign`, { volunteerId });
  }

  updateStatus(taskId: string, data: UpdateTaskStatusRequest) {
    return this.http
      .post<ApiResponse<void>>(`${this.url}/tasks/${taskId}/status`, data);
  }

  addComment(taskId: string, text: string) {
    return this.http
      .post<ApiResponse<string>>(`${this.url}/tasks/${taskId}/comments`, { text })
      .pipe(map(r => r.data!));
  }
}
