# Ingestion & Deduplication Pipeline

## Overview

The ingestion pipeline transforms heterogeneous event data from multiple sources into canonical events while preserving provenance and handling conflicts.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INGESTION PIPELINE                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SOURCE ──► FETCH ──► NORMALIZE ──► DEDUPE ──► MERGE ──► INDEX      │
│                                                                      │
│  Each stage is idempotent and can be re-run safely                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Source Adapters

Each source has a dedicated adapter that implements a common interface.

```typescript
interface SourceAdapter {
  sourceId: number;
  sourceType: SourceType;

  // Fetch raw events from source
  fetch(options: FetchOptions): Promise<RawEvent[]>;

  // Transform raw event to candidate format
  normalize(raw: RawEvent): EventCandidate;
}

interface FetchOptions {
  since?: Date;          // Incremental fetch
  region?: string;       // Geographic filter
  limit?: number;        // Max results
}

interface RawEvent {
  externalId: string;
  sourceUrl: string;
  data: Record<string, unknown>;  // Original payload
  fetchedAt: Date;
}
```

### Adapter Implementations (Pseudocode)

```typescript
// Eventbrite Adapter
class EventbriteAdapter implements SourceAdapter {
  async fetch(options: FetchOptions): Promise<RawEvent[]> {
    const events = await eventbriteApi.searchEvents({
      'location.address': 'Morocco',
      'start_date.range_start': options.since?.toISOString(),
      'expand': 'venue,organizer',
    });

    return events.map(e => ({
      externalId: e.id,
      sourceUrl: e.url,
      data: e,
      fetchedAt: new Date(),
    }));
  }

  normalize(raw: RawEvent): EventCandidate {
    const e = raw.data as EventbriteEvent;
    return {
      rawName: e.name.text,
      rawStartDate: parseDate(e.start.local),
      rawEndDate: e.end ? parseDate(e.end.local) : null,
      rawCity: e.venue?.address?.city,
      rawVenue: e.venue?.name,
      rawData: raw.data,
      sourceId: this.sourceId,
      externalId: raw.externalId,
      sourceUrl: raw.sourceUrl,
    };
  }
}
```

---

## 2. Normalization

Normalization transforms raw data into a consistent format suitable for deduplication.

### Normalization Steps

```typescript
function normalizeCandidate(candidate: EventCandidate): NormalizedCandidate {
  return {
    ...candidate,

    // Name normalization
    normalizedName: normalizeName(candidate.rawName),

    // Date normalization
    startDate: parseAndValidateDate(candidate.rawStartDate),
    endDate: parseAndValidateDate(candidate.rawEndDate),

    // Location normalization
    cityId: matchCity(candidate.rawCity),
    venueId: matchVenue(candidate.rawVenue, candidate.rawCity),

    // Generate fingerprints for dedup
    fingerprints: generateFingerprints(candidate),
  };
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
    .replace(/festival|fest|edition|\d{4}/gi, '')  // Remove common noise
    .replace(/[^a-z0-9\s]/g, '')  // Keep alphanumeric only
    .replace(/\s+/g, ' ')
    .trim();
}

function matchCity(rawCity: string | null): number | null {
  if (!rawCity) return null;

  const normalized = normalizeName(rawCity);

  // Exact match
  const exact = cities.find(c =>
    normalizeName(c.name) === normalized ||
    normalizeName(c.name_fr) === normalized
  );
  if (exact) return exact.id;

  // Fuzzy match (Levenshtein distance <= 2)
  const fuzzy = cities.find(c =>
    levenshtein(normalizeName(c.name), normalized) <= 2
  );
  if (fuzzy) return fuzzy.id;

  return null;  // Will require manual resolution
}
```

---

## 3. Fingerprint Generation

Fingerprints enable fast deduplication lookups. Multiple fingerprints per event catch different match scenarios.

