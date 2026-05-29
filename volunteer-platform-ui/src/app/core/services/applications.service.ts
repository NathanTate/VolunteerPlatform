import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApplicationDto } from '../../shared/models/application.model';
import { ApiResponse } from '../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private readonly url = `${environment.apiUrl}/applications`;

  constructor(private http: HttpClient) {}

  submit(initiativeId: string, comment?: string) {
    return this.http.post<ApiResponse<string>>(this.url, { initiativeId, comment })
      .pipe(map(r => r.data!));
  }

  getMine() {
    return this.http.get<ApiResponse<ApplicationDto[]>>(`${this.url}/my`)
      .pipe(map(r => r.data!));
  }

  getAll() {
    return this.http.get<ApiResponse<ApplicationDto[]>>(this.url)
      .pipe(map(r => r.data!));
  }

  getForInitiative(initiativeId: string) {
    return this.http.get<ApiResponse<ApplicationDto[]>>(`${this.url}/initiative/${initiativeId}`)
      .pipe(map(r => r.data!));
  }

  approve(id: string) {
    return this.http.put<ApiResponse<void>>(`${this.url}/${id}/approve`, {});
  }

  reject(id: string) {
    return this.http.put<ApiResponse<void>>(`${this.url}/${id}/reject`, {});
  }
}
