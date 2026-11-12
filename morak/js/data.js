// 모락모락 — 재료·레시피·등장인물 데이터

export const ITEMS = {
  rice: { name: '쌀', price: 2 },
  egg: { name: '달걀', price: 2 },
  tofu: { name: '두부', price: 3, chop: true },
  doenjang: { name: '된장', price: 4 },
  pa: { name: '파', chop: true },
  mu: { name: '무', chop: true },
  gamja: { name: '감자', chop: true },
  mushroom: { name: '버섯', chop: true },
  namul: { name: '산나물', chop: true },
  clam: { name: '조개' },
  miyeok: { name: '미역' },
  fish: { name: '생선' },
  // 다른 고장에서 구하는 것
  cabbage: { name: '배추', chop: true },
  chili: { name: '고추' },
  sesame: { name: '참기름' },
  abalone: { name: '전복' },
  // 건조대·장독에서 가공한 것
  dried_mushroom: { name: '말린 표고' },
  mu_dried: { name: '무말랭이' },
  dried_fish: { name: '반건조 생선' },
};
export const SHOP_LIST = ['rice', 'egg', 'tofu', 'doenjang'];

// cooker: pan(팬) / pot(냄비) / cauldron(가마솥).  '_c' = 도마에서 손질한 재료
export const RECIPES = {
  egg_rice: { name: '달걀볶음밥', cooker: 'pan', ing: ['rice', 'egg', 'pa_c'], price: 10, from: '일곱 살의 내가 쓴 장', memo: '파기름을 먼저 낸다. 밥은 꾹꾹 누르지 말 것.' },
  doenjang_jjigae: { name: '된장찌개', cooker: 'pot', ing: ['doenjang', 'tofu_c', 'pa_c'], price: 14, from: '이장님이 맡아 둔 장', memo: '물질하고 온 사람 것은 간을 세게.' },
  radish_soup: { name: '맑은 뭇국', cooker: 'pot', ing: ['mu_c', 'pa_c'], price: 9, from: '이장님이 맡아 둔 장', memo: '속이 시끄러운 날엔 맑은 국.' },
  miyeok_guk: { name: '조개미역국', cooker: 'pot', ing: ['miyeok', 'clam'], price: 15, from: '금자 할머니가 맡아 둔 장', memo: '생일인 사람 그릇엔 조개를 하나 더.' },
  gamjajeon: { name: '감자전', cooker: 'pan', ing: ['gamja_c', 'egg'], price: 12, from: '소리가 맡아 둔 장 (뒷면에 그림)', memo: '가장자리는 태우듯이. 젖은 날엔 기름 냄새가 약이다.' },
  mushroom_rice: { name: '버섯솥밥', cooker: 'pot', ing: ['rice', 'mushroom_c'], price: 14, from: '도윤이 맡아 둔 장', memo: '누룽지까지가 한 그릇.' },
  namul_rice: { name: '산나물밥', cooker: 'pot', ing: ['rice', 'namul_c'], price: 13, from: '도윤이 맡아 둔 장', memo: '봄 산은 쓰다. 쓴맛이 입맛을 깨운다.' },
  grilled_fish: { name: '생선구이', cooker: 'pan', ing: ['fish', 'mu_c'], price: 18, from: '한 선장이 맡아 둔 장', memo: '뒤집는 건 딱 한 번.' },
  gukbap: { name: '모락국밥', cooker: 'cauldron', ing: ['rice', 'mu_c', 'mushroom_c', 'doenjang'], price: 25, from: '마을 사람들의 기억', memo: '무. 말아 낸 밥. 말린 버섯. 된장은 딱 한 숟갈. — 파는 넣지 않는다.' },
};
Object.assign(RECIPES, {
  baechujeon: { name: '배추전', cooker: 'pan', ing: ['cabbage_c', 'egg'], price: 14, from: '윗마을 농장 아주머니', memo: '줄기는 칼등으로 두드려 편다.' },
  spicy_fish: { name: '매운 생선조림', cooker: 'pot', ing: ['fish', 'mu_c', 'chili'], price: 24, from: '읍내 장터 반찬가게', memo: '무가 생선보다 맛있어야 한다.' },
  abalone_juk: { name: '전복죽', cooker: 'pot', ing: ['rice', 'abalone', 'sesame'], price: 32, from: '건넛섬 해녀의 집', memo: '쌀알이 퍼질 때까지 젓는 걸 멈추지 않는다.' },
});
export const TRAVEL_ORDER = ['baechujeon', 'spicy_fish', 'abalone_juk'];
export const RECIPE_ORDER = ['egg_rice', 'doenjang_jjigae', 'radish_soup', 'miyeok_guk', 'gamjajeon', 'mushroom_rice', 'namul_rice', 'grilled_fish', 'gukbap'];
export const COOKER_NAME = { pan: '팬', pot: '냄비', cauldron: '가마솥' };

