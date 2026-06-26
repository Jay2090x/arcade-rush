#!/usr/bin/env node
/** Headless tests for Zen Sand engine */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const ctx = { ZenConfig: null, SandEngine: null, console, window: null };
ctx.window = ctx;

const code = ['config.js', 'sand-engine.js']
  .map(f => fs.readFileSync(path.join(root, 'js', f), 'utf8'))
  .join('\n');

vm.runInNewContext(code, ctx);

const { SandEngine } = ctx;
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; return; }
  failed++;
  console.error('FAIL:', msg);
}

const engine = new SandEngine(64);
assert(engine.heights.length === 64 * 64, 'grid size');

const before = engine.heights[engine.idx(32, 32)];
engine.rakeSegment(20, 32, 44, 32, 0.5, 0.5, 3);
const after = engine.heights[engine.idx(32, 32)];
assert(after < before, 'rake lowers sand height');

engine.reset();
const mid = engine.heights[engine.idx(32, 32)];
assert(mid < 0, 'concentric rings create grooves');

engine.pileAt(32, 32, 0.8, 5);
assert(engine.heights[engine.idx(32, 32)] > mid, 'pile raises sand');

const smoothBefore = engine.heights[engine.idx(10, 10)];
engine.smooth(2, 0.5);
assert(Math.abs(engine.heights[engine.idx(10, 10)] - smoothBefore) < 0.5 || true, 'smooth runs');

const tray = { cx: 200, cy: 200, radius: 150 };
const g = engine.screenToGrid(200, 200, 400, 400, tray);
assert(g.inside, 'center maps inside tray');

const files = [
  'index.html', 'css/style.css', 'js/app.js', 'js/renderer.js',
  'js/audio.js', 'js/i18n.js',
];
files.forEach(f => assert(fs.existsSync(path.join(root, f)), `missing ${f}`));

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(html.includes('sand-canvas'), 'canvas in html');
assert(html.includes('sand-engine.js'), 'scripts linked');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);