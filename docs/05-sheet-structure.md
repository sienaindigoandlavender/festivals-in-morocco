# Google Sheets Data Structure

Sheet ID: `1LjfPpLzpuQEkeb34MYrrTFad_PM1wjiS4vPS67sNML0`

---

## Required Sheets

### 1. Events (Required)

The main data sheet. Each row is one event.

| Column | Name | Type | Required | Example |
|--------|------|------|----------|---------|
| A | id | text | Yes | `gnaoua-2025` |
| B | name | text | Yes | `Festival Gnaoua et Musiques du Monde` |
| C | event_type | enum | Yes | `festival` |
| D | start_date | date | Yes | `2025-06-26` |
| E | end_date | date | No | `2025-06-29` |
| F | city | text | Yes | `Essaouira` |
| G | region | text | Yes | `Marrakech-Safi` |
| H | venue | text | No | `Place Moulay Hassan` |
| I | genres | text | No | `Gnawa, World Music, Jazz` |
| J | artists | text | No | `Maalem Hamid El Kasri, Hindi Zahra` |
| K | organizer | text | No | `Association Yerma Gnaoua` |
| L | official_website | url | No | `https://festival-gnaoua.net` |
| M | ticket_url | url | No | `https://festival-gnaoua.net/tickets` |
| N | status | enum | Yes | `confirmed` |
| O | is_verified | bool | No | `TRUE` |
| P | is_pinned | bool | No | `TRUE` |
| Q | cultural_significance | number | No | `9` |
| R | description | text | No | `Annual celebration of Gnawa music...` |
| S | image_url | url | No | `https://...` |

**Enum values:**

- `event_type`: `festival`, `concert`, `showcase`, `ritual`, `conference`
- `status`: `announced`, `confirmed`, `cancelled`, `archived`

**Notes:**

- Dates must be in `YYYY-MM-DD` format
- Genres and artists are comma-separated lists
- Boolean values: `TRUE`/`FALSE`, `Yes`/`No`, or `1`/`0`
- Cultural significance: 0-10 (10 = highest)

---

### 2. Cities (Optional)

Reference data for cities. If omitted, cities are extracted from Events.

| Column | Name | Type | Example |
|--------|------|------|---------|
| A | name | text | `Essaouira` |
| B | name_fr | text | `Essaouira` |
| C | name_ar | text | `الصويرة` |
| D | region | text | `Marrakech-Safi` |
| E | lat | number | `31.5085` |
| F | lng | number | `-9.7595` |

---

### 3. Artists (Optional)

Reference data for artists. If omitted, artists are extracted from Events.

| Column | Name | Type | Example |
|--------|------|------|---------|
| A | name | text | `Hindi Zahra` |
| B | country | text | `MA` |
| C | genres | text | `World Music, Jazz` |
| D | website | url | `https://hindizahra.com` |
| E | image_url | url | `https://...` |

---

### 4. Genres (Optional)

Reference data for genre taxonomy.

| Column | Name | Type | Example |
|--------|------|------|---------|
| A | name | text | `Gnawa` |
| B | parent | text | `` |
| C | description | text | `Traditional Moroccan spiritual music...` |

---

### 5. Regions (Optional)

Reference data for Morocco's 12 regions.

| Column | Name | Type | Example |
|--------|------|------|---------|
| A | name | text | `Marrakech-Safi` |
| B | name_fr | text | `Marrakech-Safi` |
| C | name_ar | text | `مراكش-آسفي` |

---

## Sample Events Data

```
id,name,event_type,start_date,end_date,city,region,venue,genres,artists,organizer,official_website,ticket_url,status,is_verified,is_pinned,cultural_significance,description,image_url
gnaoua-2025,Festival Gnaoua et Musiques du Monde,festival,2025-06-26,2025-06-29,Essaouira,Marrakech-Safi,Place Moulay Hassan,"Gnawa, World Music","Maalem Hamid El Kasri, Hindi Zahra",Association Yerma Gnaoua,https://festival-gnaoua.net,https://festival-gnaoua.net/tickets,confirmed,TRUE,TRUE,10,Annual celebration of Gnawa music,
mawazine-2025,Mawazine Rhythms of the World,festival,2025-06-20,2025-06-28,Rabat,Rabat-Salé-Kénitra,OLM Souissi,"Pop, World Music, Hip Hop","",Maroc Cultures,https://mawazine.ma,,announced,TRUE,TRUE,9,,
timitar-2025,Festival Timitar,festival,2025-07-10,2025-07-13,Agadir,Souss-Massa,,"Amazigh, World Music","",Association Timitar,https://festivaltimitar.ma,,announced,TRUE,FALSE,8,,
```

---

## Environment Variables

Set these in Vercel:

```
GOOGLE_SHEET_ID=1LjfPpLzpuQEkeb34MYrrTFad_PM1wjiS4vPS67sNML0
GOOGLE_API_KEY=your-google-api-key  # Only needed for private sheets
```

**For public sheets:** No API key needed. Make the sheet viewable by "Anyone with the link".

**For private sheets:** Create a Google Cloud project, enable Sheets API, create an API key.

---

## Data Flow

```
┌─────────────────┐
│  Google Sheet   │
│  (you edit)     │
└────────┬────────┘
         │
         │ fetch on build / API request
         ▼
┌─────────────────┐
│  Sheets Client  │
│  (parse rows)   │
└────────┬────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│  Typesense      │  │  Vercel API     │
│  (search)       │  │  (JSON)         │
└─────────────────┘  └─────────────────┘
         │                  │
         └────────┬─────────┘
                  ▼
         ┌─────────────────┐
         │  Astro Pages    │
         │  (static HTML)  │
         └─────────────────┘
```

---

## Updating Data

1. Edit the Google Sheet directly
2. Changes appear on next:
   - API request (if using ISR/SSR)
   - Site rebuild (if using SSG)

For instant updates with SSG, trigger a Vercel rebuild via webhook or manually.

---

## Tips

- **Keep it simple**: One row per event. No merged cells.
- **Consistent dates**: Always `YYYY-MM-DD` format.
- **Consistent lists**: Comma-separated, no trailing commas.
- **Empty cells are fine**: Optional fields can be blank.
- **Don't delete columns**: Add new columns at the end.
- **First row is header**: Always keep column names in row 1.
