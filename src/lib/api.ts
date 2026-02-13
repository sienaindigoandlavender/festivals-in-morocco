// API helper for fetching data
// Uses canonical taxonomy from taxonomy.ts

import {
  EventType,
  EventTypeLabels,
  TraditionCategory,
  TemporalType,
  DatePrecision,
  LocationType,
  EventStatus,
  MUSIC_TRADITIONS,
  REGIONS,
  type MusicTradition,
  type CulturalWeightValue,
  type EventTiming,
  type EventLocation,
  type VenueType,
  type Season
} from './taxonomy';

// Re-export taxonomy types for convenience
export * from './taxonomy';

// =============================================================================
// EVENT INTERFACE
// =============================================================================

export interface Event {
  id: string;
  name: string;
  name_ar?: string;
  name_tzm?: string;
  slug: string;

  // Axis 1: Event Type (mandatory)
  event_type: EventType;

  // Axis 2: Music Traditions (at least one required)
  traditions: string[]; // IDs from MUSIC_TRADITIONS

  // Axis 3: Cultural Weight (internal)
  cultural_weight: CulturalWeightValue;
  weight_rationale: string;

  // Axis 4: Temporal Nature
  timing: EventTiming;

  // Axis 5: Location
  location: EventLocation;

  // Status
  status: EventStatus;

  // Verification
  is_verified: boolean;
  is_featured: boolean;

  // Content
  description?: string;
  description_ar?: string;
  historical_reference?: string; // Required for MOUSSEM

  // Links
  official_website?: string;
  ticket_url?: string;

  // Artists (for concerts/festivals)
  artists: string[];

  // Organizer
  organizer?: string;

  // Media
  image_url?: string;

  // Lineage (for evolved events)
  preceded_by?: string;
  succeeded_by?: string;
}

// =============================================================================
// SEED DATA - Properly classified according to taxonomy
// =============================================================================

