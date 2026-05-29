export type InitiativeCategory = 'Environmental' | 'Social' | 'Medical' | 'Educational' | 'Other';
export type InitiativeStatus = 'Active' | 'Planned' | 'Completed' | 'Archived' | 'Cancelled';
export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface InitiativeDto {
  id: string;
  title: string;
  description: string;
  category: InitiativeCategory;
  urgencyLevel: UrgencyLevel;
  status: InitiativeStatus;
  startDate: string;
  endDate?: string;
  latitude: number;
  longitude: number;
  address: string;
  radiusKm: number;
  requiredVolunteers: number;
  maxParticipants: number;
  currentParticipants: number;
  isEmergency: boolean;
  organizerId: string;
  organizerName: string;
  createdAt: string;
  updatedAt: string;
  distanceKm?: number;
  imageUrls: string[];
  tasksTotal: number;
  tasksCompleted: number;
}

export interface InitiativeMapDto {
  id: string;
  title: string;
  category: InitiativeCategory;
  status: InitiativeStatus;
  urgencyLevel: UrgencyLevel;
  isEmergency: boolean;
  latitude: number;
  longitude: number;
  radiusKm: number;
  coverImageUrl?: string;
  distanceKm?: number;
}

export interface PaginatedList<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface InitiativeFilters {
  page: number;
  pageSize: number;
  category?: InitiativeCategory;
  status?: InitiativeStatus;
  urgencyLevel?: UrgencyLevel;
  isEmergency?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'distance' | 'urgency' | 'participants';
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export interface CreateInitiativeRequest {
  title: string;
  description: string;
  category: InitiativeCategory;
  urgencyLevel: UrgencyLevel;
  startDate: string;
  endDate?: string;
  latitude: number;
  longitude: number;
  address: string;
  radiusKm: number;
  requiredVolunteers: number;
  maxParticipants: number;
  isEmergency: boolean;
  imageUrls: string[];
}
