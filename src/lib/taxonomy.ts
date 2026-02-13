// Morocco Event Taxonomy - Constitutional Definitions
// This file defines the canonical classification system.
// Changes here affect the entire system's integrity.

// =============================================================================
// AXIS 1: EVENT TYPE (Primary, Mandatory)
// =============================================================================

export enum EventType {
  FESTIVAL = 'festival',
  CONCERT = 'concert',
  MOUSSEM = 'moussem',
  LILA = 'lila',
  SHOWCASE = 'showcase',
  GATHERING = 'gathering'
}

export const EventTypeLabels: Record<EventType, string> = {
  [EventType.FESTIVAL]: 'Festival',
  [EventType.CONCERT]: 'Concert',
  [EventType.MOUSSEM]: 'Moussem',
  [EventType.LILA]: 'Lila / Ritual',
  [EventType.SHOWCASE]: 'Showcase / Market',
  [EventType.GATHERING]: 'Gathering'
};

export const EventTypeDescriptions: Record<EventType, string> = {
  [EventType.FESTIVAL]: 'Organized, programmed multi-day event with scheduled performances',
  [EventType.CONCERT]: 'Single-session musical performance at a specific venue',
  [EventType.MOUSSEM]: 'Traditional gathering tied to spiritual, agricultural, or seasonal cycle',
  [EventType.LILA]: 'Sacred musical ceremony with ritual function',
  [EventType.SHOWCASE]: 'Industry-oriented event for professional networking and artist discovery',
  [EventType.GATHERING]: 'Communal musical event rooted in local community practice'
};

// =============================================================================
// AXIS 2: MUSIC TRADITION (Secondary, Multi-Select)
// =============================================================================

export enum TraditionCategory {
  ROOTED = 'rooted',
  HYBRID = 'hybrid',
  IMPORTED = 'imported'
}

export const TraditionCategoryLabels: Record<TraditionCategory, string> = {
  [TraditionCategory.ROOTED]: 'Rooted Tradition',
  [TraditionCategory.HYBRID]: 'Hybrid / Contemporary',
  [TraditionCategory.IMPORTED]: 'International'
};

export interface MusicTradition {
  id: string;
  name: string;
  name_ar?: string;
  name_tzm?: string;
  category: TraditionCategory;
  sacred: boolean;
  regions?: string[];
  description: string;
}

