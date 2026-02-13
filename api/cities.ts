import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchEvents, fetchCities, getUpcomingEvents } from '../src/sheets/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug } = req.query;

    // Single city with events
    if (slug && typeof slug === 'string') {
      const events = await fetchEvents();
      const cityEvents = events.filter(e => e.city_slug === slug);

      if (cityEvents.length === 0) {
        return res.status(404).json({ error: 'City not found' });
      }

      const upcoming = getUpcomingEvents(cityEvents);

      return res.status(200).json({
        city: {
          name: cityEvents[0].city,
          slug: cityEvents[0].city_slug,
          region: cityEvents[0].region,
          region_slug: cityEvents[0].region_slug,
        },
        events: upcoming,
        meta: {
          total_events: cityEvents.length,
          upcoming_events: upcoming.length,
        },
      });
    }

    // List all cities with event counts
    const events = await fetchEvents();
    const upcoming = getUpcomingEvents(events);

    // Aggregate cities from events
    const cityMap = new Map<string, {
      name: string;
      slug: string;
      region: string;
      region_slug: string;
      event_count: number;
      upcoming_count: number;
    }>();

    for (const event of events) {
      const existing = cityMap.get(event.city_slug) || {
        name: event.city,
        slug: event.city_slug,
        region: event.region,
        region_slug: event.region_slug,
        event_count: 0,
        upcoming_count: 0,
      };
      existing.event_count++;
      cityMap.set(event.city_slug, existing);
    }

    for (const event of upcoming) {
      const existing = cityMap.get(event.city_slug);
      if (existing) {
        existing.upcoming_count++;
      }
    }

    const cities = Array.from(cityMap.values())
      .sort((a, b) => b.upcoming_count - a.upcoming_count);

    return res.status(200).json({
      data: cities,
      meta: {
        total: cities.length,
      },
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return res.status(500).json({ error: 'Failed to fetch cities' });
  }
}
