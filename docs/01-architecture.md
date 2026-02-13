# Morocco Events Search Engine - System Architecture

## Overview

A vertical search engine for festivals and music events in Morocco. Entity-centric, search-first, built for long-term authority and machine readability.

---

## 1. Core Domain Model

### Entities

```
┌─────────────────────────────────────────────────────────────────────┐
│                           ENTITY GRAPH                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────┐         ┌──────────┐         ┌──────────┐           │
│   │  Region  │◄────────│   City   │◄────────│  Venue   │           │
│   └──────────┘   1:N   └──────────┘   1:N   └──────────┘           │
│        │                    │                    │                   │
│        │                    │                    │                   │
│        ▼                    ▼                    ▼                   │
│   ┌─────────────────────────────────────────────────────┐          │
│   │                      EVENT                           │          │
│   │  (festival | concert | showcase | ritual | conf)     │          │
│   └─────────────────────────────────────────────────────┘          │
│        │              │              │              │                │
│        │ N:M          │ N:M          │ N:1          │ N:M            │
│        ▼              ▼              ▼              ▼                │
│   ┌────────┐    ┌──────────┐   ┌───────────┐  ┌──────────┐         │
│   │ Artist │    │  Genre   │   │ Organizer │  │  Source  │         │
│   └────────┘    └──────────┘   └───────────┘  └──────────┘         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Entity Definitions

| Entity | Purpose | Cardinality |
|--------|---------|-------------|
| Region | Administrative regions of Morocco (12 total) | Static reference |
| City | Cities within regions | Static reference, ~100 |
| Venue | Physical locations where events occur | Dynamic, nullable |
| Event | Core entity - any music/cultural occurrence | Dynamic, primary |
| Artist | Performers (individuals or groups) | Dynamic |
| Genre | Music/event categorization | Semi-static taxonomy |
| Organizer | Entity responsible for event | Dynamic |
| Source | Data provenance tracking | System-managed |

### Relationship Matrix

| From | To | Relationship | Cardinality |
|------|-----|--------------|-------------|
| Event | City | belongs_to | N:1 |
| Event | Region | belongs_to | N:1 |
| Event | Venue | occurs_at | N:1 (nullable) |
| Event | Artist | features | N:M |
| Event | Genre | categorized_as | N:M |
| Event | Organizer | organized_by | N:1 |
| Event | Source | sourced_from | N:M |
| City | Region | located_in | N:1 |
| Venue | City | located_in | N:1 |
| Artist | Genre | performs | N:M |

---

## 2. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SOURCES                    PROCESSING                   OUTPUT      │
│  ───────                    ──────────                   ──────      │
│                                                                      │
│  ┌─────────────┐           ┌─────────────┐                          │
│  │ Eventbrite  │──┐        │             │                          │
│  │    API      │  │        │  Normalizer │                          │
│  └─────────────┘  │        │             │                          │
│                   │        └──────┬──────┘                          │
│  ┌─────────────┐  │               │                                  │
│  │  Songkick   │──┼───────►┌──────▼──────┐      ┌─────────────┐     │
│  │    API      │  │        │             │      │  PostgreSQL │     │
│  └─────────────┘  │        │ Deduplicator├─────►│   (truth)   │     │
│                   │        │             │      └──────┬──────┘     │
│  ┌─────────────┐  │        └──────┬──────┘             │            │
│  │  Manual     │──┤               │                    │            │
│  │  Import     │  │               ▼                    ▼            │
│  └─────────────┘  │        ┌─────────────┐      ┌─────────────┐     │
│                   │        │  Confidence │      │  Typesense  │     │
│  ┌─────────────┐  │        │   Scorer    │      │   (search)  │     │
│  │  Scraped    │──┘        └─────────────┘      └──────┬──────┘     │
│  │   Sites     │                                       │            │
│  └─────────────┘                                       ▼            │
│                                                 ┌─────────────┐     │
│                                                 │   REST API  │     │
│                                                 └──────┬──────┘     │
│                                                        │            │
│                                                        ▼            │
│                                                 ┌─────────────┐     │
│                                                 │   Static    │     │
│                                                 │   Pages     │     │
│                                                 └─────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Trust & Verification Model

Events exist in states of trust:

```
TRUST LEVELS
────────────

  ┌─────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │  UNVERIFIED ──► ANNOUNCED ──► CONFIRMED ──► VERIFIED            │
  │       │              │              │            │               │
  │   confidence     confidence    confidence   editorial            │
  │    < 0.3         0.3-0.6        0.6-0.9      flag set            │
  │                                                                  │
  │  Alternative paths:                                              │
  │       │                                                          │
  │       └──────────────────► CANCELLED                             │
  │       └──────────────────► ARCHIVED (post-event)                 │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
