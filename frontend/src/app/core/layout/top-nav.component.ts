import { computed, Component, inject, signal } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NotificationCenterService, NotificationTone } from '../notifications/notification-center.service';

interface NavItem {
  label: string;
  route: string;
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
