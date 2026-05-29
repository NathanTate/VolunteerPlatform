import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserDto, UserRole } from '../../shared/models/auth.model';
import { ApiResponse } from '../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly url = `${environment.apiUrl}/users`;
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<ApiResponse<UserDto[]>>(this.url)
      .pipe(map(r => r.data!));
  }

  updateRole(userId: string, role: UserRole) {
    return this.http.put<ApiResponse<void>>(`${this.url}/${userId}/role`, { role });
  }

  confirmVolunteer(userId: string, confirmed: boolean) {
    return this.http.put<ApiResponse<void>>(`${this.url}/${userId}/confirm-volunteer`, { confirmed });
  }

  approveOrganization(userId: string, approved: boolean) {
    return this.http.put<ApiResponse<void>>(`${this.url}/${userId}/approve-organization`, { approved });
  }

  setOrganizationName(userId: string, organizationName: string) {
    return this.http.put<ApiResponse<void>>(`${this.url}/${userId}/organization-name`, { organizationName });
  }

  getPendingCount() {
    return this.http.get<ApiResponse<number>>(`${this.url}/pending-count`)
      .pipe(map(r => r.data ?? 0));
  }
}
