import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatefulButtonComponent } from './stateful-button.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('StatefulButtonComponent', () => {
  let component: StatefulButtonComponent;
  let fixture: ComponentFixture<StatefulButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatefulButtonComponent, BrowserAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(StatefulButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in idle state', () => {
    expect(component.buttonState).toBe('idle');
  });

  it('should emit buttonClick event when clicked', () => {
    spyOn(component.buttonClick, 'emit');
    component.handleClick();
    expect(component.buttonClick.emit).toHaveBeenCalled();
  });
});
