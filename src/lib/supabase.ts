import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// SUPABASE CLIENT — Site-specific (lazy-initialized)
// =============================================================================

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url =
      import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
      import.meta.env.PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "";

    const key =
      import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";

    if (!url || !key) {
      throw new Error("Supabase URL and anon key are required. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }

    _supabase = createClient(url, key);
  }
  return _supabase;
}

// =============================================================================
// NEXUS SUPABASE CLIENT — Shared across all brands
// =============================================================================

let _nexus: SupabaseClient | null = null;

function getNexus(): SupabaseClient {
  if (!_nexus) {
    const url =
      import.meta.env.NEXUS_SUPABASE_URL ||
      process.env.NEXUS_SUPABASE_URL ||
      "";

    const key =
      import.meta.env.NEXUS_SUPABASE_ANON_KEY ||
      process.env.NEXUS_SUPABASE_ANON_KEY ||
      "";

    if (!url || !key) {
      throw new Error("Nexus Supabase URL and anon key are required.");
    }

    _nexus = createClient(url, key);
  }
  return _nexus;
}

const SITE_ID = "festivals-morocco";

// =============================================================================
// BUILD-TIME CACHE
// =============================================================================
declare global {
  // eslint-disable-next-line no-var
  var __festivalsCache:
    | {
        siteSettings: SiteSettings | null;
        events: SheetEvent[] | null;
        legalPages: LegalPage[] | null;
      }
    | undefined;
}

if (!globalThis.__festivalsCache) {
  globalThis.__festivalsCache = {
    siteSettings: null,
    events: null,
    legalPages: null,
  };
}

const cache = globalThis.__festivalsCache!;

// =============================================================================
// LEGAL PAGES (from Nexus Supabase)
// =============================================================================

export interface LegalPage {
  label: string;
  href: string;
}

export async function getLegalPages(): Promise<LegalPage[]> {
  if (cache.legalPages !== null) {
    return cache.legalPages;
  }

  try {
    const { data, error } = await getNexus()
      .from("nexus_legal_pages")
      .select("page_id, page_title")
      .order("page_id");

    if (error || !data) {
      console.error("[Nexus] Legal pages error:", error?.message);
      cache.legalPages = getFallbackLegalPages();
      return cache.legalPages;
    }

    const uniquePages = new Map<string, string>();
    for (const p of data) {
      if (p.page_id && p.page_title && !uniquePages.has(p.page_id)) {
        uniquePages.set(p.page_id, p.page_title);
      }
    }

    const contentLegalPageIds = [
      "privacy",
      "terms",
      "disclaimer",
      "intellectual-property",
    ];

    const result: LegalPage[] = [];
    for (const pageId of contentLegalPageIds) {
      const pageTitle = uniquePages.get(pageId);
      if (pageTitle) {
        result.push({ label: pageTitle, href: `/${pageId}` });
      }
    }

    cache.legalPages = result.length > 0 ? result : getFallbackLegalPages();
    return cache.legalPages;
  } catch (error) {
    console.error("Could not fetch legal pages from Nexus:", error);
    cache.legalPages = getFallbackLegalPages();
    return cache.legalPages;
  }
}

function getFallbackLegalPages(): LegalPage[] {
  return [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Disclaimer", href: "/disclaimer" },
    { label: "Intellectual Property", href: "/intellectual-property" },
  ];
}

interface NexusSite {
  site_name: string;
  site_url: string;
  legal_entity: string;
  contact_email: string;
  contact_phone: string | null;
  jurisdiction_country: string;
  jurisdiction_city: string;
  address_line1: string;
  address_line2: string;
}

export interface LegalPageContent {
  page_id: string;
  page_title: string;
  sections: {
    section_title: string;
    section_content: string;
  }[];
}

export async function getLegalPageContent(
  pageId: string
): Promise<LegalPageContent | null> {
  try {
    // Fetch sections and site config in parallel
    const [sectionsResult, siteResult] = await Promise.all([
      getNexus()
        .from("nexus_legal_pages")
        .select("*")
        .eq("page_id", pageId)
        .order("section_order", { ascending: true }),
      getNexus()
        .from("nexus_sites")
        .select("*")
        .eq("site_id", SITE_ID)
        .maybeSingle(),
    ]);

    const sections = sectionsResult.data || [];
    if (sections.length === 0) return null;

    const site = siteResult.data as NexusSite | null;

    // Build replacements from site config or use fallbacks
    const replacements: Record<string, string> = {
      "{{site_name}}": site?.site_name || "Festivals in Morocco",
      "{{site_url}}": site?.site_url || "https://festivalsinmorocco.com",
      "{{legal_entity}}": site?.legal_entity || "Dancing with Lions",
      "{{contact_email}}": site?.contact_email || "hello@festivalsinmorocco.com",
      "{{contact_phone}}": site?.contact_phone || "",
      "{{jurisdiction_country}}": site?.jurisdiction_country || "Morocco",
      "{{jurisdiction_city}}": site?.jurisdiction_city || "Marrakech",
      "{{address_line1}}": site?.address_line1 || "35 Derb Fhal Zfriti Kennaria",
      "{{address_line2}}": site?.address_line2 || "Marrakech 40000 Morocco",
    };

    const replaceVariables = (text: string): string => {
      let result = text;
      for (const [key, value] of Object.entries(replacements)) {
        result = result.split(key).join(value);
      }
      return result;
    };

    return {
      page_id: pageId,
      page_title: sections[0].page_title,
      sections: sections.map((s: any) => ({
        section_title: replaceVariables(s.section_title || ""),
        section_content: replaceVariables(s.section_content || ""),
      })),
    };
  } catch (error) {
    console.error(`Error fetching legal page ${pageId}:`, error);
    return null;
  }
}

