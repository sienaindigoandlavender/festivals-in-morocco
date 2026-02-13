/**
 * Data Client — Supabase
 *
 * Fetches event data from Supabase (festivals table).
 * Used by Vercel serverless API routes (/api/*).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// ============================================================================
// TYPES
// ============================================================================

export interface SheetEvent {
  id: string;
  name: string;
  slug: string;
  event_type: string;
  start_date: string;
  end_date: string | null;
  city: string;
  city_slug: string;
  region: string;
  region_slug: string;
  venue: string | null;
  genres: string[];
  artists: string[];
  organizer: string | null;
  official_website: string | null;
  ticket_url: string | null;
  status: string;
  is_verified: boolean;
  is_pinned: boolean;
  cultural_significance: number;
  description: string | null;
  image_url: string | null;
  // Multi-language
  title_en: string;
  title_fr: string;
  title_es: string;
  title_ar: string;
  description_fr: string | null;
  description_es: string | null;
  description_ar: string | null;
  // Pricing
  price_min: number;
  price_max: number;
  price_isFree: boolean;
  // Location
  lat: number;
  lng: number;
  // Contact
  email: string | null;
  phone: string | null;
  // Accessibility
  wheelchairAccess: boolean;
  signLanguage: boolean;
  audioDescription: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categoryToEventType(category: string): string {
  const map: Record<string, string> = {
    music: "festival",
    art: "festival",
    film: "festival",
    heritage: "ritual",
    food: "festival",
    spiritual: "ritual",
    dance: "festival",
    theatre: "showcase",
    literature: "conference",
    craft: "festival",
  };
  return map[category?.toLowerCase()] || "festival";
}

// ============================================================================
// IN-MEMORY CACHE (persists during serverless warm period)
// ============================================================================

let _cachedEvents: SheetEvent[] | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// MAIN FETCH
// ============================================================================

function rowToEvent(row: any): SheetEvent {
  const title = row.title_en || row.id;
  const city = row.city || "";
  const region = row.region || "";

  return {
    id: row.id,
    name: title,
    slug: slugify(title),
    event_type: categoryToEventType(row.category || "music"),
    start_date: row.start_date || "",
    end_date: row.end_date || null,
    city,
    city_slug: slugify(city),
    region,
    region_slug: slugify(region),
    venue: row.venue || null,
    genres: row.tags
      ? row.tags
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [],
    artists: [],
    organizer: row.organizer || null,
    official_website: row.website || null,
    ticket_url: null,
    status: row.status || "published",
    is_verified: true,
    is_pinned: false,
    cultural_significance: 5,
    description: row.description_en || null,
    image_url: row.image || null,
    title_en: title,
    title_fr: row.title_fr || "",
    title_es: row.title_es || "",
    title_ar: row.title_ar || "",
    description_fr: row.description_fr || null,
    description_es: row.description_es || null,
    description_ar: row.description_ar || null,
    price_min: parseFloat(row.price_min) || 0,
    price_max: parseFloat(row.price_max) || 0,
    price_isFree: row.price_is_free || false,
    lat: parseFloat(row.lat) || 0,
    lng: parseFloat(row.lng) || 0,
    email: row.email || null,
    phone: row.phone || null,
    wheelchairAccess: row.wheelchair_access || false,
    signLanguage: row.sign_language || false,
    audioDescription: row.audio_description || false,
  };
}

export async function fetchEvents(): Promise<SheetEvent[]> {
  if (_cachedEvents && Date.now() - _cacheTimestamp < CACHE_TTL) {
    return _cachedEvents;
  }

  try {
    const { data, error } = await getSupabase()
      .from("festivals")
      .select("*")
      .eq("status", "published")
      .order("start_date", { ascending: true });

    if (error) throw error;

    const events = (data || []).map(rowToEvent);
    console.log(`[Festivals API] Loaded ${events.length} events from Supabase`);

    _cachedEvents = events;
    _cacheTimestamp = Date.now();
    return events;
  } catch (error) {
    console.error("[Festivals API] Failed to fetch from Supabase:", error);
    if (_cachedEvents) return _cachedEvents;
    return [];
  }
}

export async function fetchCities(): Promise<
  { name: string; slug: string; region: string; count: number }[]
> {
  const events = await fetchEvents();
  const cityMap = new Map<
    string,
    { name: string; slug: string; region: string; count: number }
  >();

  for (const event of events) {
    const existing = cityMap.get(event.city_slug);
    if (existing) {
      existing.count++;
    } else {
      cityMap.set(event.city_slug, {
        name: event.city,
        slug: event.city_slug,
        region: event.region,
        count: 1,
      });
    }
  }

  return Array.from(cityMap.values()).sort((a, b) => b.count - a.count);
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

export function getUpcomingEvents(events: SheetEvent[]): SheetEvent[] {
  const today = new Date().toISOString().split("T")[0];
  return events
    .filter((e) => e.start_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
}

export function getEventsByCity(
  events: SheetEvent[],
  citySlug: string
): SheetEvent[] {
  return events.filter((e) => e.city_slug === citySlug);
}

export function getEventsByGenre(
  events: SheetEvent[],
  genre: string
): SheetEvent[] {
  const genreLower = genre.toLowerCase();
  return events.filter((e) =>
    e.genres.some(
      (g) => g.toLowerCase() === genreLower || slugify(g) === genreLower
    )
  );
}

export function getEventsByMonth(
  events: SheetEvent[],
  year: number,
  month: number
): SheetEvent[] {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  return events.filter((e) => e.start_date.startsWith(monthStr));
}

export function getEventBySlug(
  events: SheetEvent[],
  slug: string
): SheetEvent | undefined {
  return events.find((e) => e.slug === slug || e.id === slug);
}

// ============================================================================
// AGGREGATION HELPERS
// ============================================================================

export function getUniqueCities(
  events: SheetEvent[]
): { name: string; slug: string; region: string; count: number }[] {
  const cityMap = new Map<
    string,
    { name: string; slug: string; region: string; count: number }
  >();

  for (const event of events) {
    const existing = cityMap.get(event.city_slug);
    if (existing) {
      existing.count++;
    } else {
      cityMap.set(event.city_slug, {
        name: event.city,
        slug: event.city_slug,
        region: event.region,
        count: 1,
      });
    }
  }

  return Array.from(cityMap.values()).sort((a, b) => b.count - a.count);
}

export function getUniqueGenres(
  events: SheetEvent[]
): { name: string; slug: string; count: number }[] {
  const genreMap = new Map<
    string,
    { name: string; slug: string; count: number }
  >();

  for (const event of events) {
    for (const genre of event.genres) {
      const gSlug = slugify(genre);
      const existing = genreMap.get(gSlug);
      if (existing) {
        existing.count++;
      } else {
        genreMap.set(gSlug, { name: genre, slug: gSlug, count: 1 });
      }
    }
  }

  return Array.from(genreMap.values()).sort((a, b) => b.count - a.count);
}

export function getUniqueRegions(
  events: SheetEvent[]
): { name: string; slug: string; count: number }[] {
  const regionMap = new Map<
    string,
    { name: string; slug: string; count: number }
  >();

  for (const event of events) {
    const existing = regionMap.get(event.region_slug);
    if (existing) {
      existing.count++;
    } else {
      regionMap.set(event.region_slug, {
        name: event.region,
        slug: event.region_slug,
        count: 1,
      });
    }
  }

  return Array.from(regionMap.values()).sort((a, b) => b.count - a.count);
}
