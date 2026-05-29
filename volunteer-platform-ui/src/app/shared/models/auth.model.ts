export type UserRole = 'Guest' | 'Volunteer' | 'Coordinator' | 'OrganizationAdmin' | 'SuperAdmin' | 'Admin';

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVolunteerConfirmed: boolean;
  isOrganizationApproved: boolean;
  organizationName?: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  userId?: string;
  role?: UserRole;
  isOrganizationApproved?: boolean;
  organizationName?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string
}
