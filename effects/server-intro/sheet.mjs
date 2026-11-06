const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const TIMES = [0.8, 1.3, 2.5, 3.2, 3.9, 4.5, 5.1, 5.8, 6.5, 7.2, 7.9, 8.6, 9.4, 10.4, 11.7, 13.4, 14.7];
const COLS = 6, ROWS = Math.ceil(TIMES.length / COLS);
const CELL_W = 480, CELL_H = 270, GUTTER = 6, MARGIN = 20;
const SHEET_W = MARGIN*2 + COLS*CELL_W + (COLS-1)*GUTTER;
const SHEET_H = MARGIN*2 + ROWS*CELL_H + (ROWS-1)*GUTTER;

(async () => {
  const canvas = createCanvas(SHEET_W, SHEET_H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,SHEET_W,SHEET_H);
  for (let i = 0; i < TIMES.length; i++){
    const col = i % COLS, row = Math.floor(i / COLS);
    const x = MARGIN + col*(CELL_W+GUTTER);
    const y = MARGIN + row*(CELL_H+GUTTER);
    const img = await loadImage(path.join(DIR, 'frames', `f${String(i).padStart(2,'0')}.png`));
    ctx.drawImage(img, x, y, CELL_W, CELL_H);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`t=${TIMES[i]}s`, x+8, y+22);
  }
  fs.writeFileSync(path.join(DIR, 'contact-sheet.png'), canvas.toBuffer('image/png'));
  console.log('wrote', path.join(DIR, 'contact-sheet.png'), SHEET_W, SHEET_H);
})();
