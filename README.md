# Hijri Converter BD

Offline bilingual (EN / বাংলা) Gregorian ↔ Hijri date converter for Bangladesh, built on the tabular Islamic calendar.

## Features

1. **Gregorian → Hijri** — convert any Gregorian date (1900–2100) to its tabular Hijri date, with weekday.
2. **Hijri → Gregorian** — convert any Hijri date (1318–1520 AH) back, with weekday.
3. **Today (tabular)** — today's Hijri date from the device clock, labelled approximate.
4. **Hijri month calendar** — a month grid for any Hijri month/year, with the Gregorian date under each Hijri day and today's cell highlighted.
5. **Hijri year at a glance** — all 12 months of a Hijri year: length (29/30 days) and Gregorian start date.
6. **EN / বাংলা toggle** — persisted, with Bengali digits in বাংলা mode; all preferences in localStorage only.

## How the dates are computed

The app uses the **Kuwaiti algorithm** (tabular Islamic calendar, 30-year cycle with 11 leap years) — the same arithmetic used by Fourmilab's calendar converter. It is implemented from scratch in `js/logic.js` (no libraries, no network calls):

- Gregorian ↔ Julian Day Number, Islamic ↔ Julian Day Number, and back.
- Month lengths come from Julian Day differences, so they are always 29 or 30 and sum to the year length (354/355).

### Verified anchors (tabular values)

| Gregorian | Tabular Hijri | Note |
|---|---|---|
| 2000-01-01 | 24 Ramadan 1420 | exact textbook anchor |
| 2025-03-01 | 1 Ramadan 1446 | matches the observed Bangladesh start |
| 2026-03-20 | 1 Shawwal 1447 | Eid-ul-Fitr 2026 |
| 2026-02-18 | 1 Ramadan 1447 | observed Bangladesh start was 2026-02-19 (−1 day) |
| 2025-06-27 | 1 Muharram 1447 | observed Bangladesh start was 2025-06-26 (+1 day) |

### Important limitation — read this

**Tabular dates are approximate.** The real Hijri date in Bangladesh depends on actual moon sighting and may differ from the tabular date by **one day** (both directions are observed above). Always confirm Ramadan, Eid, and other religious dates from official announcements. This app is a personal calculation tool, not a religious authority.

## Stack

Vanilla HTML/CSS/JavaScript. No build step, no dependencies, no network requests. Works by opening `index.html` or from any static host (GitHub Pages).

## Run locally

```sh
# just open it
open index.html
# or serve it
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Tests

```sh
node tests/logic.test.js   # calendar math: anchors, validation, round-trips
node tests/smoke.js        # headless-Chrome UI smoke test (raw CDP, /opt/meta-chromium/chrome)
```

## Status

Factory run #158 (18:00 slot, 2026-10-27). See `TEST_RESULTS.md` for the real test output of this build.
