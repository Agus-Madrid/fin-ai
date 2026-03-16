import { Injectable, signal } from '@angular/core';

export type NotificationTone = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AppNotificationInput {
  id: string;
  tone: NotificationTone;
  title: string;
  message: string;
}

export interface AppNotification extends AppNotificationInput {
  id: string;
  source: string;
  updatedAt: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  private readonly notificationsBySource = new Map<string, AppNotification[]>();
  readonly notifications = signal<AppNotification[]>([]);

  setSourceNotifications(source: string, notifications: AppNotificationInput[]): void {
    const now = Date.now();
    const scoped = notifications.map((notification) => ({
      ...notification,
      id: `${source}:${notification.id}`,
      source,
      updatedAt: now
    }));

    this.notificationsBySource.set(source, scoped);
    this.syncNotifications();
  }

  clearSource(source: string): void {
    if (!this.notificationsBySource.has(source)) {
      return;
    }

    this.notificationsBySource.delete(source);
    this.syncNotifications();
  }

  private syncNotifications(): void {
    const merged = Array.from(this.notificationsBySource.values())
      .flat()
      .sort((left, right) => right.updatedAt - left.updatedAt);
    this.notifications.set(merged);
  }
}
