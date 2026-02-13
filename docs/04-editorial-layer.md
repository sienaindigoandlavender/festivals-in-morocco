# Editorial Layer

Thin control layer for data quality. Not a CMS.

---

## Design Principles

1. **Flags, not content** - Editorial actions modify metadata, not create prose
2. **Reversible** - All actions can be undone
3. **Auditable** - All changes are logged with timestamp and actor
4. **Minimal interface** - No rich text editors, no media uploads

---

## Editorial Actions

### 1. Verify Event

Mark an event as editorially verified.

```typescript
interface VerifyAction {
  event_id: number;
  verified: boolean;
  notes?: string;  // Internal notes, not public
}

// Effect:
// - Sets events.is_verified = true
// - Sets events.last_verified_at = NOW()
// - Logs action to audit table
```

**Criteria for verification**:
- Official source confirmed
- Dates match official announcement
- Venue confirmed
- Event is not a duplicate

---

### 2. Pin Event

Promote an event to appear at top of listings regardless of date.

```typescript
interface PinAction {
  event_id: number;
  pinned: boolean;
  reason?: string;
}

// Effect:
// - Sets events.is_pinned = true
// - Logs action with reason
```

**Criteria for pinning**:
- Major cultural significance
- National/international recognition
- Historical importance (e.g., Gnaoua Festival, Mawazine)

---

### 3. Set Cultural Significance

Assign a significance score (0-10) that affects ranking.

```typescript
interface SignificanceAction {
  event_id: number;
  score: number;  // 0-10
}

// Effect:
// - Sets events.cultural_significance = score
// - Affects search ranking
```

**Score guide**:

| Score | Criteria |
|-------|----------|
| 0 | Unknown/unrated |
| 1-3 | Local event, limited attendance |
| 4-6 | Regional significance, established event |
| 7-8 | National significance, major festival |
| 9-10 | International recognition, cultural landmark |

---

### 4. Update Event Status

Manually change event status when automated detection fails.

```typescript
interface StatusAction {
  event_id: number;
  status: 'announced' | 'confirmed' | 'cancelled' | 'postponed' | 'archived';
  source_url?: string;  // Evidence for the change
}

// Effect:
// - Sets events.status = status
// - Records source_url as provenance
```

---

### 5. Merge Duplicate Events

Combine two events that represent the same occurrence.

```typescript
interface MergeAction {
  keep_event_id: number;     // Event to keep
  merge_event_id: number;    // Event to merge into kept event
}

// Effect:
// - Moves all event_sources from merge_event to keep_event
// - Moves all event_artists from merge_event to keep_event (if not duplicate)
// - Deletes merge_event
// - Logs both IDs for audit
```

---

### 6. Archive Event

Manually archive an event before automatic archival.

```typescript
interface ArchiveAction {
  event_id: number;
  reason?: string;  // e.g., "duplicate", "spam", "not a real event"
}

// Effect:
// - Sets events.status = 'archived'
// - Removes from search index
// - Keeps in database for provenance
```

---

## Audit Log

All editorial actions are logged.

```sql
CREATE TABLE editorial_actions (
    id              SERIAL PRIMARY KEY,
    action_type     VARCHAR(50) NOT NULL,
    event_id        INTEGER NOT NULL REFERENCES events(id),
    actor           VARCHAR(100) NOT NULL,  -- Email or identifier
    payload         JSONB NOT NULL,         -- Action-specific data
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_editorial_event ON editorial_actions(event_id);
CREATE INDEX idx_editorial_actor ON editorial_actions(actor);
CREATE INDEX idx_editorial_time ON editorial_actions(created_at);
```

---

## Admin Interface

### Requirements

- **Authentication**: Single admin account, no public registration
- **Authorization**: IP allowlist + password
- **Interface**: Server-rendered HTML forms, no SPA

### Pages

```
/admin
├── /admin/login              Login page
├── /admin/events             Event list with search/filter
│   └── /admin/events/:id     Event edit form
├── /admin/candidates         Pending candidates for review
│   └── /admin/candidates/:id Candidate review form
├── /admin/import             Manual CSV/JSON import
└── /admin/audit              Recent editorial actions
```