export const MEMORIES = {
  mu: { who: '금자 할머니', text: '"무가 들었어. 바닷바람 맞혀 달큰해진 무."' },
  rice: { who: '소리', text: '"밥은 따로 주는 거 아니다. 말아서 줘야 식지 않는다."' },
  mushroom: { who: '도윤', text: '"해마다 가을이면 표고를 말리셨어요. 끓이지도 않을 국밥에 넣을 거라고."' },
  doenjang: { who: '이장님', text: '"된장은 딱 한 숟갈이다. 더 넣으면 정희가 안 먹는다."' },
};

export function itemName(id) {
  if (RECIPES[id]) return RECIPES[id].name;
  if (id.endsWith('_c')) return '손질한 ' + ITEMS[id.slice(0, -2)].name;
  return ITEMS[id] ? ITEMS[id].name : id;
}
export const baseOf = id => id.endsWith('_c') ? id.slice(0, -2) : id;

// 등장인물 생김새
export const LOOKS = {
  player: { hair: '#7a4b2e', shirt: '#f4f1e6', pants: '#51607a', apron: true, hat: 'band', hatCol: '#e25c5c', scarf: '#e25c5c' },
  ijang: { hair: '#b9b4ac', shirt: '#6fa8c9', pants: '#6b5a48', style: 'bald', hat: 'straw', hatCol: '#ecd08a', old: true, skin: '#eebf96' },
  geumja: { hair: '#d9d6d0', shirt: '#39424e', pants: '#39424e', hat: 'towel', hatCol: '#f7f3e6', old: true, skin: '#e2b089' },
  sori: { hair: '#4a3328', shirt: '#f2c94c', pants: '#e58d9c', style: 'pig', kid: true, overall: '#e58d9c' },
  doyun: { hair: '#3b2a25', shirt: '#b5553f', pants: '#4f5d4a', hat: 'beanie', hatCol: '#5a8a4b' },
  captain: { hair: '#e6e3dc', shirt: '#2f4670', pants: '#3a3f4a', hat: 'cap', hatCol: '#2f4670', beard: '#f1eee6', old: true, skin: '#dba983' },
  mom: { hair: '#4a3328', shirt: '#9a8fb5', pants: '#4a4a55', style: 'long' },
};
export const NPC_NAME = { ijang: '봉 이장', geumja: '금자 할머니', sori: '소리', doyun: '도윤', captain: '한 선장', mom: '엄마' };

