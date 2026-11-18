// 연재 목록. 새 화를 넣으려면
//   1) _template.js 를 복사해 epN-나라.js 를 만들고
//   2) 아래 EPISODES 에 한 줄 추가하면 돼요.
// 한 해(28일)에 네 화씩, 봄·여름·가을·겨울 순서로 손님이 와요. 다섯 번째 화부터는 두 번째 해에 와요.
import { ITEMS, RECIPES, VALUE, COOKER_NAME } from '../data.js';
import { REAL, DEX_MORE, DEX_ORDER, VISITORS, WORLD, HINTS, DEX_GROUPS } from '../homestay.js';
import { registerIcon } from '../art.js';
import ep1 from './ep1-italy.js';
import ep2 from './ep2-thai.js';
import ep3 from './ep3-india.js';
import ep4 from './ep4-mexico.js';

export const EPISODES = [ep1, ep2, ep3, ep4];

const problems = [];
const baseOf = id => id.endsWith('_c') ? id.slice(0, -2) : id;
const sub = (a, b) => { const pool = [...b]; return a.every(x => { const i = pool.indexOf(x); if (i < 0) return false; pool.splice(i, 1); return true; }); };

function install(ep) {
  const v = ep.visitor, w = ep.world;
  if (VISITORS.some(x => x.id === v.id)) problems.push(`${ep.id}: 별손님 id '${v.id}'가 겹쳐요`);
  VISITORS.push({ ...v, world: w.id, episode: ep.id, title: ep.title });
  const shop = [];
  for (const it of ep.items) {
    if (typeof it === 'string') { if (!ITEMS[it]) problems.push(`${ep.id}: 재료 '${it}'가 앞 화에 없어요`); shop.push(it); continue; }
    ITEMS[it.id] = { name: it.name, price: it.price, ...(it.chop ? { chop: true } : {}) };
    VALUE[it.id] = it.value ?? it.price;
    registerIcon(it.id, it.icon, it.color);
    shop.push(it.id);
  }
  WORLD[w.id] = { name: w.name, visitor: v.id, items: shop, dishes: ep.dishes.map(d => d.id), tell: w.tell };
  for (const d of ep.dishes) {
    for (const i of d.ing) if (!ITEMS[baseOf(i)]) problems.push(`${ep.id}/${d.id}: 재료 '${i}'를 몰라요`);
    if (!COOKER_NAME[d.cooker]) problems.push(`${ep.id}/${d.id}: 조리 도구 '${d.cooker}'를 몰라요`);
    for (const k in RECIPES) {
      const r = RECIPES[k];
      if (r.cooker === d.cooker && (sub(r.ing, d.ing) || sub(d.ing, r.ing))) problems.push(`${ep.id}/${d.id}: 「${r.name}」와 재료가 겹쳐 구분이 안 돼요`);
    }
    RECIPES[d.id] = { name: d.name, cooker: d.cooker, ing: d.ing, price: d.price, memo: d.memo, tags: d.tags, world: w.id, from: `${v.name}의 지구 여행 수첩 · ${w.name}` };
    REAL[d.id] = d.real;
    DEX_MORE[d.id] = { tip: d.tip, vary: d.vary };
    HINTS[d.id] = d.hint;
    DEX_ORDER.push(d.id);
    registerIcon(d.id, d.icon, d.color);
  }
  DEX_GROUPS.push([w.name, ep.dishes.map(d => d.id), w.id]);
}
EPISODES.forEach(install);
if (problems.length) console.warn('[모락모락 연재] 확인이 필요해요:\n' + problems.join('\n'));
export const EPISODE_PROBLEMS = problems;
