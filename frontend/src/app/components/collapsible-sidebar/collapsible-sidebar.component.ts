import { Component, OnInit, OnDestroy, OnChanges, HostListener, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-collapsible-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './collapsible-sidebar.component.html',
  styleUrls: ['./collapsible-sidebar.component.css']
})
export class CollapsibleSidebarComponent implements OnInit, OnDestroy, OnChanges {
  @Output() sidebarToggle = new EventEmitter<boolean>();
  @Input() externalToggle = false;

  isExpanded = false;
  isMobile = false;
  showMobileMenu = false;
  isDarkMode = true;
  isUserDropdownOpen = false;

  private destroy$ = new Subject<void>();

  constructor(
    public authService: AuthService,
    private themeService: ThemeService,
    private router: Router
  ) { }

  ngOnInit() {
    // Subscribe to theme changes
    this.themeService.isDarkMode$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isDark => {
      this.isDarkMode = isDark;
    });

    // Check initial screen size
    this.checkScreenSize();

    // Listen for mobile menu toggle from header
    window.addEventListener('mobileMenuToggle', this.handleMobileMenuToggle.bind(this));
  }

  ngOnChanges() {
    // Handle external toggle from header burger menu
    if (this.externalToggle !== undefined) {
      if (this.isMobile) {
        this.showMobileMenu = this.externalToggle;
      } else {
        this.isExpanded = this.externalToggle;
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // Remove event listener
    window.removeEventListener('mobileMenuToggle', this.handleMobileMenuToggle.bind(this));
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;

    // Close user dropdown if clicking outside
    if (!target.closest('.user-info') && this.isUserDropdownOpen) {
      this.isUserDropdownOpen = false;
    }

    // Close mobile menu if clicking outside
    if (this.isMobile && this.showMobileMenu && !target.closest('.collapsible-sidebar') && !target.closest('.mobile-menu-btn')) {
      this.showMobileMenu = false;
    }
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 1200;
    if (!this.isMobile) {
      this.showMobileMenu = false;
    }
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.showMobileMenu = !this.showMobileMenu;
    } else {
      this.isExpanded = !this.isExpanded;
      this.sidebarToggle.emit(this.isExpanded);
    }
  }

  closeSidebar() {
    if (this.isMobile) {
      this.showMobileMenu = false;
    } else {
      this.isExpanded = false;
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleUserDropdown() {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  signOut() {
    this.isUserDropdownOpen = false;
    this.authService.logout();
  }

  navigateAndClose(route: string) {
    this.router.navigate([route]);
    if (this.isMobile) {
      this.showMobileMenu = false;
    }
  }

  getUsername(): string {
    return this.authService.getUsername() || 'User';
  }

  getRoleDisplay(): string {
    return this.authService.getRoleDisplayName();
  }

  // Navigation items
  get navigationItems() {
    const items = [
      { route: '/home', icon: 'bi-house-fill', label: 'Home' },
      { route: '/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
      { route: '/devices', icon: 'bi-pc-display', label: 'Devices' },
      { route: '/alerts', icon: 'bi-bell-fill', label: 'Alerts' },
      { route: '/network-health', icon: 'bi-activity', label: 'Network Health' },
      { route: '/qos-events', icon: 'bi-speedometer2', label: 'QoS Events' },
      { route: '/sessions', icon: 'bi-clock-history', label: 'Sessions' },
      { route: '/cloud-health', icon: 'bi-cloud-check-fill', label: 'Cloud Health' }
    ];

    // Add admin-only items
    if (this.authService.isAdmin()) {
      items.push({ route: '/manage-users', icon: 'bi-people-fill', label: 'User Management' });
    }

    return items;
  }

  // Performance optimization for change detection
  trackByNavItem(index: number, item: any): any {
    return item.route || index;
  }

  // Handle mobile menu toggle from header
  private handleMobileMenuToggle(event: any) {
    if (this.isMobile) {
      this.showMobileMenu = event.detail.isOpen;
    }
  }
}
