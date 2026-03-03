import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AppHeaderComponent } from '../components/app-header/app-header.component';
import { AppFooterComponent } from '../components/app-footer/app-footer.component';
import { CollapsibleSidebarComponent } from '../components/collapsible-sidebar/collapsible-sidebar.component';
import { BackendStatusComponent } from '../components/backend-status/backend-status.component';

@Component({
  selector: 'app-navigation',
  imports: [CommonModule, RouterOutlet, AppHeaderComponent, AppFooterComponent, CollapsibleSidebarComponent, BackendStatusComponent],
  templateUrl: './navigation.html',
  styleUrls: ['./navigation.css']
})
export class NavigationComponent implements OnInit, OnDestroy {
  isSidebarExpanded = false;
  isMobile = false;

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.checkScreenSize();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 1200;
  }

  onSidebarToggle(expanded: boolean) {
    this.isSidebarExpanded = expanded;
  }


}
