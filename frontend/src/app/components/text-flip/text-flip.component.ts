import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-text-flip',
    imports: [CommonModule],
    templateUrl: './text-flip.component.html',
    styleUrls: ['./text-flip.component.css']
})
export class TextFlipComponent implements OnInit, OnDestroy {
  @Input() words: string[] = ['Better', 'Modern', 'Awesome', 'Professional'];
  @Input() interval: number = 3000;
  @Input() animationDuration: number = 700;

  currentWordIndex: number = 0;
  currentWord: string = '';
  letters: string[] = [];
  private intervalId: any;

  ngOnInit() {
    this.updateWord();
    this.startAnimation();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private startAnimation() {
    this.intervalId = setInterval(() => {
      this.currentWordIndex = (this.currentWordIndex + 1) % this.words.length;
      this.updateWord();
    }, this.interval);
  }

  private updateWord() {
    this.currentWord = this.words[this.currentWordIndex];
    this.letters = this.currentWord.split('');
  }

  getLetterDelay(index: number): string {
    return `${index * 0.02}s`;
  }
}
