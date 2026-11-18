// npm test — tests/*.test.mjs 를 차례로 돌려요. 게임을 작은 서버로 띄우고, 헤드리스 브라우저로 직접 플레이해요.
// 처음 한 번은 브라우저가 필요해요: npx playwright install chromium
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const only = process.argv[2];
const files = fs.readdirSync(here).filter(f => f.endsWith('.test.mjs') && (!only || f.includes(only))).sort();

const server = await serve(root);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let failed = 0;
for (const f of files) {
  const t0 = Date.now();
  const mod = await import(path.join(here, f));
  try {
    await mod.default({ browser, url: server.url });
    console.log(`✓ ${f}  (${((Date.now() - t0) / 1000).toFixed(1)}초)`);
  } catch (e) {
    failed++;
    console.log(`✗ ${f}\n   ${String(e && e.stack || e).split('\n').slice(0, 4).join('\n   ')}`);
  }
}
await browser.close(); server.close();
console.log(failed ? `\n${failed}개 실패` : `\n모두 통과 (${files.length}개)`);
process.exit(failed ? 1 : 0);