// 지나가는 손님들
export const GUEST_LOOKS = [
  { hair: '#3b2a25', shirt: '#8fb9cf', pants: '#51607a' },
  { hair: '#6b4129', shirt: '#f2a03c', pants: '#6b5a48', style: 'long' },
  { hair: '#2b2b2b', shirt: '#7cc05a', pants: '#3a3f4a', hat: 'beanie', hatCol: '#e25c5c' },
  { hair: '#b9b4ac', shirt: '#b06a8a', pants: '#6b5a48', style: 'bun', old: true },
  { hair: '#c98a5c', shirt: '#f7a8b8', pants: '#51607a', style: 'long' },
  { hair: '#4a3328', shirt: '#e6e3dc', pants: '#2f4670', hat: 'straw', hatCol: '#d9b98a' },
  { hair: '#2b2b2b', shirt: '#5b9fc7', pants: '#4f5d4a', style: 'pig' },
];
export const GUEST_LINES = ['잘 먹을게요!', '냄새부터 좋네요.', '이 집 다시 열었다면서요?', '따뜻하다…', '고향 맛이네요.', '아, 이 맛이야.', '김이 모락모락 나네요.', '또 올게요!'];
export const NPC_GUEST_LINES = {
  ijang: ['허허, 이 맛에 산다!', '누님 솜씨 그대로네!'],
  geumja: ['간 좀 세게 했지?', '물질하고 나면 이게 보약이여.'],
  sori: ['잘 먹겠습니다아!', '우와, 김 난다!'],
  doyun: ['…잘 먹겠습니다.', '따뜻한 밥은 오랜만이네요.'],
  captain: ['…음.', '밥 생각 없었는데.'],
};

/* ───────── 경영·성장 ───────── */
export const VALUE = { rice: 2, egg: 2, tofu: 3, doenjang: 4, pa: 2, mu: 2, gamja: 2, mushroom: 3, namul: 3, clam: 3, miyeok: 3, fish: 6, cabbage: 3, chili: 3, sesame: 5, abalone: 9, dried_mushroom: 8, mu_dried: 6, dried_fish: 13 };

// 나의 손맛: 주인공의 특성
export const TRAITS = {
  fire: { name: '불맛 장인', desc: '팬 요리 값 +25%, 팬 조리가 빨라요' },
  soup: { name: '국물 장인', desc: '냄비·가마솥 요리 값 +25%, 끓이는 시간이 줄어요' },
  quick: { name: '날랜 손', desc: '손질이 순식간에 끝나고 발걸음이 빨라요' },
  warm: { name: '살가운 주인', desc: '손님이 더 오래 기다려 주고, 팁이 두 배' },
  thrift: { name: '알뜰한 살림꾼', desc: '수확·채집 +1, 만물상 값 1닢 할인' },
};

// 평판이 쌓이면 별이 올라요 (1~5성)
export const RANKS = [0, 8, 25, 60, 120];
export const rankOf = rep => RANKS.filter(t => rep >= t).length;

// 도윤의 목공소에서 맡기는 일
export const UPGRADES = [
  { id: 'knife', name: '잘 드는 칼', desc: '손질 시간이 절반으로', cost: 60, rank: 1 },
  { id: 'garden', name: '텃밭 거름', desc: '텃밭 수확 +1', cost: 70, rank: 1 },
  { id: 'table4', name: '네 번째 식탁', desc: '한 번에 받는 손님이 늘어요', cost: 90, rank: 2 },
  { id: 'pan2', name: '팬 하나 더', desc: '가운데 조리대 자리에 화구를 놓아요', cost: 120, rank: 2 },
  { id: 'pot2', name: '냄비 하나 더', desc: '오른쪽 조리대 자리에 화구를 놓아요', cost: 120, rank: 2 },
  { id: 'basket', name: '큰 바구니', desc: '숲·바닷가 채집 +1', cost: 90, rank: 2 },
  { id: 'stove', name: '센 화구', desc: '모든 조리 시간 30% 단축', cost: 160, rank: 3 },
  { id: 'table5', name: '다섯 번째 식탁', desc: '가게가 꽉 차요', cost: 180, rank: 3, need: 'table4' },
  { id: 'rack', name: '건조대 늘리기', desc: '가공 자리 2칸 → 4칸', cost: 100, rank: 2 },
];

