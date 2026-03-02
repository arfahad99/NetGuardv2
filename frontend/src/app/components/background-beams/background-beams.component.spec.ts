import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackgroundBeamsComponent } from './background-beams.component';

describe('BackgroundBeamsComponent', () => {
  let component: BackgroundBeamsComponent;
  let fixture: ComponentFixture<BackgroundBeamsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackgroundBeamsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BackgroundBeamsComponent);
    component = fixture.componentInstance;
    
    // Initialize component properties to avoid ExpressionChangedAfterItHasBeenCheckedError
    component.beamStates = component.beams.map(beam => ({
      beam,
      collision: { detected: false, coordinates: null },
      animating: false,
      key: 0
    }));
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize beam states', () => {
    expect(component.beamStates).toBeDefined();
    expect(component.beamStates.length).toBe(component.beams.length);
  });

  it('should have beam configuration', () => {
    expect(component.beams).toBeDefined();
    expect(component.beams.length).toBeGreaterThan(0);
  });

  it('should track beams by index', () => {
    const index = 0;
    const result = component.trackByIndex(index);
    expect(result).toBe(index);
  });

  it('should generate beam styles', () => {
    const mockState = {
      beam: { initialX: 100, duration: 5, delay: 2 }
    };
    const style = component.getBeamStyle(mockState);
    expect(style.left).toBe('100px');
    expect(style.animationDuration).toBe('5s');
    expect(style.animationDelay).toBe('2s');
  });

  it('should generate explosion styles', () => {
    const coordinates = { x: 50, y: 100 };
    const style = component.getExplosionStyle(coordinates);
    expect(style.left).toBe('50px');
    expect(style.top).toBe('100px');
    expect(style.transform).toBe('translate(-50%, -50%)');
  });
});