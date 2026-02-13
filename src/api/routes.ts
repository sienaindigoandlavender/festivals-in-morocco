/**
 * Morocco Events Search Engine - API Routes
 *
 * Public read-only API. No authentication required.
 * Rate limited: 100 requests/minute per IP.
 */

import { FastifyInstance } from 'fastify';
import { TypesenseClient } from './typesense';
import { db } from './database';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SearchParams {
  q?: string;
  city?: string;
  region?: string;
  genre?: string;
  type?: 'festival' | 'concert' | 'showcase' | 'ritual' | 'conference';
  status?: 'announced' | 'confirmed';
  from?: string;  // ISO date
  to?: string;    // ISO date
  verified?: boolean;
  page?: number;
  per_page?: number;
  sort?: 'date' | 'relevance' | 'significance';
}

interface EventResponse {
  id: number;
  name: string;
  slug: string;
  event_type: string;
  start_date: string;
  end_date: string | null;
  city: {
    id: number;
    name: string;
    slug: string;
  };
  region: {
    id: number;
    name: string;
    slug: string;
  };
  venue: {
    id: number;
    name: string;
    slug: string;
  } | null;
  genres: string[];
  artists: {
    id: number;
    name: string;
    slug: string;
    billing_order: number;
  }[];
  organizer: {
    id: number;
    name: string;
  } | null;
  official_website: string | null;
  ticket_urls: {
    url: string;
    provider: string | null;
    is_official: boolean;
  }[];
  status: string;
  is_verified: boolean;
  confidence_score: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
  facets?: Record<string, { value: string; count: number }[]>;
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

export async function registerRoutes(app: FastifyInstance) {

  // --------------------------------------------------------------------------
  // SEARCH
  // --------------------------------------------------------------------------

  /**
   * GET /api/search
   *
   * Primary search endpoint. Uses Typesense for full-text search with facets.
   *
   * Query params:
   *   q         - Search query (searches name, artists, venue)
   *   city      - City slug filter
   *   region    - Region slug filter
   *   genre     - Genre slug filter
   *   type      - Event type filter
   *   status    - Event status filter (default: announced,confirmed)
   *   from      - Start date filter (ISO 8601)
   *   to        - End date filter (ISO 8601)
   *   verified  - Only verified events (boolean)
   *   page      - Page number (default: 1)
   *   per_page  - Results per page (default: 20, max: 100)
   *   sort      - Sort order: date, relevance, significance
   */
  app.get<{ Querystring: SearchParams }>('/api/search', async (request) => {
    const {
      q = '*',
      city,
      region,
      genre,
      type,
      status,
      from,
      to,
      verified,
      page = 1,
      per_page = 20,
      sort = 'date',
    } = request.query;

    // Build filter string
    const filters: string[] = [];

    if (city) filters.push(`city_slug:=${city}`);
    if (region) filters.push(`region_slug:=${region}`);
    if (genre) filters.push(`genre_slugs:=${genre}`);
    if (type) filters.push(`event_type:=${type}`);
    if (status) {
      filters.push(`status:=${status}`);
    } else {
      filters.push(`status:=[announced,confirmed]`);
    }
    if (verified) filters.push(`is_verified:=true`);
    if (from) filters.push(`start_date:>=${dateToTimestamp(from)}`);
    if (to) filters.push(`start_date:<=${dateToTimestamp(to)}`);

    // Build sort string
    let sortBy: string;
    switch (sort) {
      case 'relevance':
        sortBy = '_text_match:desc,start_date:asc';
        break;
      case 'significance':
        sortBy = 'is_pinned:desc,cultural_significance:desc,start_date:asc';
        break;
      case 'date':
      default:
        sortBy = 'start_date:asc';
    }

    const result = await TypesenseClient.search('events', {
      q,
      query_by: 'name,artists,venue_name',
      filter_by: filters.join(' && '),
      sort_by: sortBy,
      facet_by: 'city_name,region_name,genres,event_type,is_verified',
      page,
      per_page: Math.min(per_page, 100),
      highlight_full_fields: 'name',
    });

    return {
      data: result.hits.map(hit => hit.document),
      meta: {
        total: result.found,
        page,
        per_page,
        total_pages: Math.ceil(result.found / per_page),
      },
      facets: formatFacets(result.facet_counts),
    };
  });

  // --------------------------------------------------------------------------
  // EVENTS
  // --------------------------------------------------------------------------

  /**
   * GET /api/events
   *
   * List upcoming events with optional filters.
   */
  app.get<{ Querystring: SearchParams }>('/api/events', async (request) => {
    const {
      city,
      region,
      genre,
      type,
      from,
      to,
      page = 1,
      per_page = 20,
    } = request.query;

    const offset = (page - 1) * per_page;

    let query = db
      .selectFrom('v_upcoming_events')
      .selectAll()
      .where('status', 'in', ['announced', 'confirmed'])
      .orderBy('start_date', 'asc')
      .limit(per_page)
      .offset(offset);

    if (city) query = query.where('city_slug', '=', city);
    if (region) query = query.where('region_slug', '=', region);
    if (type) query = query.where('event_type', '=', type);
    if (from) query = query.where('start_date', '>=', from);
    if (to) query = query.where('start_date', '<=', to);
    if (genre) query = query.where(sql`${genre} = ANY(genres)`);

    const [events, countResult] = await Promise.all([
      query.execute(),
      db
        .selectFrom('v_upcoming_events')
        .select(db.fn.count('id').as('count'))
        .executeTakeFirst(),
    ]);

    return {
      data: events,
      meta: {
        total: Number(countResult?.count || 0),
        page,
        per_page,
        total_pages: Math.ceil(Number(countResult?.count || 0) / per_page),
      },
    };
  });

  /**
   * GET /api/events/:slug
   *
   * Get single event by slug with full details.
   */
  app.get<{ Params: { slug: string } }>('/api/events/:slug', async (request, reply) => {
    const { slug } = request.params;

    const event = await db
      .selectFrom('events as e')
      .leftJoin('cities as c', 'e.city_id', 'c.id')
      .leftJoin('regions as r', 'e.region_id', 'r.id')
      .leftJoin('venues as v', 'e.venue_id', 'v.id')
      .leftJoin('organizers as o', 'e.organizer_id', 'o.id')
      .select([
        'e.id',
        'e.name',
        'e.slug',
        'e.event_type',
        'e.start_date',
        'e.end_date',
        'e.start_time',
        'e.description',
        'e.official_website',
        'e.status',
        'e.is_verified',
        'e.is_pinned',
        'e.confidence_score',
        'e.cultural_significance',
        'c.id as city_id',
        'c.name as city_name',
        'c.slug as city_slug',
        'r.id as region_id',
        'r.name as region_name',
        'r.slug as region_slug',
        'v.id as venue_id',
        'v.name as venue_name',
        'v.slug as venue_slug',
        'v.address as venue_address',
        'o.id as organizer_id',
        'o.name as organizer_name',
      ])
      .where('e.slug', '=', slug)
      .executeTakeFirst();

    if (!event) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    // Fetch related data
    const [artists, genres, tickets] = await Promise.all([
      db
        .selectFrom('event_artists as ea')
        .innerJoin('artists as a', 'ea.artist_id', 'a.id')
        .select(['a.id', 'a.name', 'a.slug', 'ea.billing_order'])
        .where('ea.event_id', '=', event.id)
        .orderBy('ea.billing_order', 'asc')
        .execute(),

      db
        .selectFrom('event_genres as eg')
        .innerJoin('genres as g', 'eg.genre_id', 'g.id')
        .select(['g.id', 'g.name', 'g.slug', 'eg.is_primary'])
        .where('eg.event_id', '=', event.id)
        .execute(),

      db
        .selectFrom('event_ticket_urls')
        .select(['url', 'provider', 'is_official', 'price_min', 'price_max', 'currency'])
        .where('event_id', '=', event.id)
        .execute(),
    ]);

    return formatEventResponse(event, artists, genres, tickets);
  });

  // --------------------------------------------------------------------------
  // FESTIVALS
  // --------------------------------------------------------------------------

  /**
   * GET /api/festivals
   *
   * List upcoming festivals only.
   */
  app.get('/api/festivals', async (request) => {
    const events = await db
      .selectFrom('v_festivals')
      .selectAll()
      .orderBy('is_pinned', 'desc')
      .orderBy('cultural_significance', 'desc')
      .orderBy('start_date', 'asc')
      .execute();

    return { data: events };
  });

  // --------------------------------------------------------------------------
  // CITIES
  // --------------------------------------------------------------------------

  /**
   * GET /api/cities
   *
   * List all cities with event counts.
   */
  app.get('/api/cities', async () => {
    const cities = await db
      .selectFrom('cities as c')
      .innerJoin('regions as r', 'c.region_id', 'r.id')
      .leftJoin('events as e', (join) =>
        join
          .onRef('c.id', '=', 'e.city_id')
          .on('e.status', 'in', ['announced', 'confirmed'])
          .on('e.start_date', '>=', sql`CURRENT_DATE`)
      )
      .select([
        'c.id',
        'c.name',
        'c.slug',
        'c.name_fr',
        'c.name_ar',
        'r.name as region_name',
        'r.slug as region_slug',
        db.fn.count('e.id').as('upcoming_event_count'),
      ])
      .groupBy(['c.id', 'r.name', 'r.slug'])
      .orderBy('upcoming_event_count', 'desc')
      .execute();

    return { data: cities };
  });

  /**
   * GET /api/cities/:slug
   *
   * Get city details with upcoming events.
   */
  app.get<{ Params: { slug: string } }>('/api/cities/:slug', async (request, reply) => {
    const { slug } = request.params;

    const city = await db
      .selectFrom('cities as c')
      .innerJoin('regions as r', 'c.region_id', 'r.id')
      .select([
        'c.id',
        'c.name',
        'c.slug',
        'c.name_fr',
        'c.name_ar',
        'c.geo_location',
        'r.id as region_id',
        'r.name as region_name',
        'r.slug as region_slug',
      ])
      .where('c.slug', '=', slug)
      .executeTakeFirst();

    if (!city) {
      return reply.status(404).send({ error: 'City not found' });
    }

    const events = await db
      .selectFrom('v_upcoming_events')
      .selectAll()
      .where('city_slug', '=', slug)
      .orderBy('start_date', 'asc')
      .limit(50)
      .execute();

    return {
      city,
      events,
    };
  });

  // --------------------------------------------------------------------------
  // REGIONS
  // --------------------------------------------------------------------------

  /**
   * GET /api/regions
   *
   * List all regions with city and event counts.
   */
  app.get('/api/regions', async () => {
    const regions = await db
      .selectFrom('regions as r')
      .leftJoin('cities as c', 'r.id', 'c.region_id')
      .leftJoin('events as e', (join) =>
        join
          .onRef('c.id', '=', 'e.city_id')
          .on('e.status', 'in', ['announced', 'confirmed'])
          .on('e.start_date', '>=', sql`CURRENT_DATE`)
      )
      .select([
        'r.id',
        'r.name',
        'r.slug',
        'r.name_fr',
        'r.name_ar',
        db.fn.countDistinct('c.id').as('city_count'),
        db.fn.count('e.id').as('upcoming_event_count'),
      ])
      .groupBy('r.id')
      .orderBy('upcoming_event_count', 'desc')
      .execute();

    return { data: regions };
  });

  // --------------------------------------------------------------------------
  // GENRES
  // --------------------------------------------------------------------------

  /**
   * GET /api/genres
   *
   * List all genres with event counts.
   */
  app.get('/api/genres', async () => {
    const genres = await db
      .selectFrom('genres as g')
      .leftJoin('event_genres as eg', 'g.id', 'eg.genre_id')
      .leftJoin('events as e', (join) =>
        join
          .onRef('eg.event_id', '=', 'e.id')
          .on('e.status', 'in', ['announced', 'confirmed'])
          .on('e.start_date', '>=', sql`CURRENT_DATE`)
      )
      .select([
        'g.id',
        'g.name',
        'g.slug',
        'g.parent_id',
        db.fn.count('e.id').as('upcoming_event_count'),
      ])
      .groupBy('g.id')
      .orderBy('upcoming_event_count', 'desc')
      .execute();

    return { data: genres };
  });

  // --------------------------------------------------------------------------
  // CALENDAR
  // --------------------------------------------------------------------------

  /**
   * GET /api/calendar/:year/:month
   *
   * Get events for a specific month.
   */
  app.get<{ Params: { year: string; month: string } }>(
    '/api/calendar/:year/:month',
    async (request, reply) => {
      const year = parseInt(request.params.year, 10);
      const month = parseInt(request.params.month, 10);

      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return reply.status(400).send({ error: 'Invalid year or month' });
      }

      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const events = await db
        .selectFrom('v_upcoming_events')
        .selectAll()
        .where('start_date', '>=', startDate)
        .where('start_date', '<=', endDate)
        .orderBy('start_date', 'asc')
        .execute();

      // Group by date for calendar rendering
      const byDate: Record<string, typeof events> = {};
      for (const event of events) {
        const date = event.start_date;
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(event);
      }

      return {
        year,
        month,
        total_events: events.length,
        events_by_date: byDate,
        events,
      };
    }
  );

