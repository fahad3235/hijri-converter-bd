// Node unit tests for js/logic.js. Run: node tests/logic.test.js
const assert = require('assert');
const L = require('../js/logic.js');

let n = 0;
function eq(actual, expected, name) {
  n++;
  assert.deepStrictEqual(actual, expected, name + ' \u2014 got ' + JSON.stringify(actual));
  console.log('ok - ' + name);
}

// Known anchors. Tabular dates may differ from moon-sighting-observed
// dates by one day; these assert the TABULAR algorithm's own values.
eq(L.gregorianToIslamic(2000, 1, 1), { year: 1420, month: 9, day: 24 }, 'anchor 2000-01-01 = 24 Ramadan 1420');
eq(L.gregorianToIslamic(2025, 3, 1), { year: 1446, month: 9, day: 1 }, 'anchor 2025-03-01 = 1 Ramadan 1446 (matches observed BD start)');
eq(L.gregorianToIslamic(2026, 3, 20), { year: 1447, month: 10, day: 1 }, 'anchor 2026-03-20 = 1 Shawwal 1447 (Eid-ul-Fitr 2026)');
eq(L.islamicToGregorian(1447, 9, 1), { year: 2026, month: 2, day: 18 }, 'tabular 1 Ramadan 1447 = 2026-02-18 (observed BD was 2026-02-19: -1 day, documented)');
eq(L.islamicToGregorian(1447, 1, 1), { year: 2025, month: 6, day: 27 }, 'tabular 1 Muharram 1447 = 2025-06-27 (observed BD was 2025-06-26: +1 day, documented)');
eq(L.gregorianToIslamic(2026, 10, 27), { year: 1448, month: 5, day: 15 }, 'today anchor 2026-10-27 = 15 Jumada al-Ula 1448');

// Month lengths and leap cycle.
eq(L.islamicMonthLength(1447, 9), 30, 'Ramadan 1447 has 30 days');
eq(L.islamicMonthLength(1447, 12), 30, 'Dhul-Hijjah 1447 has 30 days (leap year)');
eq(L.isIslamicLeapYear(1447), true, '1447 is a leap year (355 days)');
eq(L.islamicYearLength(1447), 355, '1447 length 355');
eq(L.islamicYearLength(1448), 354, '1448 length 354');
eq(L.islamicMonthLength(1448, 2), 29, 'Safar 1448 has 29 days');

// Weekdays: 2026-10-27 is a Tuesday (2), 2000-01-01 a Saturday (6).
eq(L.gregorianWeekday(2026, 10, 27), 2, 'weekday Tue 2026-10-27');
eq(L.gregorianWeekday(2000, 1, 1), 6, 'weekday Sat 2000-01-01');
eq(L.gregorianWeekday(2025, 3, 1), 6, 'weekday Sat 2025-03-01');

// Gregorian helpers.
eq(L.isGregorianLeapYear(2024), true, '2024 leap');
eq(L.isGregorianLeapYear(1900), false, '1900 not leap');
eq(L.isGregorianLeapYear(2000), true, '2000 leap');
eq(L.gregorianMonthLength(2024, 2), 29, 'Feb 2024 = 29');
eq(L.gregorianMonthLength(2025, 2), 28, 'Feb 2025 = 28');

// Validation.
eq(L.validateGregorian(2026, 2, 30), 'day-range', 'Feb 30 rejected');
eq(L.validateGregorian(2026, 2, 29), 'day-range', 'Feb 29 2026 rejected (not leap)');
eq(L.validateGregorian(2024, 2, 29), null, 'Feb 29 2024 accepted');
eq(L.validateGregorian(1899, 1, 1), 'year-range', 'Gregorian year floor');
eq(L.validateGregorian(2101, 1, 1), 'year-range', 'Gregorian year ceiling');
eq(L.validateGregorian(2026, 13, 1), 'month-range', 'month 13 rejected');
eq(L.validateIslamic(1447, 9, 31), 'day-range', 'Ramadan day 31 rejected');
eq(L.validateIslamic(1447, 9, 30), null, 'Ramadan day 30 accepted');
eq(L.validateIslamic(1448, 2, 30), 'day-range', 'Safar 1448 day 30 rejected (29-day month)');
eq(L.validateIslamic(1317, 1, 1), 'year-range', 'Hijri year floor');
eq(L.validateIslamic(1521, 1, 1), 'year-range', 'Hijri year ceiling');

// Round-trips: every day-of-month 1-28, 2000-2030 Gregorian.
let bad = 0;
for (let y = 2000; y <= 2030; y++) {
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= 28; d++) {
      const r = L.roundTripGregorian(y, m, d);
      if (r.year !== y || r.month !== m || r.day !== d) bad++;
    }
  }
}
n++;
assert.strictEqual(bad, 0, 'Gregorian round-trips must all pass');
console.log('ok - Gregorian round-trips 2000-2030 (days 1-28): 0 failures');

// Round-trips: every day of every month, Hijri years 1420-1470.
bad = 0;
for (let y = 1420; y <= 1470; y++) {
  for (let m = 1; m <= 12; m++) {
    const len = L.islamicMonthLength(y, m);
    for (let d = 1; d <= len; d++) {
      const r = L.roundTripIslamic(y, m, d);
      if (r.year !== y || r.month !== m || r.day !== d) bad++;
    }
  }
}
n++;
assert.strictEqual(bad, 0, 'Islamic round-trips must all pass');
console.log('ok - Islamic round-trips 1420-1470 (all days): 0 failures');

// Month lengths always 29 or 30; year length = sum of months.
for (let y = 1420; y <= 1470; y++) {
  let sum = 0;
  for (let m = 1; m <= 12; m++) {
    const len = L.islamicMonthLength(y, m);
    assert.ok(len === 29 || len === 30, 'month length 29/30');
    sum += len;
  }
  assert.strictEqual(sum, L.islamicYearLength(y), 'year length = month sum');
}
n++;
console.log('ok - month lengths 29/30 and year sums for 1420-1470');

console.log('UNIT TESTS: ' + n + ' groups green');