// 도전 과제 (달성하면 바로 보상)
export const CHALLENGES = [
  { id: 'first', name: '첫 빈 그릇', desc: '손님 1명 대접', reward: 10, test: G => G.stats.served >= 1 },
  { id: 'mine', name: '내 이름을 건 한 그릇', desc: '나만의 요리를 5그릇 대접', reward: 50, test: G => (G.stats.custom || 0) >= 5 },
  { id: 'regular', name: '단골이 생기다', desc: '누적 30그릇 대접', reward: 40, test: G => G.stats.served >= 30 },
  { id: 'perfect', name: '한 분도 놓치지 않기', desc: '5명 이상 온 날, 돌아간 손님 없이 영업 끝', reward: 40, test: G => (G.stats.perfect || 0) >= 1 },
  { id: 'busy', name: '북적북적', desc: '하루에 8그릇 대접', reward: 60, test: G => (G.stats.best || 0) >= 8 },
  { id: 'rich', name: '든든한 금고', desc: '누적 500닢 벌기', reward: 80, test: G => G.stats.earned >= 500 },
  { id: 'pages', name: '수첩을 다시 채우다', desc: '할머니의 레시피 9장 모두 모으기', reward: 100, test: G => RECIPE_ORDER.every(r => G.recipes.includes(r)) },
  { id: 'helper', name: '마을의 손', desc: '게시판 의뢰 10건 해결', reward: 60, test: G => (G.stats.req || 0) >= 10 },
  { id: 'debtfree', name: '빚 없는 아침', desc: '대출을 받았다가 모두 갚기', reward: 50, test: G => !!G.flags.borrowed && G.bank.loan === 0 },
  { id: 'reader', name: '얼굴만 봐도 안다', desc: '사정 있는 손님에게 딱 맞는 음식을 10번', reward: 60, test: G => (G.stats.fit || 0) >= 10 },
  { id: 'five', name: '다섯 별 식당', desc: '모락식당을 5성으로', reward: 200, test: G => rankOf(G.rep) >= 5 },
];

/* ───────── 가공 · 다른 고장 · 옷 · 오늘의 일 · 의뢰 ───────── */
// 건조대·장독: 재료를 넣어 두면 하룻밤 뒤에 완성
export const CRAFTS = [
  { id: 'dried_mushroom', from: { mushroom: 2 }, how: '볕에 말린다' },
  { id: 'mu_dried', from: { mu: 2 }, how: '썰어서 널어 둔다' },
  { id: 'dried_fish', from: { fish: 1 }, how: '바닷바람에 건다' },
];

// 버스를 타고 다녀오는 곳
export const PLACES = {
  farm: { name: '윗마을 농장', fare: 6, rank: 1, find: 'cabbage',
    arrive: '버스로 이십 분. 고갯마루를 넘자 배추밭이 끝도 없이 펼쳐졌다.\n"모락식당? 아이고, 순례 형님네!"',
    goods: [['cabbage', 3], ['chili', 3], ['egg', 1]], recipe: ['baechujeon', 40] },
  town: { name: '읍내 장터', fare: 10, rank: 2, find: 'sesame',
    arrive: '읍내 오일장. 기름집 깨 볶는 냄새가 골목을 채운다.\n없는 게 없고, 사람도 많다.',
    goods: [['sesame', 6], ['chili', 3], ['tofu', 2], ['doenjang', 3]], recipe: ['spicy_fish', 60] },
  island: { name: '건넛섬', fare: 18, rank: 3, find: 'abalone',
    arrive: '배로 사십 분. 해녀들의 숨비소리가 먼저 마중을 나왔다.\n"금자 언니 아는 사람이면 우리 사람이지."',
    goods: [['abalone', 10], ['miyeok', 2], ['clam', 2]], recipe: ['abalone_juk', 90] },
};

