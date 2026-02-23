import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
  readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Review Inbox', route: '/review-inbox' },
    { label: 'Transactions', route: '/transactions' },
    { label: 'Uploads', route: '/uploads' },
    { label: 'Budget Planner', route: '/budget-planner' }
  ];
}