// Canonical tradition definitions
export const MUSIC_TRADITIONS: Record<string, MusicTradition> = {
  // Rooted Traditions
  gnawa: {
    id: 'gnawa',
    name: 'Gnawa',
    name_ar: 'كناوة',
    category: TraditionCategory.ROOTED,
    sacred: true,
    regions: ['marrakech-safi', 'casablanca-settat', 'rabat-sale-kenitra'],
    description: 'Spiritual-musical tradition of sub-Saharan heritage, centered on trance ceremony (lila)'
  },
  andalusi: {
    id: 'andalusi',
    name: 'Al-Ala (Andalusian)',
    name_ar: 'الآلة',
    category: TraditionCategory.ROOTED,
    sacred: false,
    regions: ['fes-meknes', 'tanger-tetouan-al-hoceima', 'rabat-sale-kenitra'],
    description: 'Classical tradition inherited from Al-Andalus, organized in nawba suites'
  },
  malhun: {
    id: 'malhun',
    name: 'Malhun',
    name_ar: 'الملحون',
    category: TraditionCategory.ROOTED,
    sacred: false,
    regions: ['fes-meknes', 'marrakech-safi'],
    description: 'Moroccan sung poetry tradition in colloquial Arabic'
  },
  ahwach: {
    id: 'ahwach',
    name: 'Ahwach',
    name_tzm: 'ⴰⵀⵡⴰⵛ',
    category: TraditionCategory.ROOTED,
    sacred: false,
    regions: ['souss-massa', 'draa-tafilalet', 'marrakech-safi'],
    description: 'Collective dance-music of High Atlas Amazigh communities'
  },
  ahidous: {
    id: 'ahidous',
    name: 'Ahidous',
    name_tzm: 'ⴰⵃⵉⴷⵓⵙ',
    category: TraditionCategory.ROOTED,
    sacred: false,
    regions: ['fes-meknes', 'beni-mellal-khenifra'],
    description: 'Collective tradition of Middle Atlas Amazigh'
  },
  rways: {
    id: 'rways',
    name: 'Rways',
    name_tzm: 'ⵔⵡⴰⵢⵙ',
    category: TraditionCategory.ROOTED,
    sacred: false,
    regions: ['souss-massa'],
    description: 'Souss region tradition with professional poet-musicians'
  },
  reggada: {
    id: 'reggada',
    name: 'Reggada',
    name_ar: 'الركادة',
    category: TraditionCategory.ROOTED,
    sacred: false,
    regions: ['oriental', 'tanger-tetouan-al-hoceima'],
    description: 'Rif and Eastern Morocco tradition with rifle dances'
  },
  issawa: {
    id: 'issawa',
    name: 'Issawa',
    name_ar: 'عيساوة',
    category: TraditionCategory.ROOTED,
    sacred: true,
    regions: ['fes-meknes'],
    description: 'Sufi brotherhood tradition centered in Meknes'
  },
  hamadcha: {
    id: 'hamadcha',
    name: 'Hamadcha',
    name_ar: 'حمادشة',
    category: TraditionCategory.ROOTED,
    sacred: true,
    regions: ['fes-meknes'],
    description: 'Sufi brotherhood associated with Sidi Ali ben Hamdouch'
  },
  aita: {
    id: 'aita',
    name: 'Aita',
    name_ar: 'العيطة',
    category: TraditionCategory.ROOTED,
    sacred: false,
    regions: ['casablanca-settat', 'marrakech-safi', 'beni-mellal-khenifra'],
    description: 'Rural/popular tradition of Atlantic plains'
  },
  dakka: {
    id: 'dakka',
    name: 'Dakka Marrakchia',
    name_ar: 'الدقة المراكشية',
    category: TraditionCategory.ROOTED,
    sacred: false,
    regions: ['marrakech-safi'],
    description: 'Percussion ensemble tradition of Marrakech artisan guilds'
  },
  hassani: {
    id: 'hassani',
    name: 'Hassani',
    name_ar: 'الحساني',
    category: TraditionCategory.ROOTED,
    sacred: false,
    regions: ['laayoune-sakia-el-hamra', 'dakhla-oued-ed-dahab', 'guelmim-oued-noun'],
    description: 'Sahrawi tradition of southern Morocco'
  },
  sufi: {
    id: 'sufi',
    name: 'Sufi / Sacred',
    name_ar: 'صوفي',
    category: TraditionCategory.ROOTED,
    sacred: true,
    description: 'Sufi devotional music traditions'
  },

  // Hybrid Traditions
  chaabi: {
    id: 'chaabi',
    name: 'Chaabi',
    name_ar: 'الشعبي',
    category: TraditionCategory.HYBRID,
    sacred: false,
    description: 'Popular urban music, emerged mid-20th century'
  },
  'rai-ma': {
    id: 'rai-ma',
    name: 'Moroccan Raï',
    name_ar: 'الراي',
    category: TraditionCategory.HYBRID,
    sacred: false,
    regions: ['oriental'],
    description: 'Moroccan variant of raï, especially in Oujda region'
  },
  fusion: {
    id: 'fusion',
    name: 'Moroccan Fusion',
    category: TraditionCategory.HYBRID,
    sacred: false,
    description: 'Contemporary synthesis: Gnawa-jazz, Amazigh-electronic, etc.'
  },
  nayda: {
    id: 'nayda',
    name: 'Nayda',
    category: TraditionCategory.HYBRID,
    sacred: false,
    description: 'Post-2000 alternative/rock/hip-hop movement'
  },
  'rap-ma': {
    id: 'rap-ma',
    name: 'Moroccan Hip-Hop',
    category: TraditionCategory.HYBRID,
    sacred: false,
    description: 'Darija-language hip-hop'
  },

  // Imported Traditions
  jazz: {
    id: 'jazz',
    name: 'Jazz',
    category: TraditionCategory.IMPORTED,
    sacred: false,
    description: 'International jazz'
  },
  electronic: {
    id: 'electronic',
    name: 'Electronic',
    category: TraditionCategory.IMPORTED,
    sacred: false,
    description: 'House, techno, ambient'
  },
  rock: {
    id: 'rock',
    name: 'Rock',
    category: TraditionCategory.IMPORTED,
    sacred: false,
    description: 'Rock and metal'
  },
  'classical-western': {
    id: 'classical-western',
    name: 'Western Classical',
    category: TraditionCategory.IMPORTED,
    sacred: false,
    description: 'Orchestral, chamber music'
  },
  'pop-intl': {
    id: 'pop-intl',
    name: 'International Pop',
    category: TraditionCategory.IMPORTED,
    sacred: false,
    description: 'Global commercial pop'
  },
  world: {
    id: 'world',
    name: 'World Music',
    category: TraditionCategory.IMPORTED,
    sacred: false,
    description: 'Industry category for cross-cultural programming'
  },
  reggae: {
    id: 'reggae',
    name: 'Reggae',
    category: TraditionCategory.IMPORTED,
    sacred: false,
    description: 'Jamaican tradition present in Morocco'
  },
  rnb: {
    id: 'rnb',
    name: 'R&B / Soul',
    category: TraditionCategory.IMPORTED,
    sacred: false,
    description: 'American tradition'
  },
  blues: {
    id: 'blues',
    name: 'Blues',
    category: TraditionCategory.IMPORTED,
    sacred: false,
    description: 'American blues tradition'
  },
  'desert-blues': {
    id: 'desert-blues',
    name: 'Desert Blues',
    category: TraditionCategory.IMPORTED,
    sacred: false,
    description: 'Saharan blues tradition (Tinariwen, etc.)'
  }
};

