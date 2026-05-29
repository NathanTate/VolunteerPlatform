export type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ApplicationDto {
  id: string;
  initiativeId: string;
  initiativeTitle: string;
  userId: string;
  userName: string;
  status: ApplicationStatus;
  comment?: string;
  submittedAt: string;
}
