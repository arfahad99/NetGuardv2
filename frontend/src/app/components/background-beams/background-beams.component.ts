import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Configuration options for each animated beam
 */
interface BeamOptions {
  /** Initial X position in pixels */
  initialX: number;
  /** X translation distance */
  translateX: number;
  /** Animation duration in seconds */
  duration: number;
  /** Delay before repeating animation in seconds */
  repeatDelay: number;
  /** Initial delay before starting animation in seconds */
  delay?: number;
  /** CSS class for beam height (h-6, h-12, h-20) */
  className?: string;
}

/**
 * Collision detection state for beam-container interactions
 */
interface Collision {
  /** Whether a collision has been detected */
  detected: boolean;
  /** Coordinates of the collision point */
  coordinates: { x: number; y: number } | null;
}

/**
 * Background Beams Component
 * 
 * Creates an animated background with falling beams that detect collisions
 * and create explosion effects. Inspired by modern UI design patterns.
 * 
 * Features:
 * - Multiple animated beams with different speeds and heights
 * - Collision detection with explosion effects
 * - Particle animations on collision
 * - Automatic cleanup of intervals and timeouts
 * - Dark/Light mode compatible
 */
@Component({
    selector: 'app-background-beams',
    imports: [CommonModule],
    templateUrl: './background-beams.component.html',
    styleUrls: ['./background-beams.component.css']
})
export class BackgroundBeamsComponent implements AfterViewInit, OnDestroy {
  /** Optional CSS class for container customization */
  @Input() className: string = '';
  
  /** Reference to the collision detection container */
  @ViewChild('container', { static: false }) containerRef!: ElementRef<HTMLDivElement>;
  
  /** Reference to the parent container for coordinate calculations */
  @ViewChild('parent', { static: false }) parentRef!: ElementRef<HTMLDivElement>;
  
  /** Pre-calculated particle directions to avoid expression changed errors */
  particleDirections: Array<{x: string, y: string}> = [];

  /** Configuration for all animated beams */
  beams: BeamOptions[] = [
    { initialX: 10, translateX: 10, duration: 7, repeatDelay: 3, delay: 2 },
    { initialX: 600, translateX: 600, duration: 3, repeatDelay: 3, delay: 4 },
    { initialX: 100, translateX: 100, duration: 7, repeatDelay: 7, className: 'h-6' },
    { initialX: 400, translateX: 400, duration: 5, repeatDelay: 14, delay: 4 },
    { initialX: 800, translateX: 800, duration: 11, repeatDelay: 2, className: 'h-20' },
    { initialX: 1000, translateX: 1000, duration: 4, repeatDelay: 2, className: 'h-12' },
    { initialX: 1200, translateX: 1200, duration: 6, repeatDelay: 4, delay: 2, className: 'h-6' }
  ];

  /** Runtime state for each beam including collision detection */
  beamStates: Array<{
    beam: BeamOptions;
    collision: Collision;
    animating: boolean;
    key: number;
  }> = [];

  /** Active interval IDs for cleanup */
  private intervals: number[] = [];
  
  /** Active timeout IDs for cleanup */
  private timeouts: number[] = [];

  ngAfterViewInit() {
    this.generateParticleDirections();
    this.initializeBeams();
  }

  /**
   * Cleanup method to prevent memory leaks
   * Clears all active intervals and timeouts
   */
  ngOnDestroy() {
    this.intervals.forEach(id => clearInterval(id));
    this.timeouts.forEach(id => clearTimeout(id));
  }

  /**
   * Initializes all beams and starts animations
   */
  private initializeBeams() {
    this.beamStates = this.beams.map(beam => ({
      beam: {
        ...beam,
        className: beam.className || '' // Ensure className is never undefined
      },
      collision: { detected: false, coordinates: null },
      animating: false,
      key: 0
    }));

    this.beamStates.forEach((_, index) => this.startBeamAnimation(index));
  }

  /**
   * Starts beam animation with initial delay
   */
  private startBeamAnimation(index: number) {
    const delay = (this.beamStates[index].beam.delay || 0) * 1000;
    const timeoutId = window.setTimeout(() => {
      this.beamStates[index].animating = true;
      this.animateBeam(index);
    }, delay);
    this.timeouts.push(timeoutId);
  }

  /**
   * Main animation loop for a beam
   * Handles collision detection and animation repetition
   */
  private animateBeam(index: number) {
    const state = this.beamStates[index];

    const animate = () => {
      state.key++;
      state.animating = true;
      
      // Check for collision every 50ms during animation
      const checkInterval = window.setInterval(() => this.checkCollision(index), 50);
      this.intervals.push(checkInterval);

      // Stop animation after duration
      const resetTimeout = window.setTimeout(() => {
        clearInterval(checkInterval);
        state.animating = false;
        
        // Repeat animation after delay
        const repeatTimeout = window.setTimeout(animate, state.beam.repeatDelay * 1000);
        this.timeouts.push(repeatTimeout);
      }, state.beam.duration * 1000);

      this.timeouts.push(resetTimeout);
    };

    animate();
  }

  /**
   * Checks if beam hit the bottom container
   */
  private checkCollision(index: number) {
    const state = this.beamStates[index];
    if (state.collision.detected) return;

    const beamElement = document.getElementById(`beam-${index}`);
    if (!beamElement || !this.containerRef || !this.parentRef) return;

    const beamRect = beamElement.getBoundingClientRect();
    const containerRect = this.containerRef.nativeElement.getBoundingClientRect();

    if (beamRect.bottom >= containerRect.top) {
      const parentRect = this.parentRef.nativeElement.getBoundingClientRect();
      state.collision = {
        detected: true,
        coordinates: {
          x: beamRect.left - parentRect.left + beamRect.width / 2,
          y: beamRect.bottom - parentRect.top
        }
      };

      // Reset collision after 2 seconds
      const resetTimeout = window.setTimeout(() => {
        state.collision = { detected: false, coordinates: null };
      }, 2000);
      this.timeouts.push(resetTimeout);
    }
  }

  getBeamStyle(state: any) {
    return {
      left: `${state.beam.initialX}px`,
      animationDuration: `${state.beam.duration}s`,
      animationDelay: `${state.beam.delay || 0}s`
    };
  }

  getExplosionStyle(coordinates: { x: number; y: number }) {
    return {
      left: `${coordinates.x}px`,
      top: `${coordinates.y}px`,
      transform: 'translate(-50%, -50%)'
    };
  }

  /**
   * Generate random particle directions once to avoid expression changed errors
   */
  private generateParticleDirections() {
    this.particleDirections = Array.from({length: 20}, () => ({
      x: (Math.random() * 80 - 40) + 'px',
      y: (Math.random() * -50 - 10) + 'px'
    }));
  }

  trackByIndex(index: number): number {
    return index;
  }
}