// Helper to get tradition by ID
export function getTradition(id: string): MusicTradition | undefined {
  return MUSIC_TRADITIONS[id];
}

// Helper to get traditions by category
export function getTraditionsByCategory(category: TraditionCategory): MusicTradition[] {
  return Object.values(MUSIC_TRADITIONS).filter(t => t.category === category);
}

// =============================================================================
// AXIS 3: CULTURAL WEIGHT (Internal)
// =============================================================================

export type CulturalWeightValue = 1 | 2 | 3 | 4 | 5;

export interface CulturalWeight {
  value: CulturalWeightValue;
  rationale: string;
}

export const CulturalWeightDescriptions: Record<CulturalWeightValue, string> = {
  5: 'UNESCO-recognized heritage, sacred ceremonies, exceptional significance',
  4: 'Established traditions with multi-generational continuity',
  3: 'Documented Moroccan traditions, established contemporary forms',
  2: 'Moroccan events featuring primarily imported forms',
  1: 'Commercial events with minimal cultural specificity'
};

// Minimum weights by event type
export const MinimumWeightByEventType: Partial<Record<EventType, CulturalWeightValue>> = {
  [EventType.MOUSSEM]: 3,
  [EventType.LILA]: 4,
  [EventType.GATHERING]: 2
};

// =============================================================================
// AXIS 4: TEMPORAL NATURE
// =============================================================================

export enum TemporalType {
  FIXED_ANNUAL = 'fixed_annual',
  APPROXIMATE_ANNUAL = 'approx_annual',
  LUNAR = 'lunar',
  AGRICULTURAL = 'agricultural',
  IRREGULAR = 'irregular',
  ONE_TIME = 'one_time',
  CONTINUOUS = 'continuous',
  UNCERTAIN = 'uncertain'
}