const EVENTS: Event[] = [
  // =========================================================================
  // FESTIVALS - Rooted/Hybrid traditions
  // =========================================================================
  {
    id: 'gnaoua-2025',
    name: 'Festival Gnaoua et Musiques du Monde',
    name_ar: 'مهرجان كناوة وموسيقى العالم',
    slug: 'festival-gnaoua-essaouira',
    event_type: EventType.FESTIVAL,
    traditions: ['gnawa', 'jazz', 'world', 'fusion'],
    cultural_weight: 4,
    weight_rationale: 'Established festival that has significantly elevated Gnawa tradition visibility internationally since 1998',
    timing: {
      temporal_type: TemporalType.FIXED_ANNUAL,
      gregorian_start: '2025-06-26',
      gregorian_end: '2025-06-29',
      date_precision: DatePrecision.EXACT,
      season: 'summer',
      recurrence_notes: 'Late June annually'
    },
    location: {
      location_type: LocationType.CITY_AREA,
      region: 'Marrakech-Safi',
      region_slug: 'marrakech-safi',
      city: 'Essaouira',
      city_slug: 'essaouira',
      venue_name: 'Place Moulay Hassan & Multiple Stages',
      venue_type: 'outdoor',
      area_description: 'Essaouira medina, port, and beach areas'
    },
    status: EventStatus.CONFIRMED,
    is_verified: true,
    is_featured: true,
    description: 'The premier festival celebrating Gnawa music and its dialogue with world music traditions. Features Gnawa maalems alongside international jazz, blues, and world music artists.',
    official_website: 'https://festival-gnaoua.net',
    ticket_url: 'https://festival-gnaoua.net/billetterie',
    artists: ['Maalem Hamid El Kasri', 'Hindi Zahra', 'Oum'],
    organizer: 'Association Yerma Gnaoua'
  },
  {
    id: 'fes-sacred-2025',
    name: 'Fes Festival of World Sacred Music',
    name_ar: 'مهرجان فاس للموسيقى الروحية العالمية',
    slug: 'fes-festival-sacred-music',
    event_type: EventType.FESTIVAL,
    traditions: ['sufi', 'andalusi', 'world'],
    cultural_weight: 4,
    weight_rationale: 'Internationally recognized festival in UNESCO World Heritage city, promoting interfaith dialogue through sacred music since 1994',
    timing: {
      temporal_type: TemporalType.FIXED_ANNUAL,
      gregorian_start: '2025-06-06',
      gregorian_end: '2025-06-14',
      date_precision: DatePrecision.EXACT,
      season: 'summer',
      recurrence_notes: 'Early June annually'
    },
    location: {
      location_type: LocationType.CITY_AREA,
      region: 'Fès-Meknès',
      region_slug: 'fes-meknes',
      city: 'Fes',
      city_slug: 'fes',
      venue_name: 'Bab Al Makina & Historic Sites',
      venue_type: 'outdoor',
      area_description: 'Historic venues throughout Fes medina'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: true,
    is_featured: true,
    description: 'Celebrating sacred music traditions from around the world in Morocco\'s oldest imperial city. Features Sufi brotherhoods, Andalusian orchestras, and sacred music from diverse traditions.',
    official_website: 'https://fesfestival.com',
    artists: [],
    organizer: 'Fes Festival Foundation'
  },
  {
    id: 'timitar-2025',
    name: 'Festival Timitar',
    name_tzm: 'ⴰⵏⵎⵓⴳⴳⴰⵔ ⵏ ⵜⵉⵎⵉⵜⴰⵔ',
    slug: 'festival-timitar',
    event_type: EventType.FESTIVAL,
    traditions: ['ahwach', 'rways', 'world', 'chaabi'],
    cultural_weight: 4,
    weight_rationale: 'Principal festival celebrating Amazigh musical heritage, significant for cultural recognition',
    timing: {
      temporal_type: TemporalType.FIXED_ANNUAL,
      gregorian_start: '2025-07-10',
      gregorian_end: '2025-07-13',
      date_precision: DatePrecision.EXACT,
      season: 'summer',
      recurrence_notes: 'Mid-July annually'
    },
    location: {
      location_type: LocationType.CITY_AREA,
      region: 'Souss-Massa',
      region_slug: 'souss-massa',
      city: 'Agadir',
      city_slug: 'agadir',
      area_description: 'Multiple stages across Agadir'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: true,
    is_featured: true,
    description: 'Festival celebrating Amazigh (Berber) music and culture, featuring traditional Rways and Ahwach alongside contemporary Amazigh artists and international world music.',
    official_website: 'https://festivaltimitar.ma',
    artists: [],
    organizer: 'Association Timitar'
  },
  {
    id: 'lboulevard-2025',
    name: 'L\'Boulevard Festival',
    name_ar: 'مهرجان البوليفارد',
    slug: 'l-boulevard-festival',
    event_type: EventType.FESTIVAL,
    traditions: ['nayda', 'rap-ma', 'rock', 'fusion'],
    cultural_weight: 3,
    weight_rationale: 'Established platform for Moroccan alternative music scene since 1999, significant for youth culture',
    timing: {
      temporal_type: TemporalType.FIXED_ANNUAL,
      gregorian_start: '2025-09-26',
      gregorian_end: '2025-09-28',
      date_precision: DatePrecision.EXACT,
      season: 'autumn',
      recurrence_notes: 'Late September annually'
    },
    location: {
      location_type: LocationType.CITY_AREA,
      region: 'Casablanca-Settat',
      region_slug: 'casablanca-settat',
      city: 'Casablanca',
      city_slug: 'casablanca',
      venue_name: 'Ancienne Médina',
      venue_type: 'outdoor',
      area_description: 'Historic quarter of Casablanca'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: true,
    is_featured: false,
    description: 'Casablanca\'s urban music festival showcasing emerging Moroccan rock, hip-hop, and alternative artists. Birthplace of the Nayda movement.',
    official_website: 'https://boulevard.ma',
    artists: [],
    organizer: 'EAC L\'Boulvard'
  },
  {
    id: 'jardin-arts-2025',
    name: 'Festival International du Jardin des Arts',
    name_ar: 'المهرجان الدولي لحديقة الفنون',
    slug: 'festival-jardin-des-arts',
    event_type: EventType.FESTIVAL,
    traditions: ['andalusi', 'malhun', 'chaabi'],
    cultural_weight: 3,
    weight_rationale: 'Regional festival preserving Andalusian musical heritage in Tétouan',
    timing: {
      temporal_type: TemporalType.FIXED_ANNUAL,
      gregorian_start: '2025-05-15',
      gregorian_end: '2025-05-18',
      date_precision: DatePrecision.APPROXIMATE,
      season: 'spring',
      recurrence_notes: 'Usually mid-May'
    },
    location: {
      location_type: LocationType.FIXED_VENUE,
      region: 'Tanger-Tétouan-Al Hoceïma',
      region_slug: 'tanger-tetouan-al-hoceima',
      city: 'Tétouan',
      city_slug: 'tetouan',
      venue_name: 'Jardin Moulay Rachid',
      venue_type: 'outdoor'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: false,
    is_featured: false,
    description: 'Arts festival in Tétouan featuring Andalusian music traditions and contemporary Moroccan arts.',
    artists: [],
    organizer: undefined
  },
  {
    id: 'awalnart-2025',
    name: 'Awaln\'Art Festival',
    slug: 'awalnart-festival',
    event_type: EventType.FESTIVAL,
    traditions: ['gnawa', 'fusion', 'world'],
    cultural_weight: 3,
    weight_rationale: 'Contemporary arts festival bridging traditional and modern expression',
    timing: {
      temporal_type: TemporalType.FIXED_ANNUAL,
      gregorian_start: '2025-06-12',
      gregorian_end: '2025-06-15',
      date_precision: DatePrecision.APPROXIMATE,
      season: 'summer',
      recurrence_notes: 'Usually early-mid June'
    },
    location: {
      location_type: LocationType.CITY_AREA,
      region: 'Marrakech-Safi',
      region_slug: 'marrakech-safi',
      city: 'Marrakech',
      city_slug: 'marrakech',
      area_description: 'Various venues throughout Marrakech medina'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: false,
    is_featured: false,
    description: 'Contemporary arts and music festival in Marrakech featuring Gnawa fusion and experimental work.',
    artists: [],
    organizer: 'Awaln\'Art Association'
  },
  {
    id: 'merzouga-2025',
    name: 'Merzouga Music Festival',
    slug: 'merzouga-music-festival',
    event_type: EventType.FESTIVAL,
    traditions: ['gnawa', 'hassani', 'desert-blues'],
    cultural_weight: 3,
    weight_rationale: 'Festival celebrating Saharan musical heritage in authentic desert setting',
    timing: {
      temporal_type: TemporalType.FIXED_ANNUAL,
      gregorian_start: '2025-10-17',
      gregorian_end: '2025-10-19',
      date_precision: DatePrecision.APPROXIMATE,
      season: 'autumn',
      recurrence_notes: 'Usually October'
    },
    location: {
      location_type: LocationType.RURAL,
      region: 'Drâa-Tafilalet',
      region_slug: 'draa-tafilalet',
      area_description: 'Erg Chebbi dunes near Merzouga',
      venue_type: 'desert'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: false,
    is_featured: false,
    description: 'Music performances in the Sahara desert dunes, featuring Gnawa, Hassani, and desert blues traditions.',
    artists: [],
    organizer: undefined
  },

  // =========================================================================
  // FESTIVALS - Primarily imported traditions
  // =========================================================================
  {
    id: 'mawazine-2025',
    name: 'Mawazine Rhythms of the World',
    name_ar: 'موازين إيقاعات العالم',
    slug: 'mawazine-rhythms-of-the-world',
    event_type: EventType.FESTIVAL,
    traditions: ['pop-intl', 'world', 'rnb', 'chaabi'],
    cultural_weight: 2,
    weight_rationale: 'Large commercial festival featuring primarily international pop acts',
    timing: {
      temporal_type: TemporalType.FIXED_ANNUAL,
      gregorian_start: '2025-06-20',
      gregorian_end: '2025-06-28',
      date_precision: DatePrecision.EXACT,
      season: 'summer',
      recurrence_notes: 'Late June annually'
    },
    location: {
      location_type: LocationType.CITY_AREA,
      region: 'Rabat-Salé-Kénitra',
      region_slug: 'rabat-sale-kenitra',
      city: 'Rabat',
      city_slug: 'rabat',
      venue_name: 'OLM Souissi & Nahda Stage',
      venue_type: 'stadium',
      area_description: 'Multiple stages across Rabat'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: true,
    is_featured: true,
    description: 'One of Africa\'s largest music festivals featuring major international headliners alongside Moroccan and Arab artists.',
    official_website: 'https://mawazine.ma',
    artists: [],
    organizer: 'Maroc Cultures'
  },
  {
    id: 'jazzablanca-2025',
    name: 'Jazzablanca',
    slug: 'jazzablanca',
    event_type: EventType.FESTIVAL,
    traditions: ['jazz', 'rnb', 'electronic', 'fusion'],
    cultural_weight: 2,
    weight_rationale: 'Established jazz festival featuring primarily international artists',
    timing: {
      temporal_type: TemporalType.FIXED_ANNUAL,
      gregorian_start: '2025-07-03',
      gregorian_end: '2025-07-05',
      date_precision: DatePrecision.EXACT,
      season: 'summer',
      recurrence_notes: 'Early July annually'
    },
    location: {
      location_type: LocationType.FIXED_VENUE,
      region: 'Casablanca-Settat',
      region_slug: 'casablanca-settat',
      city: 'Casablanca',
      city_slug: 'casablanca',
      venue_name: 'Anfa Park',
      venue_type: 'outdoor'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: true,
    is_featured: false,
    description: 'Casablanca\'s premier jazz festival bringing international jazz, soul, and electronic acts.',
    official_website: 'https://jazzablanca.com',
    artists: [],
    organizer: '7MO'
  },
  {
    id: 'tanjazz-2025',
    name: 'Tanjazz Festival',
    slug: 'tanjazz-festival',
    event_type: EventType.FESTIVAL,
    traditions: ['jazz', 'blues'],
    cultural_weight: 2,
    weight_rationale: 'Regional jazz festival featuring imported tradition',
    timing: {
      temporal_type: TemporalType.FIXED_ANNUAL,
      gregorian_start: '2025-09-18',
      gregorian_end: '2025-09-21',
      date_precision: DatePrecision.APPROXIMATE,
      season: 'autumn',
      recurrence_notes: 'Usually mid-September'
    },
    location: {
      location_type: LocationType.FIXED_VENUE,
      region: 'Tanger-Tétouan-Al Hoceïma',
      region_slug: 'tanger-tetouan-al-hoceima',
      city: 'Tangier',
      city_slug: 'tangier',
      venue_name: 'Palais des Institutions Italiennes',
      venue_type: 'cultural_center'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: true,
    is_featured: false,
    description: 'Tangier\'s international jazz festival.',
    official_website: 'https://tanjazz.org',
    artists: [],
    organizer: 'Tanjazz Association'
  },
  {
    id: 'chefchaouen-jazz-2025',
    name: 'Jazz au Chefchaouen',
    slug: 'jazz-chefchaouen',
    event_type: EventType.FESTIVAL,
    traditions: ['jazz', 'fusion'],
    cultural_weight: 2,
    weight_rationale: 'Small regional jazz festival',
    timing: {
      temporal_type: TemporalType.FIXED_ANNUAL,
      gregorian_start: '2025-08-07',
      gregorian_end: '2025-08-09',
      date_precision: DatePrecision.APPROXIMATE,
      season: 'summer',
      recurrence_notes: 'Usually early August'
    },
    location: {
      location_type: LocationType.CITY_AREA,
      region: 'Tanger-Tétouan-Al Hoceïma',
      region_slug: 'tanger-tetouan-al-hoceima',
      city: 'Chefchaouen',
      city_slug: 'chefchaouen',
      venue_name: 'Place Outa El Hammam',
      venue_type: 'outdoor',
      area_description: 'Main square and surrounding areas'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: false,
    is_featured: false,
    description: 'Jazz festival in the distinctive blue-painted mountain town.',
    artists: [],
    organizer: undefined
  },
  {
    id: 'oasis-2025',
    name: 'Oasis Festival',
    slug: 'oasis-festival',
    event_type: EventType.FESTIVAL,
    traditions: ['electronic'],
    cultural_weight: 2,
    weight_rationale: 'Boutique electronic festival featuring imported tradition, attracts international audience',
    timing: {
      temporal_type: TemporalType.FIXED_ANNUAL,
      gregorian_start: '2025-09-12',
      gregorian_end: '2025-09-14',
      date_precision: DatePrecision.EXACT,
      season: 'autumn',
      recurrence_notes: 'Usually mid-September'
    },
    location: {
      location_type: LocationType.FIXED_VENUE,
      region: 'Marrakech-Safi',
      region_slug: 'marrakech-safi',
      city: 'Marrakech',
      city_slug: 'marrakech',
      venue_name: 'The Source',
      venue_type: 'outdoor',
      area_description: 'Resort venue in the Atlas foothills'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: true,
    is_featured: false,
    description: 'Boutique electronic music festival set against the Atlas Mountains.',
    official_website: 'https://theoasisfest.com',
    artists: [],
    organizer: 'Oasis Festival'
  },
  {
    id: 'atlas-electronic-2025',
    name: 'Atlas Electronic',
    slug: 'atlas-electronic',
    event_type: EventType.FESTIVAL,
    traditions: ['electronic'],
    cultural_weight: 2,
    weight_rationale: 'Electronic music gathering in Moroccan countryside',
    timing: {
      temporal_type: TemporalType.FIXED_ANNUAL,
      gregorian_start: '2025-03-28',
      gregorian_end: '2025-03-30',
      date_precision: DatePrecision.EXACT,
      season: 'spring',
      recurrence_notes: 'Usually late March'
    },
    location: {
      location_type: LocationType.FIXED_VENUE,
      region: 'Marrakech-Safi',
      region_slug: 'marrakech-safi',
      city: 'Marrakech',
      city_slug: 'marrakech',
      venue_name: 'Fellah Hotel',
      venue_type: 'outdoor',
      area_description: 'Rural venue outside Marrakech'
    },
    status: EventStatus.CONFIRMED,
    is_verified: true,
    is_featured: false,
    description: 'Electronic music gathering in the Moroccan countryside outside Marrakech.',
    official_website: 'https://atlaselectronic.ma',
    artists: [],
    organizer: 'Atlas Electronic'
  },
  {
    id: 'alegria-2025',
    name: 'Alegria Festival',
    slug: 'alegria-festival',
    event_type: EventType.FESTIVAL,
    traditions: ['electronic'],
    cultural_weight: 1,
    weight_rationale: 'Commercial beach electronic festival with minimal cultural specificity',
    timing: {
      temporal_type: TemporalType.FIXED_ANNUAL,
      gregorian_start: '2025-04-25',
      gregorian_end: '2025-04-27',
      date_precision: DatePrecision.APPROXIMATE,
      season: 'spring',
      recurrence_notes: 'Usually late April'
    },
    location: {
      location_type: LocationType.FIXED_VENUE,
      region: 'Casablanca-Settat',
      region_slug: 'casablanca-settat',
      city: 'El Jadida',
      city_slug: 'el-jadida',
      venue_name: 'Mazagan Beach Resort',
      venue_type: 'outdoor'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: false,
    is_featured: false,
    description: 'Beach electronic music festival on Morocco\'s Atlantic coast.',
    official_website: 'https://alegriafestival.com',
    artists: [],
    organizer: 'Alegria Events'
  },

  // =========================================================================
  // SHOWCASE
  // =========================================================================
  {
    id: 'visa-music-2025',
    name: 'Visa For Music',
    name_ar: 'فيزا للموسيقى',
    slug: 'visa-for-music',
    event_type: EventType.SHOWCASE,
    traditions: ['world', 'fusion', 'gnawa', 'chaabi'],
    cultural_weight: 3,
    weight_rationale: 'Africa and Middle East\'s leading music market, significant for regional industry development',
    timing: {
      temporal_type: TemporalType.FIXED_ANNUAL,
      gregorian_start: '2025-11-19',
      gregorian_end: '2025-11-22',
      date_precision: DatePrecision.EXACT,
      season: 'autumn',
      recurrence_notes: 'Mid-to-late November annually'
    },
    location: {
      location_type: LocationType.CITY_AREA,
      region: 'Rabat-Salé-Kénitra',
      region_slug: 'rabat-sale-kenitra',
      city: 'Rabat',
      city_slug: 'rabat',
      area_description: 'Various venues throughout Rabat',
      venue_type: 'cultural_center'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: true,
    is_featured: false,
    description: 'Africa and Middle East\'s leading music market and showcase festival. Features artist showcases, professional conferences, and networking for the music industry.',
    official_website: 'https://visaformusic.com',
    artists: [],
    organizer: 'Visa For Music'
  },

  // =========================================================================
  // MOUSSEMS - Traditional gatherings (requires historical_reference)
  // =========================================================================
  {
    id: 'moussem-tan-tan-2025',
    name: 'Moussem Tan-Tan',
    name_ar: 'موسم طانطان',
    slug: 'moussem-tan-tan',
    event_type: EventType.MOUSSEM,
    traditions: ['hassani', 'gnawa'],
    cultural_weight: 5,
    weight_rationale: 'UNESCO Masterpiece of Oral and Intangible Heritage (2005). Gathering of nomadic peoples of the Sahara, preserving traditions at risk of disappearing.',
    timing: {
      temporal_type: TemporalType.APPROXIMATE_ANNUAL,
      gregorian_start: '2025-05-15',
      gregorian_end: '2025-05-19',
      date_precision: DatePrecision.APPROXIMATE,
      season: 'spring',
      recurrence_notes: 'Usually May, dates vary annually'
    },
    location: {
      location_type: LocationType.RURAL,
      region: 'Guelmim-Oued Noun',
      region_slug: 'guelmim-oued-noun',
      area_description: 'Tan-Tan and surrounding desert',
      venue_type: 'desert'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: true,
    is_featured: true,
    description: 'Annual gathering of nomadic peoples from across the Sahara. Features camel races, Hassani poetry, traditional music, and the preservation of Sahrawi cultural practices. Originally a commercial and social gathering for desert tribes.',
    historical_reference: 'Originated as a gathering point for nomadic tribes of the Sahara for trade, social bonds, and conflict resolution. Revived in 2004 after decades of interruption, recognized by UNESCO in 2005 as a Masterpiece of Oral and Intangible Heritage of Humanity.',
    artists: [],
    organizer: 'Tan-Tan Province'
  },
  {
    id: 'moussem-moulay-idriss-2025',
    name: 'Moussem Moulay Idriss Zerhoun',
    name_ar: 'موسم مولاي إدريس زرهون',
    slug: 'moussem-moulay-idriss',
    event_type: EventType.MOUSSEM,
    traditions: ['sufi', 'andalusi', 'aita'],
    cultural_weight: 5,
    weight_rationale: 'Morocco\'s most important religious pilgrimage, honoring the founder of the first Moroccan Islamic dynasty. Continuous tradition since the 8th century.',
    timing: {
      temporal_type: TemporalType.LUNAR,
      gregorian_start: '2025-08-20',
      gregorian_end: '2025-08-25',
      date_precision: DatePrecision.APPROXIMATE,
      islamic_month: 2,
      recurrence_notes: 'During Safar, the second month of the Islamic calendar. Dates shift ~11 days earlier each Gregorian year.'
    },
    location: {
      location_type: LocationType.CITY_AREA,
      region: 'Fès-Meknès',
      region_slug: 'fes-meknes',
      city: 'Moulay Idriss Zerhoun',
      city_slug: 'moulay-idriss-zerhoun',
      area_description: 'Holy town surrounding the tomb of Moulay Idriss I',
      venue_type: 'sanctuary'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: true,
    is_featured: true,
    description: 'Pilgrimage to the tomb of Moulay Idriss I, founder of the Idrisid dynasty and great-grandson of Prophet Muhammad. Features Sufi brotherhoods, processions, traditional music, and religious observances. The town was historically forbidden to non-Muslims.',
    historical_reference: 'Moulay Idriss I arrived in Morocco in 788 CE and founded the first Moroccan Muslim dynasty. The moussem has been held annually for over a millennium, making it one of the oldest continuous religious gatherings in North Africa.',
    artists: [],
    organizer: undefined
  },
  {
    id: 'moussem-imilchil-2025',
    name: 'Moussem des Fiancés d\'Imilchil',
    name_ar: 'موسم الخطوبة إملشيل',
    name_tzm: 'ⴰⵎⵓⴳⴳⴰⵔ ⵏ ⵉⵎⵉⵍⵛⵉⵍ',
    slug: 'moussem-imilchil',
    event_type: EventType.MOUSSEM,
    traditions: ['ahidous', 'ahwach'],
    cultural_weight: 4,
    weight_rationale: 'Unique Amazigh betrothal tradition of the Ait Hadiddou tribe. Significant for preserving pre-Islamic marriage customs within an Islamic context.',
    timing: {
      temporal_type: TemporalType.AGRICULTURAL,
      gregorian_start: '2025-09-18',
      gregorian_end: '2025-09-20',
      date_precision: DatePrecision.APPROXIMATE,
      season: 'autumn',
      recurrence_notes: 'After the harvest, usually mid-September. Exact dates determined locally.'
    },
    location: {
      location_type: LocationType.RURAL,
      region: 'Drâa-Tafilalet',
      region_slug: 'draa-tafilalet',
      province: 'Midelt',
      area_description: 'Imilchil plateau, High Atlas Mountains (2,200m altitude)',
      venue_type: 'mountain'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: true,
    is_featured: false,
    description: 'Amazigh gathering where young people of the Ait Hadiddou tribe traditionally meet and marry. Features collective Ahidous dancing, traditional dress, and the enactment of betrothal customs. Couples can formalize marriages on the spot.',
    historical_reference: 'Legend traces the tradition to two lovers from rival tribes, Isli and Tislit, whose tears of forbidden love formed two lakes near Imilchil. The moussem allows young people to choose their own partners, unusual in traditional Amazigh society.',
    artists: [],
    organizer: undefined
  },
  {
    id: 'moussem-sidi-ahmed-ou-moussa-2025',
    name: 'Moussem Sidi Ahmed ou Moussa',
    name_ar: 'موسم سيدي أحمد أو موسى',
    name_tzm: 'ⴰⵎⵓⴳⴳⴰⵔ ⵏ ⵙⵉⴷⵉ ⴰⵃⵎⴰⴷ ⵓ ⵎⵓⵙⴰ',
    slug: 'moussem-sidi-ahmed-ou-moussa',
    event_type: EventType.MOUSSEM,
    traditions: ['ahwach', 'rways'],
    cultural_weight: 4,
    weight_rationale: 'Unique acrobatic traditions associated with the saint\'s blessing. Origin of Morocco\'s famous acrobatic troupes.',
    timing: {
      temporal_type: TemporalType.LUNAR,
      gregorian_start: '2025-08-01',
      gregorian_end: '2025-08-04',
      date_precision: DatePrecision.APPROXIMATE,
      islamic_month: 1,
      recurrence_notes: 'Begins on first day of Muharram (Islamic New Year)'
    },
    location: {
      location_type: LocationType.RURAL,
      region: 'Souss-Massa',
      region_slug: 'souss-massa',
      province: 'Tiznit',
      area_description: 'Village of Sidi Ahmed ou Moussa, near Tafraout in the Anti-Atlas',
      venue_type: 'sanctuary'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: false,
    is_featured: false,
    description: 'Pilgrimage to the tomb of a 16th-century Sufi saint known as the patron of acrobats. Features spectacular acrobatic performances by troupes claiming spiritual descent from the saint, alongside Amazigh music and traditional celebrations.',
    historical_reference: 'Sidi Ahmed ou Moussa (d. 1563) was a Sufi saint whose followers developed acrobatic practices as a form of spiritual devotion. These traditions gave rise to the famous Moroccan acrobatic troupes (Oulad Sidi Ahmed ou Moussa) who perform internationally.',
    artists: [],
    organizer: undefined
  },
  {
    id: 'moussem-moulay-abdellah-amghar-2025',
    name: 'Moussem Moulay Abdellah Amghar',
    name_ar: 'موسم مولاي عبد الله أمغار',
    slug: 'moussem-moulay-abdellah-amghar',
    event_type: EventType.MOUSSEM,
    traditions: ['aita', 'chaabi', 'gnawa'],
    cultural_weight: 4,
    weight_rationale: 'Major moussem of the Doukkala region, known for fantasia (tbourida) and Aita music. Important gathering for coastal communities.',
    timing: {
      temporal_type: TemporalType.APPROXIMATE_ANNUAL,
      gregorian_start: '2025-08-10',
      gregorian_end: '2025-08-16',
      date_precision: DatePrecision.APPROXIMATE,
      season: 'summer',
      recurrence_notes: 'Usually mid-August, around 15th of August'
    },
    location: {
      location_type: LocationType.RURAL,
      region: 'Casablanca-Settat',
      region_slug: 'casablanca-settat',
      province: 'El Jadida',
      area_description: 'Moulay Abdellah village, coastal area south of El Jadida',
      venue_type: 'sanctuary'
    },
    status: EventStatus.ANNOUNCED,
    is_verified: true,
    is_featured: false,
    description: 'Week-long gathering honoring a 12th-century Sufi saint. Famous for spectacular fantasia (horseback gunpowder charges), Aita music performances by chikhate, and traditional commerce. One of the largest moussems in Atlantic Morocco.',
    historical_reference: 'Moulay Abdellah Amghar was a 12th-century Sufi saint and ancestor of the Alaouite dynasty. The moussem has been held for centuries and is closely tied to the identity of the Doukkala region and its equestrian traditions.',
    artists: [],
    organizer: 'El Jadida Province'
  }
];

// =============================================================================
// DATA ACCESS FUNCTIONS
// =============================================================================

export function getEvents(): Event[] {
  return EVENTS;
}

export function getEventBySlug(slug: string): Event | undefined {
  return EVENTS.find(e => e.slug === slug || e.id === slug);
}

export function getUpcomingEvents(): Event[] {
  const today = new Date().toISOString().split('T')[0];
  return EVENTS
    .filter(e => {
      const start = e.timing.gregorian_start;
      return start && start >= today;
    })
    .sort((a, b) => {
      // Featured first, then by cultural weight, then by date
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      if (a.cultural_weight !== b.cultural_weight) return b.cultural_weight - a.cultural_weight;
      return (a.timing.gregorian_start || '').localeCompare(b.timing.gregorian_start || '');
    });
}

export function getFeaturedEvents(): Event[] {
  return EVENTS
    .filter(e => e.is_featured || e.cultural_weight >= 4)
    .sort((a, b) => b.cultural_weight - a.cultural_weight);
}

export function getEventsByCity(citySlug: string): Event[] {
  return EVENTS.filter(e => e.location.city_slug === citySlug);
}

export function getEventsByRegion(regionSlug: string): Event[] {
  return EVENTS.filter(e => e.location.region_slug === regionSlug);
}

export function getEventsByTradition(traditionId: string): Event[] {
  return EVENTS.filter(e => e.traditions.includes(traditionId));
}

export function getEventsByType(eventType: EventType): Event[] {
  return EVENTS.filter(e => e.event_type === eventType);
}

export function getEventsByTraditionCategory(category: TraditionCategory): Event[] {
  return EVENTS.filter(e =>
    e.traditions.some(tid => {
      const tradition = MUSIC_TRADITIONS[tid];
      return tradition && tradition.category === category;
    })
  );
}

// =============================================================================
// AGGREGATION FUNCTIONS
// =============================================================================

export interface CityStats {
  name: string;
  slug: string;
  region: string;
  count: number;
}

export function getCities(): CityStats[] {
  const cityMap = new Map<string, CityStats>();
  for (const event of EVENTS) {
    if (!event.location.city_slug || !event.location.city) continue;
    const existing = cityMap.get(event.location.city_slug);
    if (existing) {
      existing.count++;
    } else {
      cityMap.set(event.location.city_slug, {
        name: event.location.city,
        slug: event.location.city_slug,
        region: event.location.region,
        count: 1
      });
    }
  }
  return Array.from(cityMap.values()).sort((a, b) => b.count - a.count);
}

export interface TraditionStats {
  id: string;
  name: string;
  category: TraditionCategory;
  sacred: boolean;
  count: number;
}

export function getTraditions(): TraditionStats[] {
  const tradMap = new Map<string, TraditionStats>();
  for (const event of EVENTS) {
    for (const tid of event.traditions) {
      const tradition = MUSIC_TRADITIONS[tid];
      if (!tradition) continue;
      const existing = tradMap.get(tid);
      if (existing) {
        existing.count++;
      } else {
        tradMap.set(tid, {
          id: tradition.id,
          name: tradition.name,
          category: tradition.category,
          sacred: tradition.sacred,
          count: 1
        });
      }
    }
  }
  return Array.from(tradMap.values()).sort((a, b) => b.count - a.count);
}

export function getEventTypes(): { type: EventType; label: string; count: number }[] {
  const typeMap = new Map<EventType, number>();
  for (const event of EVENTS) {
    typeMap.set(event.event_type, (typeMap.get(event.event_type) || 0) + 1);
  }
  return Array.from(typeMap.entries())
    .map(([type, count]) => ({
      type,
      label: EventTypeLabels[type],
      count
    }))
    .sort((a, b) => b.count - a.count);
}

// =============================================================================
// FORMATTING FUNCTIONS
// =============================================================================

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateRange(timing: EventTiming): string {
  const { gregorian_start, gregorian_end, date_precision, season, recurrence_notes } = timing;

  if (!gregorian_start) {
    if (season) return `${season.charAt(0).toUpperCase() + season.slice(1)} (dates TBA)`;
    if (recurrence_notes) return recurrence_notes;
    return 'Dates TBA';
  }

  const startDate = new Date(gregorian_start);
  const startStr = startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  const prefix = date_precision === DatePrecision.APPROXIMATE ? '~' : '';

  if (!gregorian_end || gregorian_end === gregorian_start) {
    return `${prefix}${startStr}, ${startDate.getFullYear()}`;
  }

  const endDate = new Date(gregorian_end);
  const endStr = endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return `${prefix}${startStr} - ${endStr}, ${endDate.getFullYear()}`;
}

export function formatLocation(location: EventLocation): string {
  const parts: string[] = [];

  if (location.venue_name) {
    parts.push(location.venue_name);
  }

  if (location.city) {
    parts.push(location.city);
  } else if (location.area_description) {
    parts.push(location.area_description);
  }

  if (!location.city) {
    parts.push(location.region);
  }

  return parts.join(', ');
}

// Legacy compatibility - maps to old genre system
export function getGenres(): { name: string; slug: string; count: number }[] {
  const traditions = getTraditions();
  return traditions.map(t => ({
    name: t.name,
    slug: t.id,
    count: t.count
  }));
}
