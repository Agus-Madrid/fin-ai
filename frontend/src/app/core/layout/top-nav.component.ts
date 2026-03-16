import { computed, Component, inject, signal } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { NavigationExtras, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import {
  AppNotification,
  NotificationCenterService,
  NotificationTone
} from '../notifications/notification-center.service';

interface NavItem {
  label: string;
  route: string;
}

interface NotificationNavigation {
  commands: string[];
  extras?: NavigationExtras;
}

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, RouterLink, RouterLinkActive],
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.scss'
})
export class TopNavComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationCenter = inject(NotificationCenterService);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Review Inbox', route: '/review-inbox' },
    { label: 'Transactions', route: '/transactions' },
    { label: 'Categories', route: '/categories' },
    { label: 'Uploads', route: '/uploads' },
    { label: 'Budget Planner', route: '/budget-planner' }
  ];

  readonly currentUser = this.authService.user;
  readonly avatarLabel = computed(() => this.buildAvatarLabel(this.currentUser()?.name));
  readonly notifications = this.notificationCenter.notifications;
  readonly hasNotifications = computed(() => this.notifications().length > 0);
  readonly notificationsOpen = signal(false);

  onToggleNotifications(): void {
    this.notificationsOpen.update((current) => !current);
  }

  onNotificationSelected(notification: AppNotification): void {
    this.notificationsOpen.set(false);

    const navigation = this.resolveNotificationNavigation(notification);
    if (!navigation) {
      return;
    }

    if (navigation.extras) {
      void this.router.navigate(navigation.commands, navigation.extras);
      return;
    }

    void this.router.navigate(navigation.commands);
  }

  getNotificationToneClass(tone: NotificationTone): string {
    if (tone === 'WARNING') {
      return 'app-top-nav__notification--warning';
    }
    if (tone === 'CRITICAL') {
      return 'app-top-nav__notification--critical';
    }
    return 'app-top-nav__notification--info';
  }

  onSignOut(): void {
    this.notificationsOpen.set(false);
    this.authService.signOut();
  }

  private resolveNotificationNavigation(notification: AppNotification): NotificationNavigation | null {
    if (notification.source === 'review-inbox-pending') {
      return {
        commands: ['/review-inbox']
      };
    }

    if (notification.source !== 'budget-savings') {
      return null;
    }

    const prefix = `${notification.source}:`;
    const alertId = notification.id.startsWith(prefix)
      ? notification.id.slice(prefix.length)
      : notification.id;

    if (alertId === 'goal-overdue' || alertId === 'no-recent-run-rate' || alertId === 'deadline-risk') {
      return {
        commands: ['/budget-planner'],
        extras: {
          queryParams: { tab: 'goals' },
          fragment: 'saving-goals-section'
        }
      };
    }

    return {
      commands: ['/budget-planner'],
      extras: {
        queryParams: { tab: 'monthly' },
        fragment: 'monthly-savings-section'
      }
    };
  }

  private buildAvatarLabel(name: string | undefined): string {
    if (!name) {
      return 'NA';
    }

    const words = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) {
      return 'NA';
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
}
