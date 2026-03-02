import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MovingBorderDirective } from './moving-border.directive';

@Component({
    template: `<button appMovingBorder>Test Button</button>`,
    imports: [MovingBorderDirective]
})
class TestComponent { }

describe('MovingBorderDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let buttonEl: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent, MovingBorderDirective]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    buttonEl = fixture.debugElement.query(By.css('button'));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply directive to button', () => {
    const directive = buttonEl.injector.get(MovingBorderDirective);
    expect(directive).toBeTruthy();
  });

  it('should set position relative on button', () => {
    const button = buttonEl.nativeElement;
    const position = window.getComputedStyle(button).position;
    expect(position).toBe('relative');
  });
});
