// hijri-converter-bd \u2014 UI wiring. Depends on HijriLogic + HijriI18N.
// Pure-ASCII file: all Bengali text lives in js/i18n.js (escaped).
(function () {
  'use strict';
  var L = window.HijriLogic;
  var I18N = window.HijriI18N;
  var LS_KEY = 'hijri-converter-bd-v1';
  var BN_DIGITS = ['\u09e6', '\u09e7', '\u09e8', '\u09e9', '\u09ea', '\u09eb', '\u09ec', '\u09ed', '\u09ee', '\u09ef'];

  var state = load() || {};
  var lang = state.lang === 'bn' ? 'bn' : 'en';

  function load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || null; }
    catch (e) { return null; }
  }
  function save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        lang: lang,
        gDate: el('gDate').value || '',
        hDay: el('hDay').value || '',
        hMonth: el('hMonth').value || '',
        hYear: el('hYear').value || '',
        gridMonth: el('gridMonth').value || '',
        gridYear: el('gridYear').value || '',
        yearView: el('yearView').value || ''
      }));
    } catch (e) { /* storage unavailable: app still works */ }
  }
  function el(id) { return document.getElementById(id); }
  function t(key) { return I18N[lang][key]; }

  // Format a number: Bengali digits in BN mode, Latin otherwise.
  function num(n) {
    var s = String(n);
    if (lang !== 'bn') return s;
    return s.replace(/[0-9]/g, function (ch) { return BN_DIGITS[+ch]; });
  }
  // Format a Gregorian date as "18 February 2026" (localized month name).
  function fmtGregorian(g) {
    return num(g.day) + ' ' + t('gregMonths')[g.month - 1] + ' ' + num(g.year);
  }
  function fmtHijri(h) {
    return num(h.day) + ' ' + t('months')[h.month - 1] + ' ' + num(h.year);
  }
  function fmtWeekday(y, m, d) {
    return t('weekdaysFull')[L.gregorianWeekday(y, m, d)];
  }

  function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach(function (node) {
      node.textContent = t(node.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (node) {
      node.setAttribute('placeholder', t(node.getAttribute('data-i18n-ph')));
    });
    el('langEn').classList.toggle('active', lang === 'en');
    el('langBn').classList.toggle('active', lang === 'bn');
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
    renderAll();
  }

  function setError(boxId, msgKey) {
    var box = el(boxId);
    box.textContent = msgKey ? t(msgKey) : '';
    box.style.display = msgKey ? 'block' : 'none';
  }

  function errKeyFor(code, isGreg) {
    if (code === 'year-range') return isGreg ? 'errYearRangeG' : 'errYearRangeH';
    if (code === 'month-range') return 'errMonth';
    if (code === 'day-range') return 'errDay';
    return 'errBad';
  }

  function renderToday() {
    var now = new Date();
    var g = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    var h = L.gregorianToIslamic(g.year, g.month, g.day);
    el('todayLine').textContent = fmtHijri(h) + '  \u2022  ' + fmtGregorian(g) + '  \u2022  ' + fmtWeekday(g.year, g.month, g.day);
  }

  function convertG2H() {
    var v = el('gDate').value;
    if (!v) { setError('g2hError', 'errBad'); el('g2hResult').textContent = ''; return; }
    var parts = v.split('-').map(Number);
    var code = L.validateGregorian(parts[0], parts[1], parts[2]);
    if (code) { setError('g2hError', errKeyFor(code, true)); el('g2hResult').textContent = ''; return; }
    setError('g2hError', null);
    var h = L.gregorianToIslamic(parts[0], parts[1], parts[2]);
    el('g2hResult').textContent = t('resultPrefix') + ': ' + fmtHijri(h) + '  \u2022  ' + fmtWeekday(parts[0], parts[1], parts[2]);
    save();
  }

  function convertH2G() {
    var d = parseInt(el('hDay').value, 10);
    var m = parseInt(el('hMonth').value, 10);
    var y = parseInt(el('hYear').value, 10);
    var code = L.validateIslamic(y, m, d);
    if (code) { setError('h2gError', errKeyFor(code, false)); el('h2gResult').textContent = ''; return; }
    setError('h2gError', null);
    var g = L.islamicToGregorian(y, m, d);
    el('h2gResult').textContent = t('resultPrefix') + ': ' + fmtGregorian(g) + '  \u2022  ' + fmtWeekday(g.year, g.month, g.day);
    save();
  }

  function renderGrid() {
    var m = parseInt(el('gridMonth').value, 10);
    var y = parseInt(el('gridYear').value, 10);
    var box = el('gridBody');
    var code = L.validateIslamic(y, m, 1);
    if (code) { setError('gridError', errKeyFor(code, false)); box.innerHTML = ''; return; }
    setError('gridError', null);
    var len = L.islamicMonthLength(y, m);
    var firstG = L.islamicToGregorian(y, m, 1);
    var startWd = L.gregorianWeekday(firstG.year, firstG.month, firstG.day); // 0=Sun
    el('gridTitle').textContent = t('gridTitle') + ': ' + t('months')[m - 1] + ' ' + num(y) +
      '  \u2022  ' + fmtGregorian(firstG);
    var html = '<div class="grid-head">' + t('weekdays').map(function (w) {
      return '<div>' + w + '</div>';
    }).join('') + '</div><div class="grid-cells">';
    for (var i = 0; i < startWd; i++) html += '<div class="cell empty"></div>';
    for (var d = 1; d <= len; d++) {
      var g = L.islamicToGregorian(y, m, d);
      var today = new Date();
      var isToday = g.year === today.getFullYear() && g.month === today.getMonth() + 1 && g.day === today.getDate();
      html += '<div class="cell' + (isToday ? ' today' : '') + '"><b>' + num(d) + '</b><span>' +
        num(g.day) + ' ' + t('gregMonths')[g.month - 1].slice(0, 3) + '</span></div>';
    }
    html += '</div>';
    box.innerHTML = html;
    save();
  }

  function renderYear() {
    var y = parseInt(el('yearView').value, 10);
    var box = el('yearBody');
    var code = L.validateIslamic(y, 1, 1);
    if (code) { setError('yearError', errKeyFor(code, false)); box.innerHTML = ''; return; }
    setError('yearError', null);
    var rows = '';
    for (var m = 1; m <= 12; m++) {
      var g = L.islamicToGregorian(y, m, 1);
      rows += '<tr><td>' + t('months')[m - 1] + '</td><td>' + num(L.islamicMonthLength(y, m)) +
        '</td><td>' + fmtGregorian(g) + '</td></tr>';
    }
    box.innerHTML = '<table><thead><tr><th>' + t('monthCol') + '</th><th>' + t('daysCol') +
      '</th><th>' + t('startsCol') + '</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="muted">' + num(L.islamicYearLength(y)) + ' ' + t('daysCol').toLowerCase() + '</p>';
    save();
  }

  function renderAll() {
    renderToday();
    if (el('gDate').value) convertG2H(); else el('g2hResult').textContent = '';
    if (el('hDay').value && el('hMonth').value && el('hYear').value) convertH2G(); else el('h2gResult').textContent = '';
    renderGrid();
    renderYear();
  }

  function fillMonthSelects() {
    [el('hMonth'), el('gridMonth')].forEach(function (sel) {
      if (sel.options.length) return;
      for (var m = 1; m <= 12; m++) {
        var o = document.createElement('option');
        o.value = m; o.textContent = m + ' - ' + I18N.en.months[m - 1];
        sel.appendChild(o);
      }
    });
  }

  function init() {
    fillMonthSelects();
    var now = new Date();
    var todayH = L.gregorianToIslamic(now.getFullYear(), now.getMonth() + 1, now.getDate());
    el('gDate').value = state.gDate || (now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0'));
    el('hDay').value = state.hDay || '';
    el('hMonth').value = state.hMonth || '9';
    el('hYear').value = state.hYear || String(todayH.year);
    el('gridMonth').value = state.gridMonth || String(todayH.month);
    el('gridYear').value = state.gridYear || String(todayH.year);
    el('yearView').value = state.yearView || String(todayH.year);

    el('langEn').addEventListener('click', function () { lang = 'en'; save(); applyLang(); });
    el('langBn').addEventListener('click', function () { lang = 'bn'; save(); applyLang(); });
    el('g2hBtn').addEventListener('click', convertG2H);
    el('h2gBtn').addEventListener('click', convertH2G);
    el('gridBtn').addEventListener('click', renderGrid);
    el('yearBtn').addEventListener('click', renderYear);
    el('todayBtn').addEventListener('click', function () {
      var n = new Date();
      el('gDate').value = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') +
        '-' + String(n.getDate()).padStart(2, '0');
      convertG2H();
    });
    applyLang();
  }

  // Expose internals for the headless smoke test (?test=1 sets window.__hijriTest).
  window.HijriApp = { num: num, fmtHijri: fmtHijri, fmtGregorian: fmtGregorian, state: state };
  document.addEventListener('DOMContentLoaded', init);
})();
