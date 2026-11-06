import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const TARGET = 'file://' + path.join(DIR, 'index.html') + '?still=1';
const PORT = 9241;

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new','--no-first-run',`--remote-debugging-port=${PORT}`,
  '--window-size=1920,1080','--hide-scrollbars','--force-device-scale-factor=1',
  `--user-data-dir=/tmp/cfdbg-${PORT}`,
], { stdio:'ignore', detached:true });
chrome.unref();

for (let i=0;i<80;i++){ try{ await fetch(`http://127.0.0.1:${PORT}/json/version`); break;}catch{await new Promise(r=>setTimeout(r,200));} }

const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(TARGET)}`,{method:'PUT'})).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
let id = 0;
const pend = new Map();
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.consoleAPICalled') console.log('CONSOLE', m.params.type, JSON.stringify(m.params.args.map(a=>a.value||a.description)));
  if (m.method === 'Runtime.exceptionThrown') console.log('EXCEPTION', JSON.stringify(m.params.exceptionDetails));
  if (m.method === 'Log.entryAdded') console.log('LOG', m.params.entry.level, m.params.entry.text);
};
await new Promise(r => ws.addEventListener('open', r, { once:true }));

const send = (method, params={}) => new Promise(res => {
  const mid = ++id; pend.set(mid, res);
  ws.send(JSON.stringify({ id:mid, method, params }));
});

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
await send('Page.navigate', { url: TARGET });
await new Promise(r => setTimeout(r, 2500));

const probe = await send('Runtime.evaluate', { expression: `({ready: !!window.__ready, seek: typeof window.__seek, n: (()=>{try{return 1}catch(e){return 0}})()})`, returnByValue: true });
console.log('PROBE', JSON.stringify(probe.result));

const err = await send('Runtime.evaluate', { expression: `(()=>{try{ window.__seek(4.6); return 'ok' }catch(e){ return String(e && e.stack || e) }})()`, returnByValue: true });
console.log('SEEK', JSON.stringify(err.result));

await send('Browser.close').catch(()=>{});
ws.close();
try{ chrome.kill(); }catch{}
