import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const TARGET = 'file://' + path.join(DIR, 'index.html') + '?still=1';
const PORT = 9243;

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new','--no-first-run',`--remote-debugging-port=${PORT}`,
  '--window-size=1920,1080','--hide-scrollbars','--force-device-scale-factor=1',
  `--user-data-dir=/tmp/cfprobe-${PORT}`,
], { stdio:'ignore', detached:true });
chrome.unref();

for (let i=0;i<80;i++){ try{ await fetch(`http://127.0.0.1:${PORT}/json/version`); break;}catch{await new Promise(r=>setTimeout(r,200));} }
const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(TARGET)}`,{method:'PUT'})).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
await new Promise(r => ws.addEventListener('open', r, { once:true }));
const send = (method, params={}) => new Promise(res => { const mid = ++id; pend.set(mid, res); ws.send(JSON.stringify({ id:mid, method, params })); });

await send('Runtime.enable');
await send('Page.enable');
await send('Page.navigate', { url: TARGET });
await new Promise(r => setTimeout(r, 2200));

const t = Number(process.argv[2] || 4.7);
const r = await send('Runtime.evaluate', { expression: `JSON.stringify(window.__dbg(${t}))`, returnByValue: true });
const d = JSON.parse(r.result.result.value);
console.log('n', d.n);
console.log('mods', JSON.stringify(d.mods));
console.log('m0', JSON.stringify(d.m0));
console.log('cam', JSON.stringify(d.cam));

// project m0 corners
const cam = d.cam;
let fx = cam.tgt[0]-cam.eye[0], fy = cam.tgt[1]-cam.eye[1], fz = cam.tgt[2]-cam.eye[2];
const fl = Math.hypot(fx,fy,fz); fx/=fl; fy/=fl; fz/=fl;
let rx = -fz, ry = 0, rz = fx; const rl = Math.hypot(rx,ry,rz); rx/=rl; ry/=rl; rz/=rl;
const ux = ry*fz - rz*fy, uy = rz*fx - rx*fz, uz = rx*fy - ry*fx;
const proj = (p) => {
  const dx=p[0]-cam.eye[0], dy=p[1]-cam.eye[1], dz=p[2]-cam.eye[2];
  const zc = dx*fx+dy*fy+dz*fz;
  const xc = dx*rx+dy*ry+dz*rz;
  const yc = dx*ux+dy*uy+dz*uz;
  return [cam.cx + cam.f*xc/zc, cam.cy - cam.f*yc/zc, zc];
};
const m0 = d.m0;
for (const x of [m0.minX, m0.maxX])
  for (const y of [m0.minY, m0.maxY])
    for (const z of [m0.minZ, m0.maxZ])
      console.log('corner', [x,y,z].map(v=>v.toFixed(2)).join(','), '->', proj([x,y,z]).map(v=>v.toFixed(0)).join(','));
console.log('target ->', proj(cam.tgt).map(v=>v.toFixed(1)).join(','));

await send('Browser.close').catch(()=>{});
ws.close();
try{ chrome.kill(); }catch{}