// 옷장: free는 처음부터, 나머지는 각 고장에서 구해요
export const HAIR_COLORS = ['#7a4b2e', '#3b2a25', '#c98a5c', '#e6c15a', '#b06a8a', '#d9d6d0'];
export const HAIR_STYLES = [['short', '짧은 머리'], ['long', '긴 머리'], ['bun', '올림머리'], ['pig', '양갈래']];
export const WEAR = [
  { id: 'shirt_white', kind: 'shirt', col: '#f4f1e6', name: '흰 조리복', free: true },
  { id: 'shirt_sky', kind: 'shirt', col: '#8fb9cf', name: '하늘색 셔츠', free: true },
  { id: 'shirt_mint', kind: 'shirt', col: '#9fd27a', name: '풀색 셔츠', free: true },
  { id: 'shirt_work', fx: '채집할 때 기운이 덜 들어요', kind: 'shirt', col: '#5a8a4b', name: '농장 작업복', cost: 30, at: 'farm' },
  { id: 'shirt_red', fx: '빠른 대접 팁 +1', kind: 'shirt', col: '#c4553f', name: '장터 빨간 셔츠', cost: 35, at: 'town' },
  { id: 'shirt_plum', fx: '손님이 조금 더 기다려 줘요', kind: 'shirt', col: '#9a5fa8', name: '양장점 자주 셔츠', cost: 45, at: 'town' },
  { id: 'shirt_navy', fx: '낚시 하루 2번 더', kind: 'shirt', col: '#2f4670', name: '섬 남색 셔츠', cost: 40, at: 'island' },
  { id: 'hat_none', kind: 'hat', hat: 'none', col: '#d8caa9', name: '모자 없음', free: true },
  { id: 'hat_band', kind: 'hat', hat: 'band', col: '#e25c5c', name: '빨간 머리띠', free: true },
  { id: 'hat_straw', fx: '텃밭 수확 +1', kind: 'hat', hat: 'straw', col: '#ecd08a', name: '밀짚모자', cost: 30, at: 'farm' },
  { id: 'hat_beanie', fx: '몸이 따뜻해 기운이 덜 빠져요', kind: 'hat', hat: 'beanie', col: '#5b9fc7', name: '털모자', cost: 40, at: 'town' },
  { id: 'hat_towel', fx: '조개·미역 채집 +1', kind: 'hat', hat: 'towel', col: '#f7f3e6', name: '해녀 수건', cost: 30, at: 'island' },
  { id: 'hat_cap', fx: '입질을 오래 기다려 줘요', kind: 'hat', hat: 'cap', col: '#2f4670', name: '선장 모자', cost: 60, at: 'island' },
];

// 오늘의 일: 아침마다 가끔 생기는 변수
export const EVENTS = {
  rain: { name: '비 오는 날', text: '빗소리에 눈을 떴다.\n손님은 줄겠지만, 이런 날엔 기름 냄새가 약이다. (손님 -2, 팬 요리 값 +30%)' },
  market: { name: '장날', text: '오늘은 솥골 장날.\n길에 사람이 많다. (손님 +3)' },
  tour: { name: '관광버스', text: '정류장에 낯선 버스가 섰다.\n단체 손님이 온다는 소문이다. (손님 +4)' },
  catch: { name: '풍어', text: '선장이 그물을 털며 웃는다.\n오늘은 고기가 문다. (낚시 10번까지)' },
  harvest: { name: '풍작', text: '밤사이 단비가 지나갔다.\n텃밭이 유난히 실하다. (텃밭 수확 +1)' },
  pricey: { name: '물가 오름', text: '만물상 앞에 한숨 소리.\n읍내 도매값이 올랐단다. (만물상 값 +1)' },
  sale: { name: '떨이 장사', text: '이장님이 창고를 정리한다.\n오늘은 싸게 판단다. (만물상 값 -1)' },
  gourmet: { name: '미식가 방문', text: '읍내 신문에 맛집 글을 쓰는 사람이\n오늘 솥골에 온다는 소문이다. (첫 손님이 값 3배, 빨리 내면 평판 +5)' },
};

