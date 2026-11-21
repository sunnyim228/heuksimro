// 새 화 만들기 틀. 이 파일을 복사해 epN-나라.js 로 이름을 바꾸고, index.js 의 EPISODES 에 추가하세요.
// 그림(icon)은 12×12칸에 찍어요. R(g, 색, x, y, 너비, 높이), ell(g, 색, 중심x, 중심y, 반지름x, 반지름y),
// plate(g)는 접시, bowl(g, 그릇색, 국물색, [[x, y, 색, 너비]...])는 국그릇을 그려요.
// 조리 도구(cooker): 'pan' 팬 / 'pot' 냄비.  재료 뒤에 _c 를 붙이면 '도마에서 손질한' 재료예요 (예: 'pa_c').
// 요리의 성격(tags): soup 따뜻한 국물 · light 속 편한 · hearty 든든한 · crispy 고소한 기름맛 · sea 바다 맛 · spicy 매운맛
import { josa } from '../story.js';

export default {
  id: 'ep5',
  title: '○○와 □□',

  visitor: {
    id: 'newguest', name: '이름', from: '어떤 별',
    alien: { skin: '#ffd9b3', suit: '#4f7cac', ant: 'ball', antCol: '#7a5fa8' }, // ant: star | ball | long | curl
    hello: ['첫인사 한 줄', '왜 이 마을에 왔는지 한 줄'],
    ask: d => `「${d}」${josa(d, '은/는').slice(d.length)} 어떤 맛이에요?`, // 요리를 궁금해하는 말투
    react: ['맛본 뒤 반응 1', '맛본 뒤 반응 2'],
    idle: ['평소에 하는 말 1', '평소에 하는 말 2'],
    bye: '떠날 때 하는 말',
    bonds: [['♥1 속 이야기'], ['♥2 속 이야기', '나:주인공의 대답'], ['♥3 속 이야기'], ['♥4 속 이야기']],
    gift: '♥4로 배웅하면 받는 선물',
    clues: { arrive: '이 손님이 들은 소문', h2: '♥2에 털어놓는 단서', h4: '♥4에 털어놓는 단서' },
  },

  world: { id: 'country', name: '나라 이름', tell: '오는 길에 이 나라에서 본 것' },

  items: [
    { id: 'newitem', name: '새 재료', price: 3, value: 3, color: '#cc8844',
      icon: (g, { R }) => { R(g, '#cc8844', 3, 3, 6, 6); } },
    // 'tomato', 처럼 앞 화에서 나온 재료는 이름만 적어요
  ],

  dishes: [
    {
      id: 'newdish', name: '요리 이름', cooker: 'pot', ing: ['newitem', 'rice'], price: 20,
      tags: ['hearty'], memo: '수첩에 적히는 짧은 메모',
      hint: '별손님이 들려주는 단서 (냄비)',
      real: { q: '별손님의 엉뚱한 질문', ing: ['실제 재료 2인분'], steps: ['순서 1', '순서 2', '순서 3', '순서 4'] },
      tip: '★★에서 열리는 요령', vary: '★★★에서 열리는 변주',
      icon: (g, { plate, ell }) => { plate(g); ell(g, '#cc8844', 6, 7, 3, 2); },
    },
  ],
};