  // --------------------------------------------------------------------------
  // ARTISTS
  // --------------------------------------------------------------------------

  /**
   * GET /api/artists/:slug
   *
   * Get artist with their events.
   */
  app.get<{ Params: { slug: string } }>('/api/artists/:slug', async (request, reply) => {
    const { slug } = request.params;

    const artist = await db
      .selectFrom('artists')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst();

    if (!artist) {
      return reply.status(404).send({ error: 'Artist not found' });
    }

    const [genres, events] = await Promise.all([
      db
        .selectFrom('artist_genres as ag')
        .innerJoin('genres as g', 'ag.genre_id', 'g.id')
        .select(['g.id', 'g.name', 'g.slug'])
        .where('ag.artist_id', '=', artist.id)
        .execute(),

      db
        .selectFrom('event_artists as ea')
        .innerJoin('v_upcoming_events as e', 'ea.event_id', 'e.id')
        .selectAll('e')
        .where('ea.artist_id', '=', artist.id)
        .orderBy('e.start_date', 'asc')
        .execute(),
    ]);

    return {
      artist: { ...artist, genres },
      upcoming_events: events.filter(e => e.start_date >= new Date().toISOString().split('T')[0]),
      past_events: events.filter(e => e.start_date < new Date().toISOString().split('T')[0]),
    };
  });

