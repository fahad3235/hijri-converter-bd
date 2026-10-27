// Headless-Chrome smoke test via raw CDP (no puppeteer dependency).
// Usage: node tests/smoke.js
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 9347;
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
let failures = 0;
let count = 0;
const pageErrors = [];
function check(name, cond, extra) {
  count++;
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function poll(fn, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { if (await fn()) return true; } catch (e) { /* retry */ }
    await wait(200);
  }
  return false;
}

(async () => {
  const chrome = spawn('/opt/meta-chromium/chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/hijri-smoke-' + process.pid,
    'about:blank',
  ], { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    await wait(200);
    try {
      targets = JSON.parse(await new Promise((res, rej) => {
        http.get('http://127.0.0.1:' + PORT + '/json/list', (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
        }).on('error', rej);
      }));
    } catch (e) { /* retry */ }
  }
  if (!targets.length) { console.log('FAIL - chrome did not start'); process.exit(2); }
  const wsUrl = targets[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => { ws.onopen = res; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push(JSON.stringify(msg.params.args));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
    }
  };
  const send = (method, params) => new Promise((res) => {
    const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: FILE });
  await wait(1500);
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.result && r.result.exceptionDetails) return { error: JSON.stringify(r.result.exceptionDetails).slice(0, 300) };
    return r.result ? r.result.result.value : undefined;
  };

  check('page title contains Hijri', (await ev('document.title'))?.includes('Hijri'));
  check('today line renders a Hijri date', (await ev(`document.getElementById('todayLine').textContent.trim().length`)) > 10);

  // G->H: 2026-02-18 must be 1 Ramadan 1447 (tabular).
  await ev(`document.getElementById('gDate').value = '2026-02-18'`);
  await ev(`document.getElementById('g2hBtn').click()`);
  check('G2H 2026-02-18 -> 1 Ramadan 1447', await poll(async () => {
    const t = await ev(`document.getElementById('g2hResult').textContent`);
    return /1 Ramadan 1447/.test(t);
  }, 3000), String(await ev(`document.getElementById('g2hResult').textContent`)));

  // H->G: 1 Ramadan 1447 must be 18 February 2026.
  await ev(`document.getElementById('hDay').value = '1'`);
  await ev(`document.getElementById('hMonth').value = '9'`);
  await ev(`document.getElementById('hYear').value = '1447'`);
  await ev(`document.getElementById('h2gBtn').click()`);
  check('H2G 1 Ramadan 1447 -> 18 February 2026', await poll(async () => {
    const t = await ev(`document.getElementById('h2gResult').textContent`);
    return /18 February 2026/.test(t);
  }, 3000), String(await ev(`document.getElementById('h2gResult').textContent`)));

  // Invalid Hijri day shows an inline error, no result.
  await ev(`document.getElementById('hDay').value = '31'`);
  await ev(`document.getElementById('h2gBtn').click()`);
  await wait(300);
  check('invalid day 31 shows error', (await ev(`document.getElementById('h2gError').style.display`)) === 'block');

  // Month grid: Ramadan 1447 has 30 day cells.
  await ev(`document.getElementById('gridMonth').value = '9'`);
  await ev(`document.getElementById('gridYear').value = '1447'`);
  await ev(`document.getElementById('gridBtn').click()`);
  await wait(400);
  check('Ramadan 1447 grid has 30 day cells',
    (await ev(`document.querySelectorAll('#gridBody .cell:not(.empty)').length`)) === 30);

  // Year view: 1447 has 12 month rows.
  await ev(`document.getElementById('yearView').value = '1447'`);
  await ev(`document.getElementById('yearBtn').click()`);
  await wait(400);
  check('year view has 12 month rows',
    (await ev(`document.querySelectorAll('#yearBody tbody tr').length`)) === 12);

  // Language toggle -> BN: title in Bengali, digits in Bengali.
  await ev(`document.getElementById('langBn').click()`);
  await wait(400);
  check('html lang switches to bn', (await ev(`document.documentElement.lang`)) === 'bn');
  const bnTitle = String(await ev(`document.querySelector('[data-i18n="title"]').textContent`));
  check('title renders Bengali in BN mode', /[\u0980-\u09FF]/.test(bnTitle), bnTitle);
  const bnToday = String(await ev(`document.getElementById('todayLine').textContent`));
  check('today line uses Bengali digits in BN mode', /[\u09E6-\u09EF]/.test(bnToday), bnToday);
  check('preference persists in localStorage', typeof (await ev(`localStorage.getItem('hijri-converter-bd-v1')`)) === 'string');

  // 390px mobile check via emulation.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await wait(600);
  const overflow = await ev(`document.documentElement.scrollWidth > 390 + 5`);
  check('390px viewport: no horizontal overflow', overflow === false, 'scrollWidth exceeded');
  check('no page console/exception errors', pageErrors.length === 0, pageErrors.join(' | '));

  ws.close(); chrome.kill();
  console.log('SMOKE CHECKS: ' + count + ', FAILURES: ' + failures);
  console.log(failures === 0 ? 'SMOKE GREEN' : 'SMOKE FAILURES: ' + failures);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('SMOKE HARNESS ERROR', e); process.exit(2); });
