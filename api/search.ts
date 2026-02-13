import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchEvents, getUpcomingEvents, SheetEvent } from '../src/sheets/client';

/**
 * Simple text search across events.
 * For full search functionality, use Typesense.
 * This is a fallback that works without any external services.
 */

function searchEvents(events: SheetEvent[], query: string): SheetEvent[] {
  const q = query.toLowerCase().trim();
  if (!q) return events;

  return events.filter(event => {
    const searchable = [
      event.name,
      event.city,
      event.region,
      event.venue,
      event.organizer,
      ...event.genres,
      ...event.artists,
      event.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // Simple word matching
    const words = q.split(/\s+/);
    return words.every(word => searchable.includes(word));
  });
}

function scoreEvent(event: SheetEvent, query: string): number {
  const q = query.toLowerCase();
  let score = 0;

  // Name match is strongest
  if (event.name.toLowerCase().includes(q)) score += 10;

  // Artist match
  if (event.artists.some(a => a.toLowerCase().includes(q))) score += 5;

  // City/venue match
  if (event.city.toLowerCase().includes(q)) score += 3;
  if (event.venue?.toLowerCase().includes(q)) score += 3;

  // Genre match
  if (event.genres.some(g => g.toLowerCase().includes(q))) score += 2;

  // Pinned and verified boost
  if (event.is_pinned) score += 5;
  if (event.is_verified) score += 2;

  // Cultural significance boost
  score += event.cultural_significance;

  return score;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, city, genre, type, from, to, upcoming } = req.query;
    const query = (q as string) || '';

    let events = await fetchEvents();

    // Text search
    if (query) {
      events = searchEvents(events, query);
    }

    // Filters
    if (city && typeof city === 'string') {
      events = events.filter(e => e.city_slug === city);
    }

    if (genre && typeof genre === 'string') {
      const g = genre.toLowerCase();
      events = events.filter(e => e.genres.some(eg => eg.toLowerCase() === g));
    }

    if (type && typeof type === 'string') {
      events = events.filter(e => e.event_type === type);
    }

    if (from && typeof from === 'string') {
      events = events.filter(e => e.start_date >= from);
    }

    if (to && typeof to === 'string') {
      events = events.filter(e => e.start_date <= to);
    }

    if (upcoming === 'true') {
      events = getUpcomingEvents(events);
    }

    // Score and sort
    if (query) {
      events = events
        .map(e => ({ event: e, score: scoreEvent(e, query) }))
        .sort((a, b) => b.score - a.score)
        .map(({ event }) => event);
    } else {
      // Default sort: pinned first, then by date
      events.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return a.start_date.localeCompare(b.start_date);
      });
    }

    // Build facets
    const facets = {
      cities: [...new Set(events.map(e => e.city))].slice(0, 20),
      genres: [...new Set(events.flatMap(e => e.genres))].slice(0, 20),
      types: [...new Set(events.map(e => e.event_type))],
    };

    return res.status(200).json({
      data: events,
      meta: {
        total: events.length,
        query: query || null,
      },
      facets,
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
}
