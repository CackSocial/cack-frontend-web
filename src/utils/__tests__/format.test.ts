import { timeAgo, formatCount, truncate, formatMessageTime, formatFullDate } from '../format';

describe('timeAgo', () => {
  it('returns a relative time string for a recent date', () => {
    const now = new Date();
    const result = timeAgo(now.toISOString());
    // date-fns formatDistanceToNow returns "less than a minute ago" for very recent
    expect(result).toContain('ago');
  });

  it('returns minutes ago for a date a few minutes back', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000);
    const result = timeAgo(d.toISOString());
    expect(result).toContain('5 minutes ago');
  });

  it('returns hours ago for a date a few hours back', () => {
    const d = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const result = timeAgo(d.toISOString());
    expect(result).toContain('2 hours ago');
  });

  it('returns days ago for a date a few days back', () => {
    const d = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const result = timeAgo(d.toISOString());
    expect(result).toContain('3 days ago');
  });
});

describe('formatCount', () => {
  it('returns the number as-is when below 1000', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(999)).toBe('999');
  });

  it('formats thousands with K suffix', () => {
    expect(formatCount(1000)).toBe('1.0K');
    expect(formatCount(1500)).toBe('1.5K');
    expect(formatCount(9999)).toBe('10.0K');
  });

  it('formats millions with M suffix', () => {
    expect(formatCount(1000000)).toBe('1.0M');
    expect(formatCount(2500000)).toBe('2.5M');
  });
});

describe('truncate', () => {
  it('returns the original string when within maxLen', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('returns the original string when exactly at maxLen', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates and adds ellipsis when exceeding maxLen', () => {
    expect(truncate('hello world', 5)).toBe('hello…');
  });

  it('trims trailing whitespace before ellipsis', () => {
    expect(truncate('hello world test', 6)).toBe('hello…');
  });
});

describe('formatMessageTime', () => {
  it('returns time format for today', () => {
    const now = new Date();
    const result = formatMessageTime(now.toISOString());
    // Should be in "h:mm a" format like "3:45 PM"
    expect(result).toMatch(/\d{1,2}:\d{2}\s[AP]M/);
  });

  it('returns "Yesterday" for yesterday\'s date', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(formatMessageTime(yesterday.toISOString())).toBe('Yesterday');
  });
});

describe('formatFullDate', () => {
  it('returns formatted date string', () => {
    const result = formatFullDate('2024-06-15T14:30:00Z');
    // Should contain month, day, year
    expect(result).toContain('2024');
    expect(result).toContain('Jun');
    expect(result).toContain('15');
  });
});
