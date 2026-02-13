import { google } from "googleapis";

// =============================================================================
// BUILD-TIME CACHE - Uses globalThis to persist across Astro page builds
// =============================================================================
declare global {
  var __festivalsCache: {
    siteSettings: any | null;
    events: any[] | null;
    legalPages: any[] | null;
    sheetData: Map<string, any[]>;
  } | undefined;
}

// Initialize global cache if it doesn't exist
if (!globalThis.__festivalsCache) {
  globalThis.__festivalsCache = {
    siteSettings: null,
    events: null,
    legalPages: null,
    sheetData: new Map(),
  };
}

const cache = globalThis.__festivalsCache;

const getGoogleSheetsClient = () => {
  const base64Creds = import.meta.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (!base64Creds) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_BASE64 is not set");
  }

  const credentials = JSON.parse(
    Buffer.from(base64Creds, "base64").toString("utf-8")
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
};

// Nexus shared database (legal pages, etc.)
const NEXUS_SHEET_ID = "1OIw-cgup17vdimqveVNOmSBSrRbykuTVM39Umm-PJtQ";

// Festivals Morocco sheet
const SHEET_ID = import.meta.env.GOOGLE_SHEET_ID || "1LjfPpLzpuQEkeb34MYrrTFad_PM1wjiS4vPS67sNML0";

const SITE_ID = "festivals-morocco";

export interface LegalPage {
  label: string;
  href: string;
}

// Fetch data from Nexus shared database (with caching)
export async function getNexusData(tabName: string): Promise<any[]> {
  // Check cache first
  const cacheKey = `nexus:${tabName}`;
  if (cache.sheetData.has(cacheKey)) {
    return cache.sheetData.get(cacheKey)!;
  }

  try {
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: NEXUS_SHEET_ID,
      range: `${tabName}!A1:ZZ`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      cache.sheetData.set(cacheKey, []);
      return [];
    }

    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index] || "";
      });
      return obj;
    });

    cache.sheetData.set(cacheKey, data);
    return data;
  } catch (error: any) {
    console.error(`Error fetching Nexus sheet "${tabName}":`, error.message);
    cache.sheetData.set(cacheKey, []);
    return [];
  }
}