```

### Confidence Score Calculation

```
confidence = (
    0.35 * source_reliability +
    0.25 * data_completeness +
    0.20 * source_agreement +
    0.10 * recency +
    0.10 * historical_accuracy
)
```

| Factor | Weight | Calculation |
|--------|--------|-------------|
| source_reliability | 0.35 | Official site = 1.0, API = 0.8, Scraped = 0.5 |
| data_completeness | 0.25 | Required fields present / total required fields |
| source_agreement | 0.20 | Sources agreeing on date/venue / total sources |
| recency | 0.10 | Days since last verification, decay function |
| historical_accuracy | 0.10 | Past accuracy of primary source |

---

## 4. Search Architecture

### Why Typesense

| Criteria | Typesense | Meilisearch | OpenSearch |
|----------|-----------|-------------|------------|
| Solo-founder ops | Excellent | Good | Poor |
| Typo tolerance | Built-in | Built-in | Plugin |
| Faceted search | Native | Native | Native |
| Geo search | Yes | Yes | Yes |
| Self-hosted cost | Low | Low | High |
| Cloud option | Yes ($) | Yes ($) | AWS only |
| Schema enforcement | Strict | Loose | Strict |

**Decision: Typesense**

- Strict schema prevents data drift
- Single binary deployment
- Built-in typo tolerance handles Arabic/French transliterations
- Low memory footprint (~50MB for 100k documents)

### Search Index Design

The search index is a **read-optimized projection** of the database, not a replacement.

```
PRIMARY INDEX: events
─────────────────────

Document structure optimized for:
1. Full-text search (name, artist names, venue name)
2. Faceted filtering (city, region, genre, type, status)
3. Geo-proximity search
4. Date range filtering
5. Ranking by cultural significance
```

### Ranking Strategy

```
Default ranking order:
1. _text_match (relevance to query)
2. is_pinned DESC (editorial pins)
3. cultural_significance DESC (manual weight)
4. confidence_score DESC (data quality)
5. start_date ASC (upcoming first)
```

---

## 5. Page Generation Strategy

Every page answers a query. No decorative pages.

### Page Type Matrix

| Route Pattern | Query Intent | Update Frequency |
|---------------|--------------|------------------|
| `/events` | "events in morocco" | Real-time |
| `/events/{slug}` | "{event name}" | On change |
| `/festivals/{slug}` | "{festival name}" | On change |
| `/cities/{city}` | "events in {city}" | Daily |
| `/regions/{region}` | "events in {region}" | Daily |
| `/genres/{genre}` | "{genre} events morocco" | Daily |
| `/calendar/{year}/{month}` | "events {month} {year} morocco" | Daily |
| `/artists/{slug}` | "{artist} events morocco" | On change |

### Page Rendering Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PAGE GENERATION                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Request ──► Check Cache ──► Hit? ──► Serve                         │
│                   │                                                  │
│                   ▼ Miss                                             │
│              Query API ──► Render ──► Cache ──► Serve               │
│                                                                      │
│  Cache invalidation:                                                 │
│  - Event pages: On event update                                      │
│  - List pages: TTL 1 hour + on significant change                   │
│  - Calendar pages: TTL 24 hours                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Tech Stack

### Chosen Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Database | PostgreSQL 16 | ACID, JSON support, mature, 10+ year stability |
| Search | Typesense | Low-ops, typo-tolerant, strict schema |
| Backend | Node.js + Fastify | Fast, typed with TS, minimal deps |
| Frontend | Astro | Static-first, partial hydration, fast |
| Hosting | Hetzner VPS | Cost-effective, EU data, simple |
| CDN | Cloudflare | Free tier sufficient, edge caching |

### Rejected Alternatives

| Technology | Reason Rejected |
|------------|-----------------|
| MongoDB | Schema drift risk over 10 years |
| Elasticsearch | Over-engineered for scale needed |
| Next.js | Too much runtime complexity |
| Vercel | Vendor lock-in, cost at scale |
| Supabase | Abstraction over PostgreSQL adds risk |

### Infrastructure Costs (Monthly)

```
Hetzner CX31 (4 vCPU, 8GB RAM): €8.50
- PostgreSQL
- Typesense
- Node.js API
- Astro static build

Hetzner Storage Box (100GB): €3.50
- Backups

Cloudflare: €0
- CDN, DNS, basic WAF

Domain: ~€1

Total: ~€13/month
```

---

## 7. Operational Model

### Backup Strategy

```
PostgreSQL:
- Daily full backup to Storage Box
- WAL archiving for point-in-time recovery
- 30-day retention

Typesense:
- Snapshot before each re-index
- Rebuild from PostgreSQL is canonical recovery path
```

### Monitoring (Minimal)

```
- Uptime: Simple HTTP check (UptimeRobot free tier)
- Errors: Application logs to file, weekly review
- Search: Query log analysis monthly
- No complex observability stack
```

### Update Cycle

```
Dependencies: Quarterly security updates only
Features: When needed, not scheduled
Data: Continuous ingestion, daily verification sweep
```

---

## 8. Security Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PUBLIC                                                              │
│  ├── Read-only API (rate-limited)                                   │
│  ├── Static pages (CDN-cached)                                      │
│  └── Search queries (logged, rate-limited)                          │
│                                                                      │
│  ADMIN (IP-restricted + auth)                                        │
│  ├── Event verification                                              │
│  ├── Manual data entry                                               │
│  ├── Editorial flags                                                 │
│  └── Ingestion triggers                                              │
│                                                                      │
│  SYSTEM (localhost only)                                             │
│  ├── Database direct access                                          │
│  ├── Typesense admin                                                 │
│  └── Backup operations                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. Evolution Path

This architecture supports:

1. **Year 1**: Core search, manual + API ingestion
2. **Year 2-3**: Expanded sources, confidence refinement
3. **Year 5+**: Historical archive value, API for third parties

What this architecture does NOT support (intentionally):

- User accounts
- Social features
- Real-time collaboration
- Complex CMS workflows
- Multi-tenant operation

These are features of a different product.
