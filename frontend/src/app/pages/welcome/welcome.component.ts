import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BackgroundBeamsComponent } from '../../components/background-beams/background-beams.component';
import { AuthService } from '../../services/auth.service';

/**
 * Welcome Page Component
 * 
 * Landing page displayed after user signs in.
 * Features:
 * - Personalized greeting with username
 * - Animated background beams effect
 * - Quick action cards for navigation
 * - Feature highlights
 * 
 * Route: /home
 */
@Component({
    selector: 'app-welcome',
    imports: [CommonModule, RouterLink, BackgroundBeamsComponent],
    templateUrl: './welcome.component.html',
    styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent {
  /** Current user's username for personalized greeting */
  username: string = '';

  constructor(private authService: AuthService) {
    // Get username from auth service, fallback to 'User' if not available
    this.username = this.authService.getUsername() || 'User';
  }
}
