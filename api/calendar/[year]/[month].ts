import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchEvents, getEventsByMonth } from '../../../src/sheets/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { year, month } = req.query;

    const y = parseInt(year as string, 10);
    const m = parseInt(month as string, 10);

    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    const events = await fetchEvents();
    const monthEvents = getEventsByMonth(events, y, m);

    // Group by date
    const byDate: Record<string, typeof monthEvents> = {};
    for (const event of monthEvents) {
      const date = event.start_date;
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(event);
    }

    return res.status(200).json({
      year: y,
      month: m,
      events: monthEvents,
      events_by_date: byDate,
      meta: {
        total: monthEvents.length,
      },
    });
  } catch (error) {
    console.error('Calendar error:', error);
    return res.status(500).json({ error: 'Failed to fetch calendar' });
  }
}
