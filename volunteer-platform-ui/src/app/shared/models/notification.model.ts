export type NotificationType =
  | 'NewInitiative'
  | 'TaskAssigned'
  | 'TaskUpdated'
  | 'ApplicationStatusChanged'
  | 'Emergency'
  | 'System';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
}

export interface GetMyNotificationsResult {
  items: NotificationDto[];
  unreadCount: number;
  hasMore: boolean;
}
