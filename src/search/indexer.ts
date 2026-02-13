/**
 * Search Index Synchronization Service
 *
 * Keeps Typesense in sync with PostgreSQL.
 * PostgreSQL is source of truth; Typesense is read-optimized projection.
 */

import Typesense from 'typesense';
import { db } from '../database';

// ============================================================================
// CLIENT SETUP
// ============================================================================

const client = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || 'localhost',
      port: parseInt(process.env.TYPESENSE_PORT || '8108'),
      protocol: process.env.TYPESENSE_PROTOCOL || 'http',
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
  connectionTimeoutSeconds: 10,
});

// ============================================================================
// SCHEMA MANAGEMENT
// ============================================================================

const EVENTS_SCHEMA = {
  name: 'events',
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'name', type: 'string' as const, infix: true },
    { name: 'slug', type: 'string' as const, index: false },
    { name: 'event_type', type: 'string' as const, facet: true },
    { name: 'description', type: 'string' as const, optional: true },
    { name: 'start_date', type: 'int64' as const, facet: true },
    { name: 'end_date', type: 'int64' as const, optional: true },
    { name: 'year', type: 'int32' as const, facet: true },
    { name: 'month', type: 'int32' as const, facet: true },
    { name: 'city_id', type: 'int32' as const, facet: true },
    { name: 'city_name', type: 'string' as const, facet: true },
    { name: 'city_slug', type: 'string' as const, index: false },
    { name: 'region_id', type: 'int32' as const, facet: true },
    { name: 'region_name', type: 'string' as const, facet: true },
    { name: 'region_slug', type: 'string' as const, index: false },
    { name: 'venue_name', type: 'string' as const, optional: true },
    { name: 'venue_slug', type: 'string' as const, optional: true, index: false },
    { name: 'geo_location', type: 'geopoint' as const, optional: true },
    { name: 'genres', type: 'string[]' as const, facet: true },
    { name: 'genre_slugs', type: 'string[]' as const, facet: true },
    { name: 'artists', type: 'string[]' as const, infix: true },
    { name: 'artist_slugs', type: 'string[]' as const, index: false },
    { name: 'organizer_name', type: 'string' as const, optional: true },
    { name: 'official_website', type: 'string' as const, optional: true, index: false },
    { name: 'status', type: 'string' as const, facet: true },
    { name: 'confidence_score', type: 'float' as const },
    { name: 'is_verified', type: 'bool' as const, facet: true },
    { name: 'is_pinned', type: 'bool' as const },
    { name: 'cultural_significance', type: 'int32' as const },
    { name: 'has_tickets', type: 'bool' as const, facet: true },
    { name: 'updated_at', type: 'int64' as const },
  ],
  default_sorting_field: 'start_date',
  token_separators: ['-', "'", "'"],
  symbols_to_index: ['&'],
};

export async function ensureSchema(): Promise<void> {
  try {
    await client.collections('events').retrieve();
    console.log('Events collection exists');
  } catch {
    console.log('Creating events collection');
    await client.collections().create(EVENTS_SCHEMA);
  }
}

// ============================================================================
// DOCUMENT TRANSFORMATION
// ============================================================================

interface EventRow {
  id: number;
  name: string;
  slug: string;
  event_type: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  city_id: number;
  city_name: string;
  city_slug: string;
  region_id: number;
  region_name: string;
  region_slug: string;
  venue_name: string | null;
  venue_slug: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  organizer_name: string | null;
  official_website: string | null;
  status: string;
  confidence_score: number;
  is_verified: boolean;
  is_pinned: boolean;
  cultural_significance: number;
  updated_at: Date;
}

interface SearchDocument {
  id: string;
  name: string;
  slug: string;
  event_type: string;
  description?: string;
  start_date: number;
  end_date?: number;
  year: number;
  month: number;
  city_id: number;
  city_name: string;
  city_slug: string;
  region_id: number;
  region_name: string;
  region_slug: string;
  venue_name?: string;
  venue_slug?: string;
  geo_location?: [number, number];
  genres: string[];
  genre_slugs: string[];
  artists: string[];
  artist_slugs: string[];
  organizer_name?: string;
  official_website?: string;
  status: string;
  confidence_score: number;
  is_verified: boolean;
  is_pinned: boolean;
  cultural_significance: number;
  has_tickets: boolean;
  updated_at: number;
}