```typescript
function generateFingerprints(candidate: NormalizedCandidate): Fingerprint[] {
  const fingerprints: Fingerprint[] = [];

  // Type 1: Exact match (name + date + city)
  fingerprints.push({
    type: 'exact',
    value: sha256(`${candidate.normalizedName}|${candidate.startDate}|${candidate.cityId}`),
  });

  // Type 2: Fuzzy name match (first 3 words + date + city)
  const firstWords = candidate.normalizedName.split(' ').slice(0, 3).join(' ');
  fingerprints.push({
    type: 'fuzzy_name',
    value: sha256(`${firstWords}|${candidate.startDate}|${candidate.cityId}`),
  });

  // Type 3: Date-location match (date + city only, for name variations)
  fingerprints.push({
    type: 'date_location',
    value: sha256(`${candidate.startDate}|${candidate.cityId}`),
  });

  // Type 4: Week-location match (for date disagreements)
  const weekStart = getWeekStart(candidate.startDate);
  fingerprints.push({
    type: 'week_location',
    value: sha256(`${weekStart}|${candidate.cityId}`),
  });

  return fingerprints;
}
```

---

## 4. Deduplication Algorithm

```typescript
async function deduplicateCandidate(
  candidate: NormalizedCandidate
): Promise<DeduplicationResult> {

  // Step 1: Check for exact fingerprint match
  const exactMatch = await findMatchByFingerprint(candidate.fingerprints, 'exact');
  if (exactMatch) {
    return {
      action: 'merge',
      existingEventId: exactMatch.eventId,
      confidence: 0.95,
      matchType: 'exact',
    };
  }

  // Step 2: Check fuzzy name matches
  const fuzzyMatches = await findMatchesByFingerprint(candidate.fingerprints, 'fuzzy_name');
  for (const match of fuzzyMatches) {
    const event = await getEvent(match.eventId);
    const similarity = calculateSimilarity(candidate, event);

    if (similarity >= 0.85) {
      return {
        action: 'merge',
        existingEventId: match.eventId,
        confidence: similarity,
        matchType: 'fuzzy_name',
      };
    }
  }

  // Step 3: Check date-location matches (potential duplicates with name variations)
  const dateLocationMatches = await findMatchesByFingerprint(
    candidate.fingerprints,
    'date_location'
  );

  for (const match of dateLocationMatches) {
    const event = await getEvent(match.eventId);
    const nameSimilarity = jaroWinkler(candidate.normalizedName, normalizeName(event.name));

    if (nameSimilarity >= 0.70) {
      return {
        action: 'review',  // Needs manual review
        existingEventId: match.eventId,
        confidence: nameSimilarity,
        matchType: 'date_location',
      };
    }
  }

  // Step 4: No match found, create new event
  return {
    action: 'create',
    existingEventId: null,
    confidence: 1.0,
    matchType: 'none',
  };
}

function calculateSimilarity(
  candidate: NormalizedCandidate,
  event: Event
): number {
  const weights = {
    name: 0.40,
    date: 0.30,
    location: 0.20,
    venue: 0.10,
  };

  const nameScore = jaroWinkler(candidate.normalizedName, normalizeName(event.name));

  const dateScore = candidate.startDate === event.startDate ? 1.0 :
    Math.abs(daysBetween(candidate.startDate, event.startDate)) <= 1 ? 0.8 :
    Math.abs(daysBetween(candidate.startDate, event.startDate)) <= 7 ? 0.5 : 0;

  const locationScore = candidate.cityId === event.cityId ? 1.0 : 0;

  const venueScore = !candidate.venueId || !event.venueId ? 0.5 :
    candidate.venueId === event.venueId ? 1.0 : 0;

  return (
    weights.name * nameScore +
    weights.date * dateScore +
    weights.location * locationScore +
    weights.venue * venueScore
  );
}
```

---

## 5. Merge Strategy

When a duplicate is found, merge data while preserving provenance.

