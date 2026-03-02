import { Directive, ElementRef, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appMovingBorder]',
  standalone: true
})
export class MovingBorderDirective implements OnInit, OnDestroy {
  @Input() borderRadius: string = '1.75rem';
  @Input() duration: number = 3000;
  @Input() borderColor: string = '#0ea5e9';

  private animationId: number | null = null;
  private svgElement: SVGSVGElement | null = null;
  private pathElement: SVGRectElement | null = null;
  private movingDot: HTMLDivElement | null = null;
  private wrapper: HTMLDivElement | null = null;
  private startTime: number = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  ngOnInit() {
    this.setupMovingBorder();
    this.startAnimation();
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private setupMovingBorder() {
    const button = this.el.nativeElement;

    // Store original button styles
    const originalPosition = window.getComputedStyle(button).position;

    // Make button position relative if it's not already positioned
    if (originalPosition === 'static') {
      this.renderer.setStyle(button, 'position', 'relative');
    }

    // Add overflow hidden
    this.renderer.setStyle(button, 'overflow', 'hidden');

    // Create wrapper for border effect
    this.wrapper = this.renderer.createElement('div');
    this.renderer.addClass(this.wrapper, 'moving-border-wrapper');
    this.renderer.setStyle(this.wrapper, 'position', 'absolute');
    this.renderer.setStyle(this.wrapper, 'inset', '0');
    this.renderer.setStyle(this.wrapper, 'border-radius', `calc(${this.borderRadius} * 0.96)`);
    this.renderer.setStyle(this.wrapper, 'pointer-events', 'none');

    // Create SVG for path
    this.svgElement = this.renderer.createElement('svg', 'svg');
    this.renderer.setAttribute(this.svgElement, 'xmlns', 'http://www.w3.org/2000/svg');
    this.renderer.setAttribute(this.svgElement, 'preserveAspectRatio', 'none');
    this.renderer.setStyle(this.svgElement, 'position', 'absolute');
    this.renderer.setStyle(this.svgElement, 'width', '100%');
    this.renderer.setStyle(this.svgElement, 'height', '100%');
    this.renderer.setStyle(this.svgElement, 'top', '0');
    this.renderer.setStyle(this.svgElement, 'left', '0');

    // Create rect path
    this.pathElement = this.renderer.createElement('rect', 'svg');
    this.renderer.setAttribute(this.pathElement, 'fill', 'none');
    this.renderer.setAttribute(this.pathElement, 'width', '100%');
    this.renderer.setAttribute(this.pathElement, 'height', '100%');
    this.renderer.setAttribute(this.pathElement, 'rx', '30%');
    this.renderer.setAttribute(this.pathElement, 'ry', '30%');

    this.renderer.appendChild(this.svgElement, this.pathElement);
    this.renderer.appendChild(this.wrapper, this.svgElement);

    // Create moving dot
    this.movingDot = this.renderer.createElement('div');
    this.renderer.addClass(this.movingDot, 'moving-border-dot');
    this.renderer.setStyle(this.movingDot, 'position', 'absolute');
    this.renderer.setStyle(this.movingDot, 'top', '0');
    this.renderer.setStyle(this.movingDot, 'left', '0');
    this.renderer.setStyle(this.movingDot, 'width', '80px');
    this.renderer.setStyle(this.movingDot, 'height', '80px');
    this.renderer.setStyle(this.movingDot, 'background', `radial-gradient(${this.borderColor} 40%, transparent 60%)`);
    this.renderer.setStyle(this.movingDot, 'opacity', '0.8');
    this.renderer.setStyle(this.movingDot, 'pointer-events', 'none');

    this.renderer.appendChild(this.wrapper, this.movingDot);

    // Insert wrapper as first child of button
    this.renderer.insertBefore(button, this.wrapper, button.firstChild);

    // Add backdrop blur to button content
    this.renderer.setStyle(button, 'backdrop-filter', 'blur(12px)');
  }

  private startAnimation() {
    this.startTime = performance.now();
    this.animate();
  }

  private animate = () => {
    if (!this.pathElement || !this.movingDot) return;

    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;

    const length = this.pathElement.getTotalLength();
    const pxPerMillisecond = length / this.duration;
    const distance = (elapsed * pxPerMillisecond) % length;

    const point = this.pathElement.getPointAtLength(distance);

    if (this.movingDot) {
      this.renderer.setStyle(
        this.movingDot,
        'transform',
        `translateX(${point.x}px) translateY(${point.y}px) translateX(-50%) translateY(-50%)`
      );
    }

    this.animationId = requestAnimationFrame(this.animate);
  }
}
