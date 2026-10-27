// hijri-converter-bd \u2014 DOM-free calendar math (tabular Islamic calendar).
// Algorithm: the Kuwaiti algorithm (tabular Islamic calendar, 30-year cycle
// with 11 leap years), as used by Fourmilab's calendar converter and others.
// It is an ARITHMETICAL calendar: real Hijri dates in Bangladesh depend on
// actual moon sighting and may differ by +/-1 day. Every result in the app
// is therefore labelled "tabular (approximate)".
// All functions are pure and unit-tested in tests/logic.test.js.
(function (root) {
  'use strict';

  // Gregorian (y, m 1-12, d) -> Julian Day number (with .5 fraction).
  function gregorianToJD(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    var a = Math.floor(y / 100);
    var b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
  }

  // Islamic (y, m 1-12, d) -> Julian Day number.
  function islamicToJD(y, m, d) {
    return d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 +
      Math.floor((3 + 11 * y) / 30) + 1948439.5 - 1;
  }

  // Julian Day number -> Gregorian {year, month, day} (Fliegel-Van Flandern).
  function jdToGregorian(jd) {
    var l = Math.floor(jd + 0.5) + 68569;
    var n = Math.floor(4 * l / 146097);
    l = l - Math.floor((146097 * n + 3) / 4);
    var i = Math.floor(4000 * (l + 1) / 1461001);
    l = l - Math.floor(1461 * i / 4) + 31;
    var j = Math.floor(80 * l / 2447);
    var day = l - Math.floor(2447 * j / 80);
    l = Math.floor(j / 11);
    var month = j + 2 - 12 * l;
    var year = 100 * (n - 49) + i + l;
    return { year: year, month: month, day: day };
  }

  // Julian Day number -> Islamic {year, month, day}.
  function jdToIslamic(jd) {
    jd = Math.floor(jd) + 0.5;
    var year = Math.floor(((30 * (jd - 1948439.5)) + 10646) / 10631);
    var month = Math.min(12, Math.ceil((jd - (29 + islamicToJD(year, 1, 1))) / 29.5) + 1);
    var day = Math.floor(jd - islamicToJD(year, month, 1) + 1);
    return { year: year, month: month, day: day };
  }

  // Public: Gregorian date object -> Islamic date object.
  function gregorianToIslamic(y, m, d) {
    return jdToIslamic(gregorianToJD(y, m, d));
  }

  // Public: Islamic date object -> Gregorian date object.
  function islamicToGregorian(y, m, d) {
    return jdToGregorian(islamicToJD(y, m, d));
  }

  // Length of an Islamic month (29 or 30), via JD difference.
  function islamicMonthLength(y, m) {
    var nm = m + 1, ny = y;
    if (nm > 12) { nm = 1; ny = y + 1; }
    return Math.round(islamicToJD(ny, nm, 1) - islamicToJD(y, m, 1));
  }

  // Is this Islamic year a leap year (355 days) in the 30-year cycle?
  function isIslamicLeapYear(y) {
    return (((11 * y) + 14) % 30) < 11;
  }

  function islamicYearLength(y) {
    return isIslamicLeapYear(y) ? 355 : 354;
  }

  // Gregorian weekday: 0 = Sunday .. 6 = Saturday (proleptic Gregorian).
  function gregorianWeekday(y, m, d) {
    // Zeller-free: JD + 1.5 mod 7 gives 0=Sunday for integer JD days.
    var jd = Math.floor(gregorianToJD(y, m, d) + 0.5);
    return (((jd + 1) % 7) + 7) % 7;
  }

  function isGregorianLeapYear(y) {
    return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  }

  function gregorianMonthLength(y, m) {
    var lens = [31, isGregorianLeapYear(y) ? 29 : 28, 31, 30, 31, 30,
      31, 31, 30, 31, 30, 31];
    return lens[m - 1];
  }

  // Strict validation. Returns null when valid, else an error key.
  function validateGregorian(y, m, d) {
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return 'bad-number';
    if (y < 1900 || y > 2100) return 'year-range';
    if (m < 1 || m > 12) return 'month-range';
    if (d < 1 || d > gregorianMonthLength(y, m)) return 'day-range';
    return null;
  }

  function validateIslamic(y, m, d) {
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return 'bad-number';
    if (y < 1318 || y > 1520) return 'year-range'; // ~1900-2100 Gregorian
    if (m < 1 || m > 12) return 'month-range';
    if (d < 1 || d > islamicMonthLength(y, m)) return 'day-range';
    return null;
  }

  // Round-trip helpers used by tests and the month grid.
  function roundTripGregorian(y, m, d) {
    var h = gregorianToIslamic(y, m, d);
    return islamicToGregorian(h.year, h.month, h.day);
  }

  function roundTripIslamic(y, m, d) {
    var g = islamicToGregorian(y, m, d);
    return gregorianToIslamic(g.year, g.month, g.day);
  }

  var api = {
    gregorianToJD: gregorianToJD,
    islamicToJD: islamicToJD,
    jdToGregorian: jdToGregorian,
    jdToIslamic: jdToIslamic,
    gregorianToIslamic: gregorianToIslamic,
    islamicToGregorian: islamicToGregorian,
    islamicMonthLength: islamicMonthLength,
    isIslamicLeapYear: isIslamicLeapYear,
    islamicYearLength: islamicYearLength,
    gregorianWeekday: gregorianWeekday,
    isGregorianLeapYear: isGregorianLeapYear,
    gregorianMonthLength: gregorianMonthLength,
    validateGregorian: validateGregorian,
    validateIslamic: validateIslamic,
    roundTripGregorian: roundTripGregorian,
    roundTripIslamic: roundTripIslamic
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.HijriLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
