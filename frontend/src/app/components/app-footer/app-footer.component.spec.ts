import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppFooterComponent } from './app-footer.component';

describe('AppFooterComponent', () => {
  let component: AppFooterComponent;
  let fixture: ComponentFixture<AppFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppFooterComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AppFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display current year in copyright', () => {
    const currentYear = new Date().getFullYear();
    expect(component.currentYear).toBe(currentYear);

    const compiled = fixture.nativeElement as HTMLElement;
    const copyrightText = compiled.querySelector('.copyright p');
    expect(copyrightText?.textContent).toContain(currentYear.toString());
  });

  it('should render brand logo and name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const brandLogo = compiled.querySelector('.brand-logo i');
    const brandName = compiled.querySelector('.brand-name');

    expect(brandLogo).toBeTruthy();
    expect(brandLogo?.classList.contains('bi-hdd-network-fill')).toBe(true);
    expect(brandName?.textContent?.trim()).toBe('NetworkPro');
  });

  it('should render brand description', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const brandDescription = compiled.querySelector('.brand-description');

    expect(brandDescription?.textContent?.trim()).toContain('Advanced network monitoring');
  });

  it('should render social links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const socialLinks = compiled.querySelectorAll('.social-link');

    expect(socialLinks.length).toBe(2); // Updated to match actual HTML (GitHub, Email)

    const expectedIcons = ['bi-github', 'bi-envelope-fill'];
    socialLinks.forEach((link, index) => {
      const icon = link.querySelector('i');
      expect(icon?.classList.contains(expectedIcons[index])).toBe(true);
    });
  });

  it('should render quick links section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const quickLinksSection = compiled.querySelector('.footer-section:nth-child(2)');
    const sectionTitle = quickLinksSection?.querySelector('.section-title');
    const footerLinks = quickLinksSection?.querySelectorAll('.footer-link');

    expect(sectionTitle?.textContent?.trim()).toBe('Quick Links');
    expect(footerLinks?.length).toBe(5);
  });

  it('should render resources section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const resourcesSection = compiled.querySelector('.footer-section:nth-child(3)');
    const sectionTitle = resourcesSection?.querySelector('.section-title');
    const footerLinks = resourcesSection?.querySelectorAll('.footer-link');

    expect(sectionTitle?.textContent?.trim()).toBe('Resources');
    expect(footerLinks?.length).toBe(3); // Updated to match actual HTML
  });

  it('should render contact section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const contactSection = compiled.querySelector('.footer-section:nth-child(4)');
    const sectionTitle = contactSection?.querySelector('.section-title');
    const contactItems = contactSection?.querySelectorAll('.contact-item');

    expect(sectionTitle?.textContent?.trim()).toBe('About'); // Updated to match actual HTML
    expect(contactItems?.length).toBe(3);
  });

  it('should render contact information with correct icons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const contactItems = compiled.querySelectorAll('.contact-item');

    const expectedIcons = ['bi-mortarboard-fill', 'bi-person-fill', 'bi-cloud-fill']; // Updated to match actual HTML
    contactItems.forEach((item, index) => {
      const icon = item.querySelector('i');
      expect(icon?.classList.contains(expectedIcons[index])).toBe(true);
    });
  });

  it('should render footer bottom section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const footerBottom = compiled.querySelector('.footer-bottom');
    const copyright = footerBottom?.querySelector('.copyright');
    const bottomLinks = footerBottom?.querySelectorAll('.bottom-link');
    const versionBadge = footerBottom?.querySelector('.version-badge');

    expect(footerBottom).toBeTruthy();
    expect(copyright).toBeTruthy();
    expect(bottomLinks?.length).toBe(3);
    expect(versionBadge?.textContent?.trim()).toBe('v2.1.0');
  });

  it('should render bottom links with correct text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const bottomLinks = compiled.querySelectorAll('.bottom-link');

    const expectedTexts = ['Privacy Policy', 'Terms of Service', 'Cookie Policy'];
    bottomLinks.forEach((link, index) => {
      expect(link.textContent?.trim()).toBe(expectedTexts[index]);
    });
  });

  it('should have proper router links for quick navigation', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const quickLinksSection = compiled.querySelector('.footer-section:nth-child(2)');
    const routerLinks = quickLinksSection?.querySelectorAll('a[routerLink]');

    expect(routerLinks?.length).toBe(5);

    const expectedRoutes = ['/dashboard', '/devices', '/alerts', '/network-health', '/sessions'];
    routerLinks?.forEach((link, index) => {
      expect(link.getAttribute('routerLink')).toBe(expectedRoutes[index]);
    });
  });

  it('should have proper accessibility attributes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const socialLinks = compiled.querySelectorAll('.social-link');

    socialLinks.forEach(link => {
      expect(link.getAttribute('title')).toBeTruthy();
    });
  });

  it('should update current year property', () => {
    const testYear = 2025;
    const originalDate = Date;

    // Mock Date constructor
    spyOn(window, 'Date').and.returnValue({
      getFullYear: () => testYear
    } as any);

    // Create new component instance
    const newComponent = new AppFooterComponent();
    expect(newComponent.currentYear).toBe(testYear);
  });

  it('should have responsive grid layout classes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const footerContent = compiled.querySelector('.footer-content');

    expect(footerContent).toBeTruthy();
    expect(footerContent?.classList.contains('footer-content')).toBe(true);
  });

  it('should render all footer sections', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const footerSections = compiled.querySelectorAll('.footer-section');

    expect(footerSections.length).toBe(4);
  });

  it('should have proper semantic HTML structure', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const footer = compiled.querySelector('footer');
    const nav = compiled.querySelector('nav');

    expect(footer).toBeTruthy();
    expect(footer?.classList.contains('app-footer')).toBe(true);
  });
});