import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
    selector: 'app-stateful-button',
    imports: [CommonModule],
    templateUrl: './stateful-button.component.html',
    styleUrls: ['./stateful-button.component.css'],
    animations: [
        trigger('buttonState', [
            state('idle', style({ minWidth: '120px' })),
            state('loading', style({ minWidth: '120px' })),
            state('success', style({ minWidth: '120px' })),
            transition('* => *', animate('200ms ease-in-out'))
        ]),
        trigger('iconFade', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0)' }),
                animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0)' }))
            ])
        ])
    ]
})
export class StatefulButtonComponent {
  @Input() className: string = '';
  @Input() disabled: boolean = false;
  @Output() buttonClick = new EventEmitter<void>();

  buttonState: 'idle' | 'loading' | 'success' = 'idle';

  async handleClick() {
    if (this.buttonState !== 'idle' || this.disabled) return;

    this.buttonState = 'loading';
    
    try {
      // Emit the click event and wait for the parent to handle it
      this.buttonClick.emit();
      
      // Wait for the async operation (simulated here, parent should handle actual logic)
      await this.waitForCompletion();
      
      this.buttonState = 'success';
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        this.buttonState = 'idle';
      }, 2000);
    } catch (error) {
      this.buttonState = 'idle';
    }
  }

  private waitForCompletion(): Promise<void> {
    // This is a placeholder - in real usage, parent component handles the async operation
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  get isLoading(): boolean {
    return this.buttonState === 'loading';
  }

  get isSuccess(): boolean {
    return this.buttonState === 'success';
  }

  get isIdle(): boolean {
    return this.buttonState === 'idle';
  }
}
