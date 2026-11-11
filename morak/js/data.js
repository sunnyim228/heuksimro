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
