import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CreateInitiativeRequest, InitiativeDto, InitiativeFilters,
  InitiativeMapDto, PaginatedList
} from '../../shared/models/initiative.model';
import { ApiResponse } from '../../shared/models/api-response.model';
import { VolunteerRecommendationDto } from '../../shared/models/volunteer-recommendation.model';

@Injectable({ providedIn: 'root' })
export class InitiativesService {
  private readonly url = `${environment.apiUrl}/initiatives`;

  constructor(private http: HttpClient) {}

  getAll(filters: InitiativeFilters) {
    let params = new HttpParams()
      .set('page', filters.page)
      .set('pageSize', filters.pageSize);

    if (filters.category) params = params.set('category', filters.category);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.urgencyLevel) params = params.set('urgencyLevel', filters.urgencyLevel);
    if (filters.isEmergency != null) params = params.set('isEmergency', String(filters.isEmergency));
    if (filters.search) params = params.set('search', filters.search);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.lat != null) params = params.set('lat', filters.lat);
    if (filters.lng != null) params = params.set('lng', filters.lng);
    if (filters.radiusKm != null) params = params.set('radiusKm', filters.radiusKm);

    return this.http.get<ApiResponse<PaginatedList<InitiativeDto>>>(this.url, { params })
      .pipe(map(r => r.data!));
  }

  getById(id: string) {
    return this.http.get<ApiResponse<InitiativeDto>>(`${this.url}/${id}`)
      .pipe(map(r => r.data!));
  }

  getMapPoints() {
    return this.http.get<ApiResponse<InitiativeMapDto[]>>(`${this.url}/map`)
      .pipe(map(r => r.data!));
  }

  getNearby(lat: number, lng: number, radiusKm = 10) {
    const params = new HttpParams()
      .set('lat', lat).set('lng', lng).set('radiusKm', radiusKm);
    return this.http.get<ApiResponse<InitiativeMapDto[]>>(`${this.url}/nearby`, { params })
      .pipe(map(r => r.data!));
  }

  create(data: CreateInitiativeRequest) {
    return this.http.post<ApiResponse<string>>(this.url, data).pipe(map(r => r.data!));
  }

  update(id: string, data: CreateInitiativeRequest & { status: string }) {
    return this.http.put<ApiResponse<void>>(`${this.url}/${id}`, data);
  }

  archive(id: string) {
    return this.http.post<ApiResponse<void>>(`${this.url}/${id}/archive`, {});
  }

  delete(id: string) {
    return this.http.delete<ApiResponse<void>>(`${this.url}/${id}`);
  }

  triggerEmergencyAlert(initiativeId: string, customMessage?: string) {
    return this.http
      .post<ApiResponse<number>>(`${this.url}/${initiativeId}/emergency-alert`, { customMessage: customMessage ?? null })
      .pipe(map(r => r.data!));
  }

  getRecommendedVolunteers(initiativeId: string, topN = 10) {
    const params = new HttpParams().set('topN', topN);
    return this.http
      .get<ApiResponse<VolunteerRecommendationDto[]>>(
        `${this.url}/${initiativeId}/recommended-volunteers`, { params }
      )
      .pipe(map(r => r.data!));
  }

  inviteVolunteer(initiativeId: string, volunteerId: string) {
    return this.http.post<ApiResponse<object>>(
      `${this.url}/${initiativeId}/invite-volunteer/${volunteerId}`, {}
    );
  }
}
