# TEST RESULTS — hijri-converter-bd (factory run #159, 18:00 slot, 2026-10-27)

## Node unit tests — 34/34 green, 0 failures

Run: `node tests/logic.test.js`

- Anchors (tabular algorithm values): 2000-01-01 = 24 Ramadan 1420; 2025-03-01 = 1 Ramadan 1446 (matches observed Bangladesh start); 2026-03-20 = 1 Shawwal 1447 (Eid-ul-Fitr 2026); 1 Ramadan 1447 = 2026-02-18; 1 Muharram 1447 = 2025-06-27; 2026-10-27 = 15 Jumada al-Ula 1448.
- Month/year math: Ramadan 1447 = 30 days, Dhul-Hijjah 1447 = 30 days, 1447 is a leap year (355 days), 1448 = 354 days, Safar 1448 = 29 days.
- Weekdays: 2026-10-27 = Tuesday, 2000-01-01 = Saturday, 2025-03-01 = Saturday.
- Validation: Feb 30 / Feb 29-2026 / month 13 / Ramadan day 31 / Safar-1448 day 30 rejected; Feb 29-2024 / Ramadan day 30 accepted; year floors/ceilings enforced both calendars.
- Round-trips: Gregorian 2000–2030 (days 1–28) = 0 failures; Islamic 1420–1470 (every day) = 0 failures; month lengths always 29/30 and sum to the year length.

## Headless-Chrome smoke — 13/13 green, 0 console/page errors

Run: `node tests/smoke.js` (raw CDP, /opt/meta-chromium/chrome, file://)

- Title, today line, G2H 2026-02-18 → 1 Ramadan 1447, H2G 1 Ramadan 1447 → 18 February 2026, invalid day 31 → inline error, Ramadan 1447 grid = 30 cells, year view = 12 rows, BN toggle (html lang bn, Bengali title + Bengali digits), localStorage persistence, 390px no horizontal overflow.

## Test-side fixes (0 app-logic bugs)

- Smoke regexes for Bengali ranges were corrupted in transit to U+00A0; rewritten as explicit ASCII escapes (Bengali block U+0980–U+09FF, digits U+09E6–U+09EF) and re-run green. The app itself rendered Bengali correctly in both runs.

## Observed-vs-tabular note (honest, not a bug)

The tabular algorithm differs from moon-sighting-observed Bangladesh dates by one day in two checked cases: 1 Ramadan 1447 tabular 2026-02-18 vs observed 2026-02-19; 1 Muharram 1447 tabular 2025-06-27 vs observed 2025-06-26. The app, README, and footer all label results approximate and point users to official announcements.

## Source hygiene

- index.html, css, js, tests are pure ASCII (Bengali as \uXXXX escapes in JS, numeric entities in HTML; verified with grep -P). README.md keeps readable Bengali prose; the push payload is ASCII-escaped (ensure_ascii=True), so transport is safe.
- Zero network requests by design (no CDN, no fonts, no analytics).
