import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection?: HubConnection;

  applicationStatusChanged$ = new Subject<{ applicationId: string; status: string }>();
  newInitiativeCreated$ = new Subject<{ initiativeId: string; title: string }>();
  taskAssigned$ = new Subject<{ taskId: string; taskTitle: string }>();
  taskUpdated$ = new Subject<{ taskId: string; taskTitle: string; newStatus: string }>();
  emergencyInitiative$ = new Subject<{ initiativeId: string; title: string }>();
  dashboardUpdated$ = new Subject<void>();
  notificationReceived$ = new Subject<{
    type: string;
    title: string;
    message: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
  }>();

  emergencyAlert$ = new Subject<{
    title: string;
    message: string;
    initiativeId: string;
  }>();

  startConnection(token: string): void {
    if (this.hubConnection?.state === HubConnectionState.Connected) return;

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(environment.hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    this.hubConnection.on('ApplicationStatusChanged', (data) =>
      this.applicationStatusChanged$.next(data));
    this.hubConnection.on('NewInitiativeCreated', (data) =>
      this.newInitiativeCreated$.next(data));
    this.hubConnection.on('TaskAssigned', (data) =>
      this.taskAssigned$.next(data));
    this.hubConnection.on('TaskUpdated', (data) =>
      this.taskUpdated$.next(data));
    this.hubConnection.on('EmergencyInitiative', (data) =>
      this.emergencyInitiative$.next(data));
    this.hubConnection.on('DashboardUpdated', () =>
      this.dashboardUpdated$.next());
    this.hubConnection.on('Notification', (data: any) =>
      this.notificationReceived$.next(data));

    this.hubConnection.on('EmergencyAlert', (data: any) =>
      this.emergencyAlert$.next({
        title:        data.title,
        message:      data.message,
        initiativeId: data.relatedEntityId ?? ''
      }));

    this.hubConnection.start().catch(err => console.error('SignalR connection error:', err));

    this.hubConnection.onreconnecting(() =>
      console.warn('SignalR reconnecting...'));
    this.hubConnection.onreconnected(() =>
      console.info('SignalR reconnected.'));
    this.hubConnection.onclose(() =>
      console.warn('SignalR connection closed.'));
  }

  stopConnection(): void {
    this.hubConnection?.stop();
  }
}
