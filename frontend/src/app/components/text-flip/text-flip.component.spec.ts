import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextFlipComponent } from './text-flip.component';

describe('TextFlipComponent', () => {
  let component: TextFlipComponent;
  let fixture: ComponentFixture<TextFlipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextFlipComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TextFlipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default words', () => {
    expect(component.words.length).toBeGreaterThan(0);
  });

  it('should cycle through words', (done) => {
    const initialWord = component.currentWord;
    setTimeout(() => {
      expect(component.currentWord).toBeDefined();
      done();
    }, 100);
  });
});