```typescript
async function mergeIntoEvent(
  existingEventId: number,
  candidate: NormalizedCandidate,
  confidence: number
): Promise<void> {

  const event = await getEvent(existingEventId);
  const source = await getSource(candidate.sourceId);

  // Record the source linkage (always)
  await createEventSource({
    eventId: existingEventId,
    sourceId: candidate.sourceId,
    externalId: candidate.externalId,
    sourceUrl: candidate.sourceUrl,
    rawData: candidate.rawData,
    fetchedAt: new Date(),
  });

  // Determine if source is more authoritative
  const existingSources = await getEventSources(existingEventId);
  const currentBestReliability = Math.max(...existingSources.map(s => s.reliability));

  if (source.reliabilityScore > currentBestReliability) {
    // Upgrade event data from more reliable source
    await updateEvent(existingEventId, {
      name: candidate.rawName,  // Use raw name from better source
      startDate: candidate.startDate,
      endDate: candidate.endDate,
      venueId: candidate.venueId,
      // ... other fields
    });
  }

  // Recalculate confidence score
  const newConfidence = await calculateConfidenceScore(existingEventId);
  await updateEvent(existingEventId, {
    confidenceScore: newConfidence,
    lastVerifiedAt: new Date(),
  });
}
```

---

## 6. Confidence Score Calculation

```typescript
async function calculateConfidenceScore(eventId: number): Promise<number> {
  const event = await getEvent(eventId);
  const sources = await getEventSources(eventId);

  // Factor 1: Source reliability (35%)
  const sourceReliability = sources.length > 0
    ? Math.max(...sources.map(s => s.source.reliabilityScore))
    : 0.3;

  // Factor 2: Data completeness (25%)
  const requiredFields = ['name', 'startDate', 'cityId', 'status'];
  const optionalFields = ['endDate', 'venueId', 'description', 'officialWebsite'];
  const presentRequired = requiredFields.filter(f => event[f] != null).length;
  const presentOptional = optionalFields.filter(f => event[f] != null).length;
  const completeness = (presentRequired / requiredFields.length) * 0.7 +
                       (presentOptional / optionalFields.length) * 0.3;

  // Factor 3: Source agreement (20%)
  const sourceAgreement = calculateSourceAgreement(event, sources);

  // Factor 4: Recency (10%)
  const daysSinceVerification = event.lastVerifiedAt
    ? daysBetween(event.lastVerifiedAt, new Date())
    : 365;
  const recency = Math.max(0, 1 - (daysSinceVerification / 90));  // Decay over 90 days

  // Factor 5: Historical accuracy (10%)
  const historicalAccuracy = await getSourceHistoricalAccuracy(
    sources[0]?.sourceId
  ) ?? 0.5;

  return (
    0.35 * sourceReliability +
    0.25 * completeness +
    0.20 * sourceAgreement +
    0.10 * recency +
    0.10 * historicalAccuracy
  );
}

function calculateSourceAgreement(
  event: Event,
  sources: EventSource[]
): number {
  if (sources.length <= 1) return 0.5;  // No disagreement possible

  let agreements = 0;
  let comparisons = 0;

  // Compare dates across sources
  const dates = sources
    .map(s => s.rawData?.start_date || s.rawData?.date)
    .filter(Boolean);

  if (dates.length > 1) {
    const uniqueDates = new Set(dates.map(d => normalizeDate(d)));
    agreements += uniqueDates.size === 1 ? 1 : 0;
    comparisons += 1;
  }

  // Compare venues across sources
  const venues = sources
    .map(s => s.rawData?.venue?.name || s.rawData?.location)
    .filter(Boolean);

  if (venues.length > 1) {
    const normalizedVenues = venues.map(v => normalizeName(v));
    const venueAgreement = normalizedVenues.every(v => v === normalizedVenues[0]);
    agreements += venueAgreement ? 1 : 0;
    comparisons += 1;
  }

  return comparisons > 0 ? agreements / comparisons : 0.5;
}
```

---

## 7. Pipeline Orchestration