  // --------------------------------------------------------------------------
  // HEALTH
  // --------------------------------------------------------------------------

  app.get('/api/health', async () => {
    const dbCheck = await db.selectFrom('regions').select('id').limit(1).execute();
    const searchCheck = await TypesenseClient.health();

    return {
      status: 'ok',
      database: dbCheck.length > 0 ? 'connected' : 'error',
      search: searchCheck ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
    };
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function dateToTimestamp(dateStr: string): number {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

function formatFacets(facetCounts: any[]): Record<string, { value: string; count: number }[]> {
  const result: Record<string, { value: string; count: number }[]> = {};
  for (const facet of facetCounts || []) {
    result[facet.field_name] = facet.counts.map((c: any) => ({
      value: c.value,
      count: c.count,
    }));
  }
  return result;
}

function formatEventResponse(event: any, artists: any[], genres: any[], tickets: any[]): EventResponse {
  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    event_type: event.event_type,
    start_date: event.start_date,
    end_date: event.end_date,
    city: {
      id: event.city_id,
      name: event.city_name,
      slug: event.city_slug,
    },
    region: {
      id: event.region_id,
      name: event.region_name,
      slug: event.region_slug,
    },
    venue: event.venue_id ? {
      id: event.venue_id,
      name: event.venue_name,
      slug: event.venue_slug,
    } : null,
    genres: genres.map(g => g.name),
    artists: artists.map(a => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      billing_order: a.billing_order,
    })),
    organizer: event.organizer_id ? {
      id: event.organizer_id,
      name: event.organizer_name,
    } : null,
    official_website: event.official_website,
    ticket_urls: tickets.map(t => ({
      url: t.url,
      provider: t.provider,
      is_official: t.is_official,
    })),
    status: event.status,
    is_verified: event.is_verified,
    confidence_score: event.confidence_score,
  };
}