### Event Edit Form

Fields editable by admin:

```
┌─────────────────────────────────────────────────────────────────┐
│  EDIT EVENT: Festival Gnaoua 2025                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Status      [Dropdown: announced / confirmed / cancelled / ...]│
│                                                                  │
│  ☑ Verified                                                      │
│  ☑ Pinned                                                        │
│                                                                  │
│  Cultural Significance  [0] [1] [2] [3] [4] [5] [6] [7] [8] [9] │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│                                                                  │
│  Name        [Festival Gnaoua et Musiques du Monde 2025     ]   │
│  Start Date  [2025-06-26]                                        │
│  End Date    [2025-06-29]                                        │
│  City        [Essaouira ▼]                                       │
│  Venue       [Place Moulay Hassan ▼]                             │
│                                                                  │
│  Official Website  [https://festival-gnaoua.net            ]    │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│                                                                  │
│  Artists (comma-separated slugs):                                │
│  [maalem-hamid-el-kasri, hindi-zahra, oum                   ]   │
│                                                                  │
│  Genres (comma-separated slugs):                                 │
│  [gnawa, world-music, jazz                                  ]   │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│                                                                  │
│  Internal Notes (not public):                                    │
│  [Confirmed via official Instagram post 2025-01-15         ]    │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│                                                                  │
│  Sources (read-only):                                            │
│  - official_website: https://festival-gnaoua.net/edition-2025   │
│  - eventbrite_api: evt_abc123                                    │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│                                                                  │
│  [Save Changes]        [Archive Event]        [Cancel]           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Candidate Review Form

For events that need manual deduplication decision:

```
┌─────────────────────────────────────────────────────────────────┐
│  REVIEW CANDIDATE                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │ INCOMING CANDIDATE  │    │ POTENTIAL MATCH     │            │
│  ├─────────────────────┤    ├─────────────────────┤            │
│  │ Gnaoua Festival '25 │    │ Festival Gnaoua     │            │
│  │ 2025-06-26          │    │ 2025-06-26          │            │
│  │ Essaouira           │    │ Essaouira           │            │
│  │                     │    │                     │            │
│  │ Source: Eventbrite  │    │ Sources: 3          │            │
│  │ Confidence: 0.72    │    │ Confidence: 0.85    │            │
│  └─────────────────────┘    └─────────────────────┘            │
│                                                                  │
│  Match confidence: 78%                                           │
│                                                                  │
│  Actions:                                                        │
│  [Merge into existing]  [Create new event]  [Discard candidate] │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## What Editorial Does NOT Include

| Feature | Reason Excluded |
|---------|-----------------|
| Rich text editing | Events don't need prose |
| Image uploads | Adds complexity, copyright issues |
| User comments | Not a social platform |
| Event ratings | Not a review site |
| Email notifications | Over-engineering |
| Multi-user roles | Solo-founder, one admin |
| Workflow states | Unnecessary complexity |
| Content scheduling | Not a publishing platform |

---

## Implementation Notes

### Admin Authentication

Simple, secure, minimal:

```typescript
// Single admin auth via environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const ALLOWED_IPS = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];

// Session: signed cookie, 24h expiry
// No database session storage needed for single admin
```

### Rate Limiting

Protect against brute force:

```typescript
// Login: 5 attempts per IP per hour
// API: 10 requests per minute per session
```

### Backup Before Merge

Before any merge operation:

```typescript
async function mergeEvents(keepId: number, mergeId: number) {
  // Snapshot the merge target before deletion
  const snapshot = await db.selectFrom('events').where('id', '=', mergeId).executeTakeFirst();

  await db.insertInto('event_snapshots').values({
    event_id: mergeId,
    data: JSON.stringify(snapshot),
    reason: 'pre_merge',
    created_at: new Date(),
  }).execute();

  // Proceed with merge...
}
```