```typescript
async function runIngestionPipeline(): Promise<IngestionReport> {
  const report: IngestionReport = {
    startedAt: new Date(),
    sources: [],
    totalFetched: 0,
    totalCreated: 0,
    totalMerged: 0,
    totalReviewNeeded: 0,
    errors: [],
  };

  const activeSources = await getActiveSources();

  for (const source of activeSources) {
    try {
      const adapter = getAdapter(source);

      // Fetch new data since last run
      const lastFetch = source.lastFetchAt ?? new Date(0);
      const rawEvents = await adapter.fetch({ since: lastFetch });

      const sourceReport = {
        sourceId: source.id,
        sourceName: source.name,
        fetched: rawEvents.length,
        created: 0,
        merged: 0,
        reviewNeeded: 0,
      };

      for (const raw of rawEvents) {
        // Normalize
        const candidate = adapter.normalize(raw);
        const normalized = normalizeCandidate(candidate);

        // Store as candidate
        const candidateId = await storeCandidate(normalized);

        // Deduplicate
        const result = await deduplicateCandidate(normalized);

        switch (result.action) {
          case 'create':
            await createEventFromCandidate(candidateId, normalized);
            sourceReport.created++;
            break;

          case 'merge':
            await mergeIntoEvent(result.existingEventId!, normalized, result.confidence);
            sourceReport.merged++;
            break;

          case 'review':
            await flagForReview(candidateId, result);
            sourceReport.reviewNeeded++;
            break;
        }

        // Mark candidate as processed
        await markCandidateProcessed(candidateId, result);
      }

      // Update source last fetch time
      await updateSource(source.id, { lastFetchAt: new Date() });

      report.sources.push(sourceReport);
      report.totalFetched += sourceReport.fetched;
      report.totalCreated += sourceReport.created;
      report.totalMerged += sourceReport.merged;
      report.totalReviewNeeded += sourceReport.reviewNeeded;

    } catch (error) {
      report.errors.push({
        sourceId: source.id,
        error: error.message,
      });
    }
  }

  report.completedAt = new Date();
  return report;
}
```

---

## 8. Scheduled Tasks

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SCHEDULED TASKS                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  HOURLY                                                              │
│  └── Process manual imports in queue                                 │
│                                                                      │
│  EVERY 6 HOURS                                                       │
│  └── Fetch from API sources (Eventbrite, Songkick, etc.)            │
│                                                                      │
│  DAILY (02:00 UTC)                                                   │
│  ├── Archive past events                                             │
│  ├── Recalculate confidence scores for events with stale data       │
│  ├── Rebuild Typesense index                                         │
│  └── Generate sitemap                                                │
│                                                                      │
│  WEEKLY (Sunday 03:00 UTC)                                           │
│  ├── Full re-verification sweep                                      │
│  └── Cleanup orphaned candidates older than 30 days                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. Error Handling

```typescript
// Errors are categorized for appropriate handling

enum IngestionErrorType {
  // Retriable errors
  NETWORK_TIMEOUT = 'network_timeout',
  RATE_LIMITED = 'rate_limited',
  SOURCE_UNAVAILABLE = 'source_unavailable',

  // Data errors (require investigation)
  PARSE_ERROR = 'parse_error',
  VALIDATION_ERROR = 'validation_error',
  UNKNOWN_CITY = 'unknown_city',

  // System errors (alert immediately)
  DATABASE_ERROR = 'database_error',
  SEARCH_INDEX_ERROR = 'search_index_error',
}

// Retriable errors: exponential backoff, max 3 attempts
// Data errors: log and continue, review queue
// System errors: halt pipeline, alert
```

---

## 10. Manual Import Format

CSV/JSON imports must conform to this structure:

```json
{
  "events": [
    {
      "name": "Festival Gnaoua et Musiques du Monde",
      "event_type": "festival",
      "start_date": "2025-06-26",
      "end_date": "2025-06-29",
      "city": "Essaouira",
      "venue": "Place Moulay Hassan",
      "genres": ["gnawa", "world-music"],
      "artists": ["Maalem Hamid El Kasri", "Hindi Zahra"],
      "official_website": "https://festival-gnaoua.net",
      "source_url": "https://festival-gnaoua.net/edition-2025"
    }
  ],
  "source": {
    "type": "manual_entry",
    "name": "Festival Official Site",
    "reliability": 1.0
  }
}
```

Validation rules:
- `name` required, max 300 chars
- `event_type` must be valid enum value
- `start_date` required, ISO 8601 format
- `city` must match existing city (exact or fuzzy)
- `genres` must be valid slugs
- `source_url` required for provenance