export const REQ_PEOPLE = ['민박집 할머니', '우체부 아저씨', '방앗간 아주머니', '분교 선생님', '등대지기', '약초꾼 할아버지', '소리', '금자 할머니', '도윤'];
export const REQ_ITEMS = ['pa', 'mu', 'gamja', 'mushroom', 'namul', 'clam', 'miyeok'];
export const WALKER_LINES = ['오늘 저녁은 모락식당 갈까.', '바람이 좋네.', '텃밭 파가 실하네.', '게시판에 뭐 붙었나?', '버스 올 시간인데.', '어디서 밥 냄새가…', '순례 할매 손주라며?', '날이 참 좋다.'];

// 같이 밥을 먹을 때 하는 말
export const SHARE_LINES = {
  ijang: '허허, 혼자 먹는 밥은 밥이 아니라 끼니지. 같이 먹어야 밥이다!',
  geumja: '언니가 살아 있을 땐 저녁마다 이렇게 마주 앉았는데. …한 숟갈 더 떠라.',
  sori: '같이 먹으니까 더 맛있다! 내일도 같이 먹어요, 네?',
  doyun: '…누구랑 마주 앉아 먹는 게 얼마 만인지 모르겠네요. 고맙습니다.',
  captain: '…앉아라. 배 위에서도 밥은 둘러앉아 먹는 법이다.',
};
export const NPC_DONE = { ijang: 'sleep1', geumja: 'q_geumja', sori: 'q_sori', doyun: 'q_doyun', captain: 'q_captain' };

/* ───────── 요리의 성격과 손님의 사정 ───────── */
export const TAG_NAME = { soup: '따뜻한 국물', light: '속 편한', hearty: '든든한', crispy: '고소한 기름맛', sea: '바다 맛', spicy: '매운맛' };
const TAGS = {
  egg_rice: ['hearty', 'crispy'], doenjang_jjigae: ['soup', 'hearty'], radish_soup: ['soup', 'light'], miyeok_guk: ['soup', 'sea', 'light'],
  gamjajeon: ['crispy'], mushroom_rice: ['hearty'], namul_rice: ['light'], grilled_fish: ['sea', 'hearty'], gukbap: ['soup', 'hearty'],
  baechujeon: ['crispy', 'light'], spicy_fish: ['spicy', 'sea'], abalone_juk: ['light', 'sea'],
};
for (const id in TAGS) RECIPES[id].tags = TAGS[id];
// 나만의 요리는 도구와 재료로 성격이 정해져요
export function tagsFor(cooker, ing) {
  const b = ing.map(baseOf), t = new Set([cooker === 'pan' ? 'crispy' : 'soup']);
  if (b.includes('rice')) t.add('hearty');
  if (b.includes('chili')) t.add('spicy');
  if (b.some(x => ['clam', 'miyeok', 'fish', 'abalone', 'dried_fish'].includes(x))) t.add('sea');
  if (b.some(x => ['tofu', 'mu', 'namul', 'cabbage', 'mu_dried'].includes(x)) && !b.includes('chili')) t.add('light');
  return [...t];
}
// 요리 이름 대신 사정을 말하는 손님
export const MOODS = [
  { tag: 'soup', line: '감기 기운이 있어서요… 뭐가 좋을까요.', ok: '아… 몸이 풀리네요. 딱 이게 필요했어요.' },
  { tag: 'soup', line: '오늘 좀 울적해서요. 알아서 주세요.', ok: '…따뜻하다. 좀 살 것 같아요.' },
  { tag: 'light', line: '속이 영 안 좋아요. 부담 없는 걸로요.', ok: '속이 편안해지네요. 고마워요.' },
  { tag: 'light', line: '어제 과음을 해서… 살려 주세요.', ok: '하아, 살았다. 이 집 단골 할게요.' },
  { tag: 'hearty', line: '종일 굶었어요. 뭐든 든든한 걸로!', ok: '이제야 사람 됐네요. 배가 든든해요!' },
  { tag: 'hearty', line: '오후에 밭일이 남아서요. 힘나는 걸로 주세요.', ok: '이거면 저녁까지 거뜬하겠어요.' },
  { tag: 'crispy', line: '기름 냄새가 당기는 날이네요.', ok: '바삭한 소리부터 맛있네요. 이거지!' },
  { tag: 'sea', line: '바다 보러 왔는데 바다 맛을 못 봤어요.', ok: '아, 이게 솥골 바다 맛이군요.' },
  { tag: 'sea', line: '고향이 섬이에요. 그 맛이 그리워서요.', ok: '…어머니 생각이 나네요. 잘 먹었습니다.' },
  { tag: 'spicy', line: '정신이 번쩍 들게 매운 거 없을까요?', ok: '후아, 땀 난다! 속이 뻥 뚫리네요.' },
];
export const MOOD_MISS = ['…네, 잘 먹을게요.', '음, 이것도 괜찮네요.', '아… 네. 감사합니다.'];

