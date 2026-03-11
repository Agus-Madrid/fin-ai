import { computed, Component, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';

interface NavItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [NgFor, RouterLink, RouterLinkActive],
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.scss'
})
export class TopNavComponent {
  private readonly authService = inject(AuthService);

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

  onSignOut(): void {
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
