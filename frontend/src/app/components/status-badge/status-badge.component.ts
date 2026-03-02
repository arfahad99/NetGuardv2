import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Status Badge Component
 * 
 * Displays status with appropriate icon and color using @switch directive
 * Fully responsive with different sizes and mobile-optimized display
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.css']
})
export class StatusBadgeComponent {
  @Input() status: 'online' | 'offline' | 'warning' | 'active' | 'critical' | string = 'unknown';
  @Input() label?: string;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  
  get badgeClasses(): string {
    const validStatuses = ['online', 'offline', 'warning', 'active', 'critical'];
    const statusClass = validStatuses.includes(this.status) ? `badge-${this.status}` : 'badge-secondary';
    return `badge badge-status ${statusClass} badge-${this.size}`;
  }
}
