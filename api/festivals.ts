import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchEvents, getUpcomingEvents } from '../src/sheets/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const events = await fetchEvents();

    // Filter to festivals only
    let festivals = events.filter(e => e.event_type === 'festival');

    // Filter to upcoming by default
    const { all } = req.query;
    if (all !== 'true') {
      festivals = getUpcomingEvents(festivals);
    }

    // Sort by cultural significance, then date
    festivals.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      if (b.cultural_significance !== a.cultural_significance) {
        return b.cultural_significance - a.cultural_significance;
      }
      return a.start_date.localeCompare(b.start_date);
    });

    return res.status(200).json({
      data: festivals,
      meta: {
        total: festivals.length,
      },
    });
  } catch (error) {
    console.error('Error fetching festivals:', error);
    return res.status(500).json({ error: 'Failed to fetch festivals' });
  }
}
