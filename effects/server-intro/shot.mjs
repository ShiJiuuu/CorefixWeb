import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'shots');
const URL_BASE = 'file://' + path.join(DIR, 'index.html') + '?still=1';
const PORT = 9242;
const TIMES = process.argv.slice(2).map(Number);

mkdirSync(OUT, { recursive: true });

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new','--no-first-run',`--remote-debugging-port=${PORT}`,
  '--window-size=1920,1080','--hide-scrollbars','--force-device-scale-factor=1',
  `--user-data-dir=/tmp/cfshot-${PORT}`,
], { stdio:'ignore', detached:true });
chrome.unref();

for (let i=0;i<80;i++){ try{ await fetch(`http://127.0.0.1:${PORT}/json/version`); break;}catch{await new Promise(r=>setTimeout(r,200));} }

const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL_BASE)}`,{method:'PUT'})).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
let id = 0;
const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
await new Promise(r => ws.addEventListener('open', r, { once:true }));

const send = (method, params={}) => new Promise((res) => {
  const mid = ++id; pend.set(mid, res);
  ws.send(JSON.stringify({ id:mid, method, params }));
});

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width:1920, height:1080, deviceScaleFactor:1, mobile:false });
await send('Page.navigate', { url: URL_BASE });
await new Promise(res => { const h = e => { const m = JSON.parse(e.data); if (m.method === 'Page.loadEventFired') { ws.removeEventListener('message', h); res(); } }; ws.addEventListener('message', h); });
await new Promise(r => setTimeout(r, 900));

for (let i = 0; i < TIMES.length; i++){
  const t = TIMES[i];
  const r = await send('Runtime.evaluate', { expression: `window.__seek(${t})` });
  await new Promise(r2 => setTimeout(r2, 120));
  const shot = await send('Page.captureScreenshot', { format:'png' });
  writeFileSync(path.join(OUT, `t${t}.png`), Buffer.from(shot.result.data, 'base64'));
  console.log('saved t=' + t);
}

try{ await send('Browser.close'); }catch{}
ws.close();
try{ chrome.kill(); }catch{}
