import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ThemeToggleComponent } from '../components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ThemeToggleComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {
  username = '';

  constructor(private authService: AuthService, private router: Router, private toast: ToastService) {
    this.username = this.authService.getUsername() || 'User';
  }

  signout() {
    this.authService.signout().subscribe({
      next: () => {
        this.toast.success('Signed out successfully');
        this.router.navigate(['/signin']);
      },
      error: () => {
        localStorage.clear();
        this.router.navigate(['/signin']);
      }
    });
  }
}
