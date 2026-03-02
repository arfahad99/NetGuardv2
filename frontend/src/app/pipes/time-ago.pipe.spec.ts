import { TimeAgoPipe } from './time-ago.pipe';

describe('TimeAgoPipe', () => {
  let pipe: TimeAgoPipe;

  beforeEach(() => {
    pipe = new TimeAgoPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return N/A for null value', () => {
    expect(pipe.transform(null as any)).toBe('N/A');
  });

  it('should return Just now for recent time', () => {
    const now = new Date();
    expect(pipe.transform(now)).toBe('Just now');
  });

  it('should return minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(pipe.transform(fiveMinAgo)).toContain('min ago');
  });

  it('should return hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(pipe.transform(twoHoursAgo)).toContain('hours ago');
  });

  it('should return days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(pipe.transform(threeDaysAgo)).toContain('days ago');
  });

  it('should handle unix timestamp', () => {
    const timestamp = Math.floor(Date.now() / 1000) - 120;
    expect(pipe.transform(timestamp)).toContain('min ago');
  });
});
