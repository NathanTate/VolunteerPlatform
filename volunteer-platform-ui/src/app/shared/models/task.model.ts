export type TaskStatus = 'Pending' | 'Accepted' | 'InProgress' | 'Completed' | 'Verified' | 'Rejected';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface TaskCommentDto {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface TaskHistoryDto {
  id: string;
  changedByName: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  note?: string;
  changedAt: string;
}

export interface TaskAttachmentDto {
  id: string;
  fileName: string;
  url: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedByName: string;
  uploadedAt: string;
}

export interface TaskDto {
  id: string;
  initiativeId: string;
  initiativeTitle: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  createdById: string;
  createdByName: string;
  initiativeOrganizerId: string;
  deadline?: string;
  completionProofUrl?: string;
  verificationNote?: string;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  comments: TaskCommentDto[];
  history: TaskHistoryDto[];
  attachments: TaskAttachmentDto[];
}

export interface TaskSummaryDto {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedVolunteerName?: string;
  deadline?: string;
  isOverdue: boolean;
}

export interface CreateTaskRequest {
  initiativeId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  deadline?: string;
}

export interface UpdateTaskStatusRequest {
  newStatus: TaskStatus;
  note?: string;
  completionProofUrl?: string;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  Pending: 'Очікує',
  Accepted: 'Прийнято',
  InProgress: 'Виконується',
  Completed: 'Виконано',
  Verified: 'Перевірено',
  Rejected: 'Відхилено'
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  Pending: '#9e9e9e',
  Accepted: '#2196f3',
  InProgress: '#ff9800',
  Completed: '#4caf50',
  Verified: '#1b5e20',
  Rejected: '#f44336'
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  Low: '#81c784',
  Medium: '#ffb74d',
  High: '#ef5350',
  Critical: '#b71c1c'
};