function toSearchDocument(
  row: EventRow,
  genres: { name: string; slug: string }[],
  artists: { name: string; slug: string }[],
  hasTickets: boolean
): SearchDocument {
  const startDate = new Date(row.start_date);

  const doc: SearchDocument = {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    event_type: row.event_type,
    start_date: Math.floor(startDate.getTime() / 1000),
    year: startDate.getFullYear(),
    month: startDate.getMonth() + 1,
    city_id: row.city_id,
    city_name: row.city_name,
    city_slug: row.city_slug,
    region_id: row.region_id,
    region_name: row.region_name,
    region_slug: row.region_slug,
    genres: genres.map(g => g.name),
    genre_slugs: genres.map(g => g.slug),
    artists: artists.map(a => a.name),
    artist_slugs: artists.map(a => a.slug),
    status: row.status,
    confidence_score: row.confidence_score,
    is_verified: row.is_verified,
    is_pinned: row.is_pinned,
    cultural_significance: row.cultural_significance,
    has_tickets: hasTickets,
    updated_at: Math.floor(row.updated_at.getTime() / 1000),
  };

  // Optional fields
  if (row.description) doc.description = row.description;
  if (row.end_date) doc.end_date = Math.floor(new Date(row.end_date).getTime() / 1000);
  if (row.venue_name) doc.venue_name = row.venue_name;
  if (row.venue_slug) doc.venue_slug = row.venue_slug;
  if (row.organizer_name) doc.organizer_name = row.organizer_name;
  if (row.official_website) doc.official_website = row.official_website;
  if (row.geo_lat !== null && row.geo_lng !== null) {
    doc.geo_location = [row.geo_lat, row.geo_lng];
  }

  return doc;
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Full reindex: Delete and recreate entire index from database.
 * Run during initial setup and for recovery.
 */
export async function fullReindex(): Promise<{ indexed: number; errors: number }> {
  console.log('Starting full reindex...');

  // Drop and recreate collection
  try {
    await client.collections('events').delete();
  } catch {
    // Collection may not exist
  }
  await client.collections().create(EVENTS_SCHEMA);

  // Fetch all indexable events
  const events = await db
    .selectFrom('events as e')
    .innerJoin('cities as c', 'e.city_id', 'c.id')
    .innerJoin('regions as r', 'e.region_id', 'r.id')
    .leftJoin('venues as v', 'e.venue_id', 'v.id')
    .leftJoin('organizers as o', 'e.organizer_id', 'o.id')
    .select([
      'e.id',
      'e.name',
      'e.slug',
      'e.event_type',
      'e.description',
      'e.start_date',
      'e.end_date',
      'e.status',
      'e.confidence_score',
      'e.is_verified',
      'e.is_pinned',
      'e.cultural_significance',
      'e.official_website',
      'e.updated_at',
      'c.id as city_id',
      'c.name as city_name',
      'c.slug as city_slug',
      'r.id as region_id',
      'r.name as region_name',
      'r.slug as region_slug',
      'v.name as venue_name',
      'v.slug as venue_slug',
      'o.name as organizer_name',
    ])
    .where('e.status', 'in', ['announced', 'confirmed'])
    .execute();

  console.log(`Found ${events.length} events to index`);

  // Fetch related data for all events
  const eventIds = events.map(e => e.id);

  const [allGenres, allArtists, ticketCounts] = await Promise.all([
    db
      .selectFrom('event_genres as eg')
      .innerJoin('genres as g', 'eg.genre_id', 'g.id')
      .select(['eg.event_id', 'g.name', 'g.slug'])
      .where('eg.event_id', 'in', eventIds)
      .execute(),

    db
      .selectFrom('event_artists as ea')
      .innerJoin('artists as a', 'ea.artist_id', 'a.id')
      .select(['ea.event_id', 'a.name', 'a.slug'])
      .where('ea.event_id', 'in', eventIds)
      .execute(),

    db
      .selectFrom('event_ticket_urls')
      .select(['event_id', db.fn.count('id').as('count')])
      .where('event_id', 'in', eventIds)
      .groupBy('event_id')
      .execute(),
  ]);

  // Index genres and artists by event
  const genresByEvent = new Map<number, { name: string; slug: string }[]>();
  for (const g of allGenres) {
    if (!genresByEvent.has(g.event_id)) genresByEvent.set(g.event_id, []);
    genresByEvent.get(g.event_id)!.push({ name: g.name, slug: g.slug });
  }

  const artistsByEvent = new Map<number, { name: string; slug: string }[]>();
  for (const a of allArtists) {
    if (!artistsByEvent.has(a.event_id)) artistsByEvent.set(a.event_id, []);
    artistsByEvent.get(a.event_id)!.push({ name: a.name, slug: a.slug });
  }

  const hasTickets = new Set(ticketCounts.filter(t => Number(t.count) > 0).map(t => t.event_id));

  // Transform to search documents
  const documents = events.map(event =>
    toSearchDocument(
      event as EventRow,
      genresByEvent.get(event.id) || [],
      artistsByEvent.get(event.id) || [],
      hasTickets.has(event.id)
    )
  );

  // Batch import
  const BATCH_SIZE = 100;
  let indexed = 0;
  let errors = 0;

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    try {
      const result = await client.collections('events').documents().import(batch, { action: 'upsert' });
      const failed = result.filter(r => !r.success);
      indexed += batch.length - failed.length;
      errors += failed.length;

      if (failed.length > 0) {
        console.error('Failed documents:', failed);
      }
    } catch (err) {
      console.error('Batch import error:', err);
      errors += batch.length;
    }
  }

  console.log(`Reindex complete: ${indexed} indexed, ${errors} errors`);
  return { indexed, errors };
}

