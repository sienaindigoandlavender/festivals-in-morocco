/**
 * Core Type Definitions
 *
 * Canonical types for the Morocco Events Search Engine.
 * These types are shared across API, database, and frontend.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type EventType = 'festival' | 'concert' | 'showcase' | 'ritual' | 'conference';

export type EventStatus = 'announced' | 'confirmed' | 'cancelled' | 'postponed' | 'archived';

export type SourceType =
  | 'official_website'
  | 'eventbrite_api'
  | 'songkick_api'
  | 'bandsintown_api'
  | 'manual_entry'
  | 'scrape'
  | 'csv_import';

// ============================================================================
// ENTITIES
// ============================================================================

export interface Region {
  id: number;
  name: string;
  name_ar: string | null;
  name_fr: string | null;
  slug: string;
}

export interface City {
  id: number;
  region_id: number;
  name: string;
  name_ar: string | null;
  name_fr: string | null;
  slug: string;
  geo_location: { lat: number; lng: number } | null;
  population: number | null;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  description: string | null;
}

export interface Venue {
  id: number;
  city_id: number;
  name: string;
  slug: string;
  address: string | null;
  geo_location: { lat: number; lng: number } | null;
  capacity: number | null;
  venue_type: string | null;
  website: string | null;
}

export interface Organizer {
  id: number;
  name: string;
  slug: string;
  website: string | null;
  email: string | null;
  verified: boolean;
}

export interface Artist {
  id: number;
  name: string;
  slug: string;
  country: string | null;
  bio: string | null;
  website: string | null;
  spotify_id: string | null;
  musicbrainz_id: string | null;
  image_url: string | null;
}

export interface Event {
  id: number;
  name: string;
  slug: string;
  event_type: EventType;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  doors_time: string | null;
  city_id: number;
  region_id: number;
  venue_id: number | null;
  organizer_id: number | null;
  description: string | null;
  official_website: string | null;
  status: EventStatus;
  confidence_score: number;
  is_verified: boolean;
  is_pinned: boolean;
  cultural_significance: number;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventTicketUrl {
  id: number;
  event_id: number;
  url: string;
  provider: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  is_official: boolean;
  last_checked_at: string | null;
}

export interface Source {
  id: number;
  source_type: SourceType;
  name: string;
  base_url: string | null;
  reliability_score: number;
  is_active: boolean;
  last_fetch_at: string | null;
}

export interface EventSource {
  id: number;
  event_id: number;
  source_id: number;
  external_id: string | null;
  source_url: string;
  raw_data: Record<string, unknown> | null;
  fetched_at: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface EventDetail extends Event {
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
  ticket_urls: {
    url: string;
    provider: string | null;
    is_official: boolean;
  }[];
}

export interface EventListItem {
  id: number;
  name: string;
  slug: string;
  event_type: EventType;
  start_date: string;
  end_date: string | null;
  city_name: string;
  city_slug: string;
  region_name: string;
  region_slug: string;
  venue_name: string | null;
  genres: string[];
  artists: string[];
  status: EventStatus;
  is_verified: boolean;
  confidence_score: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
  facets?: Record<string, FacetValue[]>;
}

export interface FacetValue {
  value: string;
  count: number;
}

// ============================================================================
// INGESTION TYPES
// ============================================================================

export interface EventCandidate {
  id?: number;
  raw_name: string;
  raw_start_date: string;
  raw_end_date: string | null;
  raw_city: string | null;
  raw_venue: string | null;
  raw_data: Record<string, unknown>;
  source_id: number;
  external_id: string | null;
  source_url: string;
  processed: boolean;
  matched_event_id: number | null;
  match_confidence: number | null;
  ingested_at: string;
  processed_at: string | null;
}

export interface DeduplicationResult {
  action: 'create' | 'merge' | 'review';
  existing_event_id: number | null;
  confidence: number;
  match_type: 'exact' | 'fuzzy_name' | 'date_location' | 'none';
}

export interface IngestionReport {
  started_at: string;
  completed_at?: string;
  sources: SourceReport[];
  total_fetched: number;
  total_created: number;
  total_merged: number;
  total_review_needed: number;
  errors: IngestionError[];
}

export interface SourceReport {
  source_id: number;
  source_name: string;
  fetched: number;
  created: number;
  merged: number;
  review_needed: number;
}

export interface IngestionError {
  source_id: number;
  error: string;
}

// ============================================================================
// EDITORIAL TYPES
// ============================================================================

export interface EditorialAction {
  id: number;
  action_type: string;
  event_id: number;
  actor: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export type EditorialActionType =
  | 'verify'
  | 'unverify'
  | 'pin'
  | 'unpin'
  | 'set_significance'
  | 'update_status'
  | 'merge'
  | 'archive';

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface SearchParams {
  q?: string;
  city?: string;
  region?: string;
  genre?: string;
  type?: EventType;
  status?: EventStatus;
  from?: string;
  to?: string;
  verified?: boolean;
  page?: number;
  per_page?: number;
  sort?: 'date' | 'relevance' | 'significance';
}

export interface SearchDocument {
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