// Get legal pages from Nexus - filtered for content sites (with caching)
export async function getLegalPages(): Promise<LegalPage[]> {
  // Check cache first
  if (cache.legalPages !== null) {
    console.log("[Festivals] Legal pages (cached)");
    return cache.legalPages;
  }

  try {
    console.log("[Festivals] Fetching legal pages from Nexus");
    const legalPages = await getNexusData("Nexus_Legal_Pages");

    // Get unique pages (sheet has multiple rows per page for sections)
    const uniquePages = new Map<string, string>();
    for (const p of legalPages) {
      if (p.page_id && p.page_title && !uniquePages.has(p.page_id)) {
        uniquePages.set(p.page_id, p.page_title);
      }
    }

    // Content sites need these specific legal pages in this order
    const contentLegalPageIds = ['privacy', 'terms', 'disclaimer', 'intellectual-property'];
    
    const result: LegalPage[] = [];
    for (const pageId of contentLegalPageIds) {
      const pageTitle = uniquePages.get(pageId);
      if (pageTitle) {
        result.push({
          label: pageTitle,
          href: `/${pageId}`,
        });
      }
    }

    console.log("[Festivals] Legal pages from Nexus:", result.map(p => p.label));
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

export interface LegalPageContent {
  page_id: string;
  page_title: string;
  sections: {
    section_title: string;
    section_content: string;
  }[];
}

// Get full content for a specific legal page
export async function getLegalPageContent(pageId: string): Promise<LegalPageContent | null> {
  try {
    const allPages = await getNexusData("Nexus_Legal_Pages");
    
    // Filter for the specific page
    const pageSections = allPages.filter((p: any) => p.page_id === pageId);
    
    if (pageSections.length === 0) {
      console.warn(`Legal page not found: ${pageId}`);
      return null;
    }
    
    // Sort by section_order and build content
    const sorted = pageSections.sort((a: any, b: any) => 
      parseInt(a.section_order) - parseInt(b.section_order)
    );
    
    // Replace template variables for Festivals Morocco
    const replacements: Record<string, string> = {
      '{{site_name}}': 'Festivals in Morocco',
      '{{site_url}}': 'https://festivalsinmorocco.com',
      '{{legal_entity}}': 'Dancing with Lions',
      '{{contact_email}}': 'hello@festivalsinmorocco.com',
      '{{jurisdiction_country}}': 'Morocco',
      '{{jurisdiction_city}}': 'Marrakech',
      '{{address_line1}}': '35 Derb Fhal Zfriti Kennaria',
      '{{address_line2}}': 'Marrakech 40000 Morocco',
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
      page_title: sorted[0].page_title,
      sections: sorted.map((s: any) => ({
        section_title: replaceVariables(s.section_title || ''),
        section_content: replaceVariables(s.section_content || ''),
      })),
    };
  } catch (error) {
    console.error(`Error fetching legal page ${pageId}:`, error);
    return null;
  }
}

// =============================================================================
// SITE SETTINGS - Hero & Newsletter Banners
// =============================================================================

export interface SiteSettings {
  // Hero section
  hero_image: string;
  hero_title: string;
  hero_subtitle: string;
  hero_label: string;
  
  // Newsletter section
  newsletter_title: string;
  newsletter_description: string;
  newsletter_background_image: string;
  
  // Site info
  site_name: string;
  site_tagline: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  hero_image: '',
  hero_title: 'Culture lives here',
  hero_subtitle: 'From ancient festivals to contemporary celebrations — discover Morocco\'s vibrant cultural traditions',
  hero_label: 'Festivals in Morocco',
  newsletter_title: 'Stay connected',
  newsletter_description: 'Festivals, events, and cultural moments — delivered when they matter.',
  newsletter_background_image: '',
  site_name: 'Festivals in Morocco',
  site_tagline: 'Discover festivals and cultural events in Morocco',
};

// Fetch data from Festivals Morocco sheet
export async function getSheetData(tabName: string): Promise<any[]> {
  // Check cache first
  const cacheKey = `sheet:${tabName}`;
  if (cache.sheetData.has(cacheKey)) {
    return cache.sheetData.get(cacheKey)!;
  }

  try {
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${tabName}!A1:ZZ`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      cache.sheetData.set(cacheKey, []);
      return [];
    }

    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index] || "";
      });
      return obj;
    });

    cache.sheetData.set(cacheKey, data);
    return data;
  } catch (error: any) {
    console.error(`Error fetching sheet "${tabName}":`, error.message);
    cache.sheetData.set(cacheKey, []);
    return [];
  }
}

// Get site settings from Google Sheets (with caching)
// Sheet tab: Site_Settings with columns: key, value
export async function getSiteSettings(): Promise<SiteSettings> {
  // Check cache first
  if (cache.siteSettings !== null) {
    console.log("[Festivals] Site settings (cached)");
    return cache.siteSettings;
  }

  try {
    console.log("[Festivals] Fetching Site_Settings from sheet:", SHEET_ID);
    const rows = await getSheetData("Site_Settings");
    
    if (rows.length === 0) {
      console.log("[Festivals] No Site_Settings found, using defaults");
      cache.siteSettings = DEFAULT_SETTINGS;
      return DEFAULT_SETTINGS;
    }
    
    // Convert rows to key-value object
    const settings: Record<string, string> = {};
    for (const row of rows) {
      if (row.key && row.value !== undefined) {
        settings[row.key] = row.value;
      }
    }
    
    console.log("[Festivals] Loaded", Object.keys(settings).length, "site settings");
    
    cache.siteSettings = {
      hero_image: settings.hero_image || DEFAULT_SETTINGS.hero_image,
      hero_title: settings.hero_title || DEFAULT_SETTINGS.hero_title,
      hero_subtitle: settings.hero_subtitle || DEFAULT_SETTINGS.hero_subtitle,
      hero_label: settings.hero_label || DEFAULT_SETTINGS.hero_label,
      newsletter_title: settings.newsletter_title || DEFAULT_SETTINGS.newsletter_title,
      newsletter_description: settings.newsletter_description || DEFAULT_SETTINGS.newsletter_description,
      newsletter_background_image: settings.newsletter_background_image || DEFAULT_SETTINGS.newsletter_background_image,
      site_name: settings.site_name || DEFAULT_SETTINGS.site_name,
      site_tagline: settings.site_tagline || DEFAULT_SETTINGS.site_tagline,
    };
    return cache.siteSettings;
  } catch (error) {
    console.error("Error fetching site settings:", error);
    cache.siteSettings = DEFAULT_SETTINGS;
    return DEFAULT_SETTINGS;
  }
}

// =============================================================================
// EVENTS FROM GOOGLE SHEETS
// =============================================================================

export interface SheetEvent {
  id: string;
  slug: string;
  title_en: string;
  title_ar?: string;
  description_en: string;
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
  status: string;
}

export async function getSheetEvents(): Promise<SheetEvent[]> {
  // Check cache first
  if (cache.events !== null) {
    console.log("[Festivals] Events (cached):", cache.events.length);
    return cache.events;
  }

  try {
    console.log("[Festivals] Fetching events from sheet:", SHEET_ID);
    const rows = await getSheetData("Festivals");
    
    if (rows.length === 0) {
      console.log("[Festivals] No events found in sheet");
      cache.events = [];
      return [];
    }
    
    const events: SheetEvent[] = rows
      .filter((row: any) => row.status === 'published' && row.id)
      .map((row: any) => ({
        id: row.id,
        slug: row.id, // Use id as slug
        title_en: row.title_en || row.id,
        title_ar: row.title_ar || '',
        description_en: row.description_en || '',
        category: row.category || 'festival',
        region: row.region || '',
        city: row.city || '',
        venue: row.venue || '',
        startDate: row.startDate || '',
        endDate: row.endDate || row.startDate || '',
        price_min: parseFloat(row.price_min) || 0,
        price_max: parseFloat(row.price_max) || 0,
        price_isFree: row.price_isFree === 'TRUE' || row.price_isFree === true,
        image: row.image || '',
        tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
        lat: parseFloat(row.lat) || 0,
        lng: parseFloat(row.lng) || 0,
        organizer: row.organizer || '',
        website: row.website || '',
        email: row.email || '',
        phone: row.phone || '',
        status: row.status || 'published',
      }));
    
    console.log("[Festivals] Processed", events.length, "events");
    
    cache.events = events;
    return events;
  } catch (error) {
    console.error("Error fetching events from sheet:", error);
    cache.events = [];
    return [];
  }
}
