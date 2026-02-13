# Morocco Events Search Engine

Vertical search engine for festivals and music events in Morocco.

**Data source**: Google Sheets
**Hosting**: Vercel
**Search**: Built-in (Typesense optional)

---

## Architecture

```
┌─────────────────┐
│  Google Sheet   │  ◄── You edit here
│  (data source)  │
└────────┬────────┘
         │
         │ fetch on request
         ▼
┌─────────────────┐
│  Vercel API     │
│  /api/*         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Static Pages   │  ◄── Astro SSG
│  (Vercel Edge)  │
└─────────────────┘
```

No database. No complex infrastructure. Edit the sheet, see changes on site.

---

## Google Sheet

**Sheet ID**: `1LjfPpLzpuQEkeb34MYrrTFad_PM1wjiS4vPS67sNML0`

### Events Sheet (Required)

| Column | Field | Example |
|--------|-------|---------|
| A | id | `gnaoua-2025` |
| B | name | `Festival Gnaoua et Musiques du Monde` |
| C | event_type | `festival` |
| D | start_date | `2025-06-26` |
| E | end_date | `2025-06-29` |
| F | city | `Essaouira` |
| G | region | `Marrakech-Safi` |
| H | venue | `Place Moulay Hassan` |
| I | genres | `Gnawa, World Music` |
| J | artists | `Maalem Hamid El Kasri, Hindi Zahra` |
| K | organizer | `Association Yerma Gnaoua` |
| L | official_website | `https://festival-gnaoua.net` |
| M | ticket_url | `https://...` |
| N | status | `confirmed` |
| O | is_verified | `TRUE` |
| P | is_pinned | `TRUE` |
| Q | cultural_significance | `9` |
| R | description | `Annual celebration...` |
| S | image_url | `https://...` |

See `docs/05-sheet-structure.md` for full documentation.

---

## API Routes

```
GET /api/events              List events
GET /api/events?slug=xxx     Single event
GET /api/events?city=xxx     Events in city
GET /api/events?genre=xxx    Events by genre
GET /api/events?upcoming=true Upcoming only

GET /api/festivals           Festivals only

GET /api/search?q=xxx        Text search
GET /api/search?q=gnawa&city=essaouira

GET /api/cities              List cities with counts
GET /api/cities?slug=xxx     City detail with events

GET /api/calendar/2025/06    Events in June 2025
```

---

## Project Structure

```
morocco-events-search/
├── api/                      # Vercel serverless functions
│   ├── events.ts
│   ├── festivals.ts
│   ├── search.ts
│   ├── cities.ts
│   └── calendar/[year]/[month].ts
├── src/
│   ├── sheets/
│   │   └── client.ts         # Google Sheets fetcher
│   └── types.ts
├── docs/
│   ├── 01-architecture.md
│   ├── 02-ingestion-pipeline.md
│   ├── 03-url-page-strategy.md
│   ├── 04-editorial-layer.md
│   └── 05-sheet-structure.md
├── schema/                   # Reference (if using Typesense)
│   ├── database.sql
│   └── typesense-schema.json
└── examples/
    ├── event-response.json
    └── EventPage.astro
```

---

## Environment Variables

Set in Vercel dashboard:

```
GOOGLE_SHEET_ID=1LjfPpLzpuQEkeb34MYrrTFad_PM1wjiS4vPS67sNML0
GOOGLE_API_KEY=xxx            # Only for private sheets
```

For public sheets, no API key needed. Make sheet viewable by "Anyone with the link".

---

## Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev
```

API available at `http://localhost:3000/api/*`

---

## Deploy

```bash
vercel --prod
```

Or connect GitHub repo to Vercel for automatic deploys.

---

## Updating Data

1. Edit the Google Sheet
2. Changes appear on next API request (cached 5 min)
3. For instant updates: redeploy or clear cache

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Data | Google Sheets | Visual editing, version history, free |
| API | Vercel Functions | Zero config, auto-scaling |
| Frontend | Astro (optional) | Static pages, fast |
| Search | Built-in / Typesense | Works without external deps |

**Cost**: $0 (Vercel free tier + Google Sheets)

---

## What This Is

- A search engine for Morocco's music events
- Structured data, machine-readable
- Every page answers a search query

## What This Is Not

- Not a blog
- Not a social platform
- Not a tourism calendar