/**
 * Index a single event (after create or update).
 */
export async function indexEvent(eventId: number): Promise<void> {
  const event = await db
    .selectFrom('events as e')
    .innerJoin('cities as c', 'e.city_id', 'c.id')
    .innerJoin('regions as r', 'e.region_id', 'r.id')
    .leftJoin('venues as v', 'e.venue_id', 'v.id')
    .leftJoin('organizers as o', 'e.organizer_id', 'o.id')
    .select([
      'e.id',
      'e.name',
      'e.slug',
      'e.event_type',
      'e.description',
      'e.start_date',
      'e.end_date',
      'e.status',
      'e.confidence_score',
      'e.is_verified',
      'e.is_pinned',
      'e.cultural_significance',
      'e.official_website',
      'e.updated_at',
      'c.id as city_id',
      'c.name as city_name',
      'c.slug as city_slug',
      'r.id as region_id',
      'r.name as region_name',
      'r.slug as region_slug',
      'v.name as venue_name',
      'v.slug as venue_slug',
      'o.name as organizer_name',
    ])
    .where('e.id', '=', eventId)
    .executeTakeFirst();

  if (!event) {
    // Event deleted or doesn't exist, remove from index
    try {
      await client.collections('events').documents(String(eventId)).delete();
    } catch {
      // Document may not exist in index
    }
    return;
  }

  // Check if should be indexed
  if (!['announced', 'confirmed'].includes(event.status)) {
    // Remove from index if status changed to non-indexable
    try {
      await client.collections('events').documents(String(eventId)).delete();
    } catch {
      // Document may not exist
    }
    return;
  }

  // Fetch related data
  const [genres, artists, tickets] = await Promise.all([
    db
      .selectFrom('event_genres as eg')
      .innerJoin('genres as g', 'eg.genre_id', 'g.id')
      .select(['g.name', 'g.slug'])
      .where('eg.event_id', '=', eventId)
      .execute(),

    db
      .selectFrom('event_artists as ea')
      .innerJoin('artists as a', 'ea.artist_id', 'a.id')
      .select(['a.name', 'a.slug'])
      .where('ea.event_id', '=', eventId)
      .execute(),

    db
      .selectFrom('event_ticket_urls')
      .select(db.fn.count('id').as('count'))
      .where('event_id', '=', eventId)
      .executeTakeFirst(),
  ]);

  const document = toSearchDocument(
    event as EventRow,
    genres,
    artists,
    Number(tickets?.count || 0) > 0
  );

  await client.collections('events').documents().upsert(document);
}

/**
 * Remove an event from the index.
 */
export async function removeFromIndex(eventId: number): Promise<void> {
  try {
    await client.collections('events').documents(String(eventId)).delete();
  } catch {
    // Document may not exist
  }
}

/**
 * Health check for search service.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await client.health.retrieve();
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// SEARCH INTERFACE
// ============================================================================

export const TypesenseClient = {
  async search(collection: string, params: any) {
    return client.collections(collection).documents().search(params);
  },

  async health() {
    return healthCheck();
  },
};
