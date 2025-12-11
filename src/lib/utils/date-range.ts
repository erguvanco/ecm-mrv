// Server-compatible date range utility

export type TimeRange = 'all' | '7d' | '30d' | '90d' | '12m' | 'ytd' | 'mtd';

// Helper function to get date range from filter value
export function getDateRange(range: TimeRange): { start: Date | null; end: Date } {
  const now = new Date();
  const end = now;

  switch (range) {
    case '7d':
      return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end };
    case '30d':
      return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end };
    case '90d':
      return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end };
    case '12m':
      return { start: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), end };
    case 'ytd':
      return { start: new Date(now.getFullYear(), 0, 1), end };
    case 'mtd':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
    case 'all':
    default:
      return { start: null, end };
  }
}
