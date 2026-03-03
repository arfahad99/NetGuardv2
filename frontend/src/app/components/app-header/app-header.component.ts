import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css']
})
export class AppHeaderComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  isMobile = false;
  isTablet = false;
  isDesktop = false;

  isHidden = false;
  private lastScrollPosition = 0;

  private destroy$ = new Subject<void>();
  private touchStartTime = 0;
  private touchStartX = 0;
  private touchStartY = 0;

  constructor(
    public authService: AuthService,
    public router: Router
  ) { }

  ngOnInit() {
    // Initialize responsive state
    this.updateResponsiveState();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.updateResponsiveState();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    // Determine scroll direction
    if (currentScrollPosition > this.lastScrollPosition && currentScrollPosition > 50) {
      this.isHidden = true; // Scrolling down
    } else {
      this.isHidden = false; // Scrolling up
    }

    this.lastScrollPosition = currentScrollPosition;
  }

  logout() {
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const mobileMenuBtn = target.closest('.mobile-menu-btn');

    // Close mobile menu if clicking outside (but not on the button itself)
    if (!mobileMenuBtn && this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
      this.notifySidebarToggle();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Close mobile menu on Escape key
    if (event.key === 'Escape' && this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
      this.notifySidebarToggle();
      event.preventDefault();
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.touchStartTime = Date.now();
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    if (event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - this.touchStartTime;
      const touchDistanceX = Math.abs(touch.clientX - this.touchStartX);
      const touchDistanceY = Math.abs(touch.clientY - this.touchStartY);

      // Detect tap vs swipe (tap should be quick and minimal movement)
      const isTap = touchDuration < 300 && touchDistanceX < 10 && touchDistanceY < 10;

      if (isTap) {
        this.handleTouchTap(event);
      }
    }
  }

  private updateResponsiveState() {
    const width = window.innerWidth;
    this.isMobile = width < 768;
    this.isTablet = width >= 768 && width < 1024;
    this.isDesktop = width >= 1024;
  }



  private handleTouchTap(event: TouchEvent) {
    const target = event.target as HTMLElement;

    // Add touch feedback for interactive elements
    if (target.closest('.nav-tab')) {
      target.style.transform = 'scale(0.95)';
      setTimeout(() => {
        target.style.transform = '';
      }, 150);
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.notifySidebarToggle();

    // Provide haptic feedback on mobile devices
    if ((this.isMobile || this.isTablet) && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }
  }

  private notifySidebarToggle() {
    // Emit custom event to communicate with sidebar
    const event = new CustomEvent('mobileMenuToggle', {
      detail: { isOpen: this.isMobileMenuOpen }
    });
    window.dispatchEvent(event);
  }

  // Utility methods for template
  get screenSize(): string {
    if (this.isMobile) return 'mobile';
    if (this.isTablet) return 'tablet';
    return 'desktop';
  }

  get isSmallScreen(): boolean {
    return window.innerWidth < 640;
  }

  get isMediumScreen(): boolean {
    return window.innerWidth >= 640 && window.innerWidth < 1024;
  }

  get isLargeScreen(): boolean {
    return window.innerWidth >= 1024;
  }

  // Navigation helper for mobile
  navigateAndCloseMenu(route: string) {
    this.router.navigate([route]);
    if (this.isMobile) {
      // Add slight delay for better UX on mobile
      setTimeout(() => {
        // Could close mobile menu if we had one
      }, 100);
    }
  }



  // Performance optimization for change detection
  trackByNavItem(index: number, item: any): any {
    return item.route || index;
  }

  // Check if we need compact navigation (when admin has access to user management)
  needsCompactNavigation(): boolean {
    const screenWidth = window.innerWidth;
    const hasAdminAccess = this.authService.isAdmin();

    // Use compact mode based on screen width and admin access
    if (screenWidth < 768) {
      return true; // Always compact on mobile
    } else if (screenWidth < 1024) {
      return true; // Always compact on tablet
    } else if (screenWidth < 1440) {
      return hasAdminAccess; // Compact on desktop if admin
    } else if (screenWidth < 1600) {
      return hasAdminAccess; // Compact on large desktop if admin
    }

    return false; // No compact mode on very large screens (1600px+)
  }

  // Get navigation label (shorter for compact mode)
  getNavLabel(fullLabel: string): string {
    const screenWidth = window.innerWidth;
    const hasAdminAccess = this.authService.isAdmin();

    // Use ultra-short labels for very small screens or when admin with many tabs
    if (screenWidth < 640 || (hasAdminAccess && screenWidth < 1200)) {
      const ultraShortLabels: { [key: string]: string } = {
        'Dashboard': 'Dash',
        'Network Health': 'Net',
        'QoS Events': 'QoS',
        'Sessions': 'Sess',
        'User Management': 'Users'
      };
      return ultraShortLabels[fullLabel] || fullLabel;
    }

    // Use short labels for compact mode
    if (this.needsCompactNavigation()) {
      const shortLabels: { [key: string]: string } = {
        'Dashboard': 'Dashboard',
        'Network Health': 'Network',
        'QoS Events': 'QoS Events',
        'Sessions': 'Sessions',
        'User Management': 'Users'
      };
      return shortLabels[fullLabel] || fullLabel;
    }

    return fullLabel;
  }
}