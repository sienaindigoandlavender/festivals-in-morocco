# URL & Page Strategy

Every page exists because it answers a search query. No decorative pages.

---

## Route Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         URL STRUCTURE                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  /                                    Homepage (search entry)        │
│  │                                                                   │
│  ├── /events                          All upcoming events            │
│  │   └── /events/{slug}               Single event detail            │
│  │                                                                   │
│  ├── /festivals                       All festivals                  │
│  │   └── /festivals/{slug}            Single festival detail         │
│  │                                                                   │
│  ├── /cities                          City index                     │
│  │   └── /cities/{slug}               Events in city                 │
│  │                                                                   │
│  ├── /regions                         Region index                   │
│  │   └── /regions/{slug}              Events in region               │
│  │                                                                   │
│  ├── /genres                          Genre index                    │
│  │   └── /genres/{slug}               Events by genre                │
│  │                                                                   │
│  ├── /artists                         Artist index (if searched)     │
│  │   └── /artists/{slug}              Artist detail + events         │
│  │                                                                   │
│  ├── /calendar                        Calendar root                  │
│  │   └── /calendar/{year}             Year view                      │
│  │       └── /calendar/{year}/{month} Month view                     │
│  │                                                                   │
│  └── /api/...                         API endpoints (see below)      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Page Specifications

### 1. Homepage `/`

**Query intent**: "morocco festivals", "music events morocco", "concerts morocco"

**Content**:
- Search box (primary action)
- 5-10 upcoming verified/pinned events
- Quick filters: This month | This weekend | Festivals | By city

**Data required**:
```sql
SELECT * FROM v_upcoming_events
WHERE (is_pinned = true OR is_verified = true)
ORDER BY is_pinned DESC, start_date ASC
LIMIT 10;
```

**Schema.org**: `WebSite` with `SearchAction`

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Morocco Events",
  "url": "https://moroccoevents.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://moroccoevents.com/events?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

---

### 2. Events List `/events`

**Query intent**: "events in morocco", "upcoming concerts morocco"

**Content**:
- Search/filter interface
- Paginated event list (20 per page)
- Active filters displayed
- Sort options: Date | Recently added | Major events

**URL parameters**:
```
/events?q=gnawa              # Search query
/events?city=marrakech       # City filter
/events?region=marrakech-safi # Region filter
/events?genre=jazz           # Genre filter
/events?type=festival        # Event type filter
/events?from=2025-06-01      # Date range start
/events?to=2025-06-30        # Date range end
/events?page=2               # Pagination
```

**Data required**: Typesense search with facets

**Schema.org**: `ItemList`

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Events in Morocco",
  "numberOfItems": 156,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "url": "https://moroccoevents.com/events/gnaoua-festival-2025"
    }
  ]
}
```

---

### 3. Event Detail `/events/{slug}`

**Query intent**: "{event name}", "{event name} {year}", "{event name} tickets"

**Content**:
- Event name, dates, location
- Venue details (if known)
- Artist lineup (if available)
- Ticket links (if available)
- Official website link
- Verification status indicator
- Related events (same venue, same genre, same artists)

**Data required**:
```sql
SELECT
  e.*,
  json_agg(DISTINCT a.*) as artists,
  json_agg(DISTINCT g.*) as genres,
  json_agg(DISTINCT t.*) as ticket_urls
FROM events e
LEFT JOIN event_artists ea ON e.id = ea.event_id
LEFT JOIN artists a ON ea.artist_id = a.id
LEFT JOIN event_genres eg ON e.id = eg.event_id
LEFT JOIN genres g ON eg.genre_id = g.id
LEFT JOIN event_ticket_urls t ON e.id = t.event_id
WHERE e.slug = $1
GROUP BY e.id;
```

**Schema.org**: `Event` or `Festival`

```json
{
  "@context": "https://schema.org",
  "@type": "Festival",
  "name": "Festival Gnaoua et Musiques du Monde 2025",
  "startDate": "2025-06-26",
  "endDate": "2025-06-29",
  "location": {
    "@type": "Place",
    "name": "Place Moulay Hassan",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Essaouira",
      "addressRegion": "Marrakech-Safi",
      "addressCountry": "MA"
    }
  },
  "performer": [
    {
      "@type": "MusicGroup",
      "name": "Maalem Hamid El Kasri"
    }
  ],
  "offers": {
    "@type": "Offer",
    "url": "https://festival-gnaoua.net/tickets",
    "priceCurrency": "MAD"
  },
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode"
}
```

---

### 4. Festival Detail `/festivals/{slug}`

Same as event detail, but:
- Always uses `Festival` schema type
- May include multi-day schedule breakdown
- Historical editions listed (if archived)

---

### 5. City Page `/cities/{slug}`

**Query intent**: "events in {city}", "concerts {city}", "{city} festivals"

**Content**:
- City name (with Arabic/French variants)
- Region context
- Upcoming events in city (paginated)
- Major venues in city
- Genre breakdown for this city

**Data required**:
```sql
SELECT * FROM v_upcoming_events
WHERE city_slug = $1
ORDER BY start_date ASC;
```

**Schema.org**: `City` with `containsPlace` pointing to events

```json
{
  "@context": "https://schema.org",
  "@type": "City",
  "name": "Essaouira",
  "containedInPlace": {
    "@type": "AdministrativeArea",
    "name": "Marrakech-Safi"
  },
  "event": [
    { "@type": "Festival", "name": "..." }
  ]
}
```

---

### 6. Region Page `/regions/{slug}`

**Query intent**: "events in {region}", "festivals {region}"

**Content**:
- Region name
- Cities in region with event counts
- Upcoming events across region
- Map showing event distribution (optional, low priority)

**Data required**:
```sql
SELECT
  c.name as city_name,
  c.slug as city_slug,
  COUNT(e.id) as event_count
FROM cities c
LEFT JOIN events e ON c.id = e.city_id
  AND e.status IN ('announced', 'confirmed')
  AND e.start_date >= CURRENT_DATE
WHERE c.region_id = (SELECT id FROM regions WHERE slug = $1)
GROUP BY c.id
ORDER BY event_count DESC;
```

---

### 7. Genre Page `/genres/{slug}`

**Query intent**: "gnawa music morocco", "jazz festivals morocco", "{genre} events"

**Content**:
- Genre name and brief context (1-2 sentences, factual only)
- Upcoming events in this genre
- Related genres
- Notable artists in this genre (who have events)

**Data required**:
```sql
SELECT * FROM v_upcoming_events
WHERE $1 = ANY(genres)
ORDER BY cultural_significance DESC, start_date ASC;
```

**Schema.org**: `MusicGenre` (custom, not standard schema)

---

### 8. Calendar Pages `/calendar/{year}/{month}`

**Query intent**: "events morocco june 2025", "festivals morocco summer 2025"

**Content**:
- Month/year navigation
- Calendar grid view with event dots
- List of events for the month
- Weekend highlights

**Data required**:
```sql
SELECT * FROM v_upcoming_events
WHERE EXTRACT(YEAR FROM start_date) = $1
  AND EXTRACT(MONTH FROM start_date) = $2
ORDER BY start_date ASC;
```

**Schema.org**: `ItemList` with temporal scope

---

### 9. Artist Page `/artists/{slug}`

**Query intent**: "{artist name} concerts", "{artist name} tour morocco"

**Content**:
- Artist name
- Genres
- Upcoming events featuring artist
- Past events (archived)

**Data required**:
```sql
SELECT e.* FROM events e
JOIN event_artists ea ON e.id = ea.event_id
JOIN artists a ON ea.artist_id = a.id
WHERE a.slug = $1
ORDER BY e.start_date DESC;
```

**Schema.org**: `MusicGroup` or `Person`

```json
{
  "@context": "https://schema.org",
  "@type": "MusicGroup",
  "name": "Hindi Zahra",
  "genre": ["World Music", "Jazz"],
  "event": [...]
}
```

---

## SEO Technical Requirements

### Canonicalization

```
/events?city=marrakech     → canonical: /cities/marrakech
/events?genre=gnawa        → canonical: /genres/gnawa
/events?type=festival      → canonical: /festivals
```

### Pagination

Use `rel="next"` and `rel="prev"`:
```html
<link rel="prev" href="/events?page=1">
<link rel="next" href="/events?page=3">
```

### Sitemap Structure

```
/sitemap.xml
├── /sitemap-events.xml      (updated daily)
├── /sitemap-festivals.xml   (updated daily)
├── /sitemap-cities.xml      (static)
├── /sitemap-regions.xml     (static)
├── /sitemap-genres.xml      (static)
├── /sitemap-artists.xml     (updated weekly)
└── /sitemap-calendar.xml    (updated monthly)
```

### Page Titles

```
{event name} | Morocco Events
Events in {city} | Morocco Events
{genre} Events & Festivals in Morocco | Morocco Events
Events in Morocco - {month} {year} | Morocco Events
```

### Meta Descriptions

Generated programmatically:
```
Event: "{name} - {dates} in {city}. {genre} {event_type}. {ticket info if available}."
City: "Upcoming music events and festivals in {city}, Morocco. {count} events scheduled."
Genre: "{genre} events and festivals in Morocco. Discover concerts and performances."
```

---

## Pages NOT Built

These pages are intentionally excluded:

| Page Type | Reason |
|-----------|--------|
| /about | No search intent |
| /blog | Not a content site |
| /news | Not a news site |
| /contact | No discovery value |
| /faq | Address in event pages |
| /partners | No user value |
| /terms, /privacy | Legal only, noindex |

---

## Rendering Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                   RENDERING DECISION TREE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Page Type          Rendering      Cache TTL     Invalidation        │
│  ─────────          ─────────      ─────────     ────────────        │
│  Event detail       SSG + ISR      1 hour        On event update     │
│  Festival detail    SSG + ISR      1 hour        On event update     │
│  Events list        SSR            5 minutes     None (TTL only)     │
│  City page          SSG + ISR      1 hour        On event in city    │
│  Region page        SSG + ISR      1 hour        On event in region  │
│  Genre page         SSG + ISR      1 hour        On event w/ genre   │
│  Calendar page      SSG            24 hours      Daily rebuild       │
│  Artist page        SSG + ISR      6 hours       On event w/ artist  │
│                                                                      │
│  SSG = Static Site Generation (build time)                          │
│  ISR = Incremental Static Regeneration (on-demand)                  │
│  SSR = Server-Side Rendering (per request)                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```