// 같이 밥을 먹은 횟수가 쌓이면 들려주는 이야기 (2·4·6번째)
export const BOND_STORIES = {
  ijang: [
    '누님이 처음 이 식당 열던 날, 손님은 나 하나였다. 국밥 한 그릇에 깍두기를 세 번 더 줬지. 그날부터 삼십 년이야.',
    "정희 태워다 준 날, 돌아와서 누님 얼굴을 못 봤어. 근데 누님이 먼저 그러더라. '덕수야, 밥은 먹었냐.'",
    "누님 가시기 전날에도 이렇게 같이 먹었다. '내 손주 오거든 굶기지 마라' 하시더라. …굶기긴, 내가 얻어먹고 있네. 허허.",
  ],
  geumja: [
    "물질 처음 배울 때 무서워서 울었어. 언니가 뭍에서 불 피워 놓고 기다렸지. '나오면 밥 있다.' 그 한마디에 들어갔어.",
    '내 영감이 바다에서 못 돌아온 날, 언니가 사흘을 내 집에 와서 밥을 했어. 말은 한마디도 안 하고. 그게 제일 고마웠다.',
    '네가 끓인 건 언니 것보다 싱거워. …근데 그게 네 맛이지. 언니 흉내 낼 것 없다.',
  ],
  sori: [
    '엄마는 서울 병원에서 일해요. 밤에도 일해서 전화가 잘 안 돼요. 그래서 저녁은 맨날 할머니 식당에서 먹었어요.',
    "할머니가 그랬어요. '소리야, 밥 먹을 때 옆에 사람이 있으면 그게 식구다.' 그럼 우리도 식구예요?",
    '나 커서 요리사 될 거예요. 엄마 퇴근하면 밥해 줄 거예요. 달걀볶음밥부터 가르쳐 줘요!',
  ],
  doyun: [
    '서울에서 가구 회사에 다녔어요. 삼 년 동안 책상 다리만 그렸죠. 어느 날 손이 떨려서 선을 못 긋겠더라고요.',
    "여기 와서 처음 만든 게 그 식당 의자예요. 할머니가 앉아 보더니 '삐걱거리네' 하고는, 십 년을 그 의자만 쓰셨어요.",
    '당신도 도망쳐 온 거죠. …괜찮아요. 도망친 데서 밥 짓고 사는 사람, 여기 하나 더 있으니까.',
  ],
  captain: [
    '…순례하고는 국민학교 동창이다. 도시락을 못 싸 온 날은 그 애가 제 밥을 반 덜어 줬지.',
    '네 어머니가 떠난 뒤로, 나는 매일 막배로 들어왔다. 순례를 벤치에 혼자 두기 싫어서. 말은 안 했다. 그냥 옆에 앉았지.',
    '…네 할머니한테 못 한 말이 있다. 밥 잘 먹었다고. 육십 년 치를. 네가 대신 들어라. 잘 먹었다.',
  ],
};