export const TemporalTypeLabels: Record<TemporalType, string> = {
  [TemporalType.FIXED_ANNUAL]: 'Annual (fixed dates)',
  [TemporalType.APPROXIMATE_ANNUAL]: 'Annual (approximate)',
  [TemporalType.LUNAR]: 'Islamic Calendar',
  [TemporalType.AGRICULTURAL]: 'Agricultural/Seasonal',
  [TemporalType.IRREGULAR]: 'Irregular',
  [TemporalType.ONE_TIME]: 'One-time',
  [TemporalType.CONTINUOUS]: 'Continuous/Season-long',
  [TemporalType.UNCERTAIN]: 'Uncertain'
};

export enum DatePrecision {
  EXACT = 'exact',
  APPROXIMATE = 'approximate',
  UNKNOWN = 'unknown'
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface EventTiming {
  temporal_type: TemporalType;
  gregorian_start?: string;
  gregorian_end?: string;
  date_precision: DatePrecision;
  islamic_month?: number;
  islamic_day?: number;
  season?: Season;
  recurrence_notes?: string;
}

// =============================================================================
// AXIS 5: LOCATION MODEL
// =============================================================================

export enum LocationType {
  FIXED_VENUE = 'fixed_venue',
  CITY_AREA = 'city_area',
  RURAL = 'rural',
  NOMADIC = 'nomadic',
  MULTIPLE = 'multiple'
}

export const LocationTypeLabels: Record<LocationType, string> = {
  [LocationType.FIXED_VENUE]: 'Fixed Venue',
  [LocationType.CITY_AREA]: 'City Area',
  [LocationType.RURAL]: 'Rural',
  [LocationType.NOMADIC]: 'Nomadic/Moving',
  [LocationType.MULTIPLE]: 'Multiple Locations'
};

export type VenueType =
  | 'theater'
  | 'stadium'
  | 'outdoor'
  | 'cultural_center'
  | 'medina'
  | 'desert'
  | 'rural'
  | 'mountain'
  | 'sanctuary'
  | 'other';

export interface EventLocation {
  location_type: LocationType;
  region: string;
  region_slug: string;
  province?: string;
  city?: string;
  city_slug?: string;
  venue_name?: string;
  venue_type?: VenueType;
  area_description?: string;
  moving_pattern?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    precision: DatePrecision;
  };
}

// Morocco's 12 administrative regions
export const REGIONS = [
  { name: 'Tanger-Tétouan-Al Hoceïma', slug: 'tanger-tetouan-al-hoceima' },
  { name: 'Oriental', slug: 'oriental' },
  { name: 'Fès-Meknès', slug: 'fes-meknes' },
  { name: 'Rabat-Salé-Kénitra', slug: 'rabat-sale-kenitra' },
  { name: 'Béni Mellal-Khénifra', slug: 'beni-mellal-khenifra' },
  { name: 'Casablanca-Settat', slug: 'casablanca-settat' },
  { name: 'Marrakech-Safi', slug: 'marrakech-safi' },
  { name: 'Drâa-Tafilalet', slug: 'draa-tafilalet' },
  { name: 'Souss-Massa', slug: 'souss-massa' },
  { name: 'Guelmim-Oued Noun', slug: 'guelmim-oued-noun' },
  { name: 'Laâyoune-Sakia El Hamra', slug: 'laayoune-sakia-el-hamra' },
  { name: 'Dakhla-Oued Ed-Dahab', slug: 'dakhla-oued-ed-dahab' }
];

// =============================================================================
// EVENT STATUS
// =============================================================================

export enum EventStatus {
  CONFIRMED = 'confirmed',
  ANNOUNCED = 'announced',
  TENTATIVE = 'tentative',
  POSTPONED = 'postponed',
  CANCELLED = 'cancelled',
  DORMANT = 'dormant',
  HISTORICAL = 'historical'
}

export const EventStatusLabels: Record<EventStatus, string> = {
  [EventStatus.CONFIRMED]: 'Confirmed',
  [EventStatus.ANNOUNCED]: 'Announced',
  [EventStatus.TENTATIVE]: 'Tentative',
  [EventStatus.POSTPONED]: 'Postponed',
  [EventStatus.CANCELLED]: 'Cancelled',
  [EventStatus.DORMANT]: 'Dormant',
  [EventStatus.HISTORICAL]: 'Historical'
};