// =============================================================================
// SITE SETTINGS — from Supabase
// =============================================================================

export interface SiteSettings {
  hero_image: string;
  hero_title: string;
  hero_subtitle: string;
  hero_label: string;
  newsletter_title: string;
  newsletter_description: string;
  newsletter_background_image: string;
  site_name: string;
  site_tagline: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  hero_image: "",
  hero_title: "Culture lives here",
  hero_subtitle:
    "From ancient festivals to contemporary celebrations — discover Morocco's vibrant cultural traditions",
  hero_label: "Festivals in Morocco",
  newsletter_title: "Stay connected",
  newsletter_description:
    "Festivals, events, and cultural moments — delivered when they matter.",
  newsletter_background_image: "",
  site_name: "Festivals in Morocco",
  site_tagline: "Discover festivals and cultural events in Morocco",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  if (cache.siteSettings !== null) {
    return cache.siteSettings;
  }

  try {
    const { data, error } = await getSupabase()
      .from("site_settings")
      .select("key, value");

    if (error) throw error;
    if (!data || data.length === 0) {
      cache.siteSettings = DEFAULT_SETTINGS;
      return DEFAULT_SETTINGS;
    }

    const settings: Record<string, string> = {};
    for (const row of data) {
      settings[row.key] = row.value;
    }

    console.log(
      "[Festivals] Loaded",
      Object.keys(settings).length,
      "site settings from Supabase"
    );

    cache.siteSettings = {
      hero_image: settings.hero_image || DEFAULT_SETTINGS.hero_image,
      hero_title: settings.hero_title || DEFAULT_SETTINGS.hero_title,
      hero_subtitle: settings.hero_subtitle || DEFAULT_SETTINGS.hero_subtitle,
      hero_label: settings.hero_label || DEFAULT_SETTINGS.hero_label,
      newsletter_title:
        settings.newsletter_title || DEFAULT_SETTINGS.newsletter_title,
      newsletter_description:
        settings.newsletter_description ||
        DEFAULT_SETTINGS.newsletter_description,
      newsletter_background_image:
        settings.newsletter_background_image ||
        DEFAULT_SETTINGS.newsletter_background_image,
      site_name: settings.site_name || DEFAULT_SETTINGS.site_name,
      site_tagline: settings.site_tagline || DEFAULT_SETTINGS.site_tagline,
    };
    return cache.siteSettings;
  } catch (error) {
    console.error("Error fetching site settings from Supabase:", error);
    cache.siteSettings = DEFAULT_SETTINGS;
    return DEFAULT_SETTINGS;
  }
}

// =============================================================================
// EVENTS — from Supabase
// =============================================================================

export interface SheetEvent {
  id: string;
  slug: string;
  title_en: string;
  title_fr?: string;
  title_es?: string;
  title_ar?: string;
  description_en: string;
  description_fr?: string;
  description_es?: string;
  description_ar?: string;
  category: string;
  region: string;
  city: string;
  venue?: string;
  startDate: string;
  endDate?: string;
  price_min?: number;
  price_max?: number;
  price_isFree: boolean;
  image?: string;
  tags: string[];
  lat?: number;
  lng?: number;
  organizer?: string;
  website?: string;
  email?: string;
  phone?: string;
  wheelchairAccess?: boolean;
  signLanguage?: boolean;
  audioDescription?: boolean;
  status: string;
}

export async function getSheetEvents(): Promise<SheetEvent[]> {
  if (cache.events !== null) {
    return cache.events;
  }

  try {
    const { data, error } = await getSupabase()
      .from("festivals")
      .select("*")
      .eq("status", "published")
      .order("start_date", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) {
      cache.events = [];
      return [];
    }

    const events: SheetEvent[] = data.map((row: any) => ({
      id: row.id,
      slug: row.id,
      title_en: row.title_en || row.id,
      title_fr: row.title_fr || "",
      title_es: row.title_es || "",
      title_ar: row.title_ar || "",
      description_en: row.description_en || "",
      description_fr: row.description_fr || "",
      description_es: row.description_es || "",
      description_ar: row.description_ar || "",
      category: row.category || "festival",
      region: row.region || "",
      city: row.city || "",
      venue: row.venue || "",
      startDate: row.start_date || "",
      endDate: row.end_date || row.start_date || "",
      price_min: parseFloat(row.price_min) || 0,
      price_max: parseFloat(row.price_max) || 0,
      price_isFree: row.price_is_free || false,
      image: row.image || "",
      tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()) : [],
      lat: parseFloat(row.lat) || 0,
      lng: parseFloat(row.lng) || 0,
      organizer: row.organizer || "",
      website: row.website || "",
      email: row.email || "",
      phone: row.phone || "",
      wheelchairAccess: row.wheelchair_access || false,
      signLanguage: row.sign_language || false,
      audioDescription: row.audio_description || false,
      status: row.status || "published",
    }));

    console.log(
      "[Festivals] Loaded",
      events.length,
      "events from Supabase"
    );

    cache.events = events;
    return events;
  } catch (error) {
    console.error("Error fetching events from Supabase:", error);
    cache.events = [];
    return [];
  }
}

// Legacy compatibility — getSheetData for any generic table
export async function getSheetData(tabName: string): Promise<any[]> {
  if (tabName === "Festivals") {
    return getSheetEvents();
  }
  if (tabName === "Site_Settings") {
    const settings = await getSiteSettings();
    return Object.entries(settings).map(([key, value]) => ({ key, value }));
  }
  // Fallback — shouldn't be called for migrated tables
  console.warn(`[Festivals] getSheetData called for unmigrated tab: ${tabName}`);
  return [];
}
