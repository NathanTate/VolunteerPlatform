import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { GetMyNotificationsResult } from '../../shared/models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/notifications`;

  getMy(page = 1, pageSize = 30) {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http
      .get<ApiResponse<GetMyNotificationsResult>>(`${this.url}/my`, { params })
      .pipe(map(r => r.data!));
  }

  markRead(id: string) {
    return this.http.post<ApiResponse<void>>(`${this.url}/${id}/read`, {});
  }

  markAllRead() {
    return this.http.post<ApiResponse<void>>(`${this.url}/read-all`, {});
  }
}
