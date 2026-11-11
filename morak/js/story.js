// 모락모락 — 1부 「식은 솥」 대본
// A: 게임이 넘겨주는 연출 도구 (say, narr, letter, black, give, learn, remember, setStep, choose, shop ...)

export const GOALS = {
  intro: '',
  enter_shop: '주황 지붕의 모락식당에 들어가 보자',
  gather: '식당 옆 텃밭에서 파를 뽑고, 이장님(파란 지붕 만물상 앞)께 쌀과 달걀을 받자',
  first_cook: '식당 주방에서 달걀볶음밥 만들기 — 선반에서 재료 꺼내기 → 파는 도마에서 손질 → 팬에 쌀·달걀·파',
  first_open: '가게 안 문 옆 팻말을 눌러 첫 영업을 시작하자',
  sleep1: '2층 계단으로 올라가 하루를 마치자',
  q_geumja: '된장찌개를 끓여 바닷가의 금자 할머니께 가져가자 (두부·된장: 만물상 / 파: 텃밭)',
  q_sori: '조개미역국을 끓여 소리에게 가져가자 (조개·미역: 바닷가)',
  q_doyun: '감자전을 부쳐 숲속 오두막의 도윤에게 가져가자 (감자: 텃밭)',
  q_captain: '버섯솥밥을 지어 부두 끝의 한 선장께 가져가자 (버섯: 숲)',
  q_ijang2: '생선구이를 만들어 이장님께 가져가자 (생선: 부두 끝에서 낚시 / 무: 텃밭)',
  cauldron: '식당 주방의 가마솥을 열어 보자',
  gukbap: '가마솥에 모락국밥을 끓이자 — 쌀, 손질한 무, 손질한 버섯, 된장',
  epilogue: '1부 끝 — 식당은 계속 꾸려 갈 수 있어요',
};

const batchim = s => { const c = s.charCodeAt(s.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; };
export const josa = (s, pair) => { const [a, b] = pair.split('/'); return s + (batchim(s) ? a : b); };

export function makeStory(A) {
  const N = () => A.state().name;
  const call = () => josa(N(), '아/야');      // 하루야
  const subj = () => josa(N(), '이/');        // 하루 / 봄이 (구어체 호칭)

  const scenes = {
    /* ── 프롤로그 ── */
    async intro() {
      await A.black(true);
      await A.narr('도시의 주방에서 삼 년.\n내가 만든 요리는 한 접시도 손님상에 오르지 못했다.');
      await A.narr('설거지, 재료 손질, 다시 설거지.\n언제부턴가 뭘 먹어도 맛이 나지 않았다.');
      await A.narr('그러던 겨울 끝자락, 편지 한 통이 왔다.\n보낸 곳은 솥골. 어릴 적 여름마다 내려가던 할머니의 마을.');
      await A.letter(`${josa(N(), '이에게/에게')}.\n\n이 편지를 읽을 즈음이면 나는 없겠구나.\n모락식당은 네 앞으로 해 두었다.\n팔든 닫든 네 마음이다.\n\n다만 한 번은 내려와서,\n솥에 불을 한 번만 지펴 다오.\n식은 솥은 집이 아니란다.\n\n— 할미가`);
      await A.narr('사표를 냈다. 버스를 세 번 갈아탔다.\n창밖으로 바다가 보이기 시작했다.');
      await A.black(false);
      await A.say('ijang', `어이구, 왔구나! 네가 순례 누님네 손주 ${subj()}지? 딱 보니 알겠네. 눈매가 누님이랑 똑같아.`);
      await A.say('ijang', '나는 봉덕수. 솥골 이장이자 만물상 주인이자, 모락식당 삼십 년 단골이다. 허허.');
      await A.say('me', '안녕하세요. …식당은 아직 그대로인가요?');
      await A.say('ijang', '그대로지. 누님 가시고는 아무도 그 솥에 손을 못 댔어.');
      await A.say('ijang', '저기 주황 지붕 보이지? 가서 직접 봐라. 열쇠는 문틀 위에 있다. 삼십 년째 거기 있지.');
      A.setStep('enter_shop');
      A.tip('화면을 눌러 그곳으로 걸어가요. 사람이나 물건을 누르면 다가가서 말을 걸거나 집어요.\n(키보드: 방향키·WASD로 이동, 스페이스로 살펴보기)');
    },

    async enter_shop() {
      await A.narr('문을 열자 묵은 나무 냄새와, 아주 희미한 된장 냄새가 났다.');
      await A.narr('조리대 위에 낡은 수첩 한 권. 할머니의 레시피 수첩이다.');
      await A.narr('…그런데 얇다.\n뜯겨 나간 자국만 가득하고, 남은 건 딱 한 장.');
      await A.narr(`삐뚤빼뚤한 크레파스 글씨.\n「달걀볶음밥 — 일곱 살 ${N()} 씀」\n내가 할머니 옆에서 처음 배운 요리다.`);
      await A.letter('레시피를 찾고 있겠지.\n\n요리법은 종이에 적는 게 아니더라.\n먹는 사람 얼굴에 적히는 거지.\n그래서 내 것은 마을 사람들한테\n한 장씩 맡겨 두었다.\n\n한 그릇씩 대접하면서 돌려받아라.\n그러다 보면 너도 다시 밥맛이 돌 게다.\n\n네 것 한 장은 남겨 둔다.\n그건 네가 쓴 거니까.');
      await A.say('me', '…할머니는 다 알고 계셨네.');
      A.learn(['egg_rice']);
      await A.say('me', '좋아. 일단 달걀볶음밥부터. 파는 옆 텃밭에 있을 거고, 쌀이랑 달걀은… 이장님 만물상에 가 보자.');
      A.setStep('gather');
    },

    async first_taste() {
      await A.narr('김이 모락모락 오른다.\n한 숟갈 떠서 입에 넣었다.');
      await A.narr('…파기름 냄새. 고슬한 밥알. 살짝 눌은 달걀.');
      await A.say('me', '맛이… 난다.');
      await A.narr('삼 년 만이었다.\n무언가를 먹고 맛있다고 느낀 건.');
      await A.say('me', '이걸 누가 먹어 주면 좋겠다. …가게를 열어 보자.');
      A.setStep('first_open');
      A.tip('영업을 시작하면 손님이 와서 말풍선으로 주문해요.\n요리를 만들어 손님 식탁에 가져다주세요. 서두르지 않아도 괜찮아요.');
    },

    async first_close() {
      await A.narr('첫 영업이 끝났다.\n손은 어설펐고 메뉴는 볶음밥 하나뿐이었지만, 빈 그릇이 돌아왔다.');
      await A.narr('빈 그릇.\n도시에서는 한 번도 내 것이 아니었던 것.');
      A.setStep('sleep1');
    },

    async morning2() {
      await A.narr('똑똑똑.\n아침부터 누가 문을 두드린다.');
      await A.say('ijang', '어제 볶음밥 냄새가 마을 끝까지 났다! 누님 계실 때 생각나서 혼났네.');
      await A.say('ijang', "자, 이거 받아라. 누님이 나한테 맡긴 거다. '손주가 제 손으로 불을 지피거든 줘라' 하셨지.");
      A.learn(['doenjang_jjigae', 'radish_soup']);
      await A.say('ijang', '다른 장들은 금자 누님, 소리, 도윤이, 한 선장이 갖고 있을 거다. 그냥은 안 내놓을걸? 누님이 그러라고 시켰거든. 허허.');
      await A.say('ijang', '바닷가 금자 누님부터 가 봐라. 순례 누님 된장찌개 못 먹은 지 삼 년이라고 노래를 불러. 두부랑 된장은 우리 가게에 있다!');
      A.setStep('q_geumja');
    },

    /* ── 금자 ── */
    async geumja_give() {
      await A.narr('금자 할머니는 뚝배기를 받아 들고 한참 냄새만 맡았다.');
      await A.say('geumja', '…짜다.');
      await A.say('geumja', '언니 것도 짰어. 물질하고 나오면 몸이 얼어서, 짭짤해야 살 것 같았거든. 언니가 그걸 알고 내 건 늘 간을 세게 했지.');
      await A.say('geumja', '옛다. 미역국 장이다. 언니가 내 생일마다 끓여 주던 거. 조개랑 미역은 이 앞바다에 널렸으니 주워 가.');
      A.learn(['miyeok_guk']);
      await A.say('geumja', '그리고 하나 더. 너 그 국밥은 아냐? 모락국밥.');
      await A.say('me', '국밥이요? 수첩엔 그런 장이 없던데요.');
      await A.say('geumja', '없지. 언니가 삼십 년 전에 딱 끊었으니까. 왜 끊었는지는 나도 몰라.');
      await A.say('geumja', '근데 맛은 기억해. 무가 들었어. 바닷바람 맞혀 달큰해진 무. 썰어서 푹 끓인.');
      A.remember('mu');
      await A.say('geumja', '아 참, 오늘내일이 소리 생일이야. 서울 간 걔 엄마는 올해도 못 온다더라. 언니가 있었으면 미역국을 끓였을 텐데.');
      A.setStep('q_sori');
    },

    /* ── 소리 ── */
    async sori_give() {
      await A.say('sori', '어? 미역국…? 내 생일인 거 어떻게 알았어요?');
      await A.narr('소리는 그릇을 두 손으로 꼭 쥐고, 후후 불어 가며 먹었다.');
      await A.say('sori', "모락 할머니 거랑 똑같다. 조개가 '안녕' 하고 입 벌리고 있는 거.");
      await A.say('sori', '이거 줄게요. 할머니가 글씨 연습하라고 준 종이. 뒤에 내가 그림 그렸는데… 괜찮죠?');
      A.learn(['gamjajeon']);
      await A.say('sori', '그리고 비밀 하나 알려 줄까요?');
      await A.say('sori', "할머니는 국밥 얘기만 나오면 그랬어요. '밥은 따로 주는 거 아니다. 말아서 줘야 식지 않는다.' 나는 국밥 한 번도 못 먹어 봤지만.");
      A.remember('rice');
      await A.say('sori', "도윤 삼촌한테도 가 봐요. 숲속 오두막에 살아요. 비만 오면 '감자전… 감자전…' 하고 중얼거려요. 이상한 어른이야.");
      A.setStep('q_doyun');
    },

    /* ── 도윤 ── */
    async doyun_give() {
      await A.narr('도윤은 감자전을 한 입 베어 물고, 한동안 말이 없었다.');
      await A.say('doyun', '…가장자리가 바삭하네요. 할머니는 꼭 가장자리를 태우듯이 부치셨어요. 저는 그게 실수인 줄 알았는데.');
      await A.say('doyun', "이 마을에 처음 왔을 때, 저는 아무것도 없었어요. 비 오는 날 혼자 있는데 할머니가 이걸 부쳐 오셨죠. '젖은 날엔 기름 냄새가 약이다' 하시면서.");
      await A.say('doyun', '제가 맡은 장은 이거예요. 버섯솥밥이랑 산나물밥. 숲에서 나는 걸로 짓는 밥이죠.');
      A.learn(['mushroom_rice', 'namul_rice']);
      await A.say('me', '혹시… 모락국밥에 대해 아는 게 있어요?');
      await A.say('doyun', '먹어 본 적은 없어요. 근데 해마다 가을이면 할머니가 표고를 말리셨어요. 식당 메뉴엔 쓰지도 않으면서.');
      await A.say('doyun', "'이건 국밥에 들어갈 거다' 하고는, 봄이 되면 조용히 버리셨죠. 삼십 년을 그러셨대요. 끓이지도 않을 국밥 재료를, 해마다.");
      A.remember('mushroom');
      await A.say('doyun', '아, 그리고 한 선장님 좀 들여다봐 주세요. 할머니 가신 뒤로 끼니를 통 안 챙기세요. 솥밥이라면 드실 텐데.');
      A.setStep('q_captain');
    },

    /* ── 한 선장 ── */
    async captain_give() {
      await A.say('captain', '…밥 생각 없다고 했을 텐데.');
      await A.narr('선장은 그렇게 말하고도 솥밥을 바닥까지 긁어 먹었다.\n누룽지까지.');
      await A.say('captain', '…네 할머니는 매일 저녁 저기 벤치에 앉아 있었다. 막차가 들어올 시간에.');
      await A.say('captain', "삼십 년 전에 네 어머니가 그 버스를 타고 나갔지. 스무 살이었다. '국밥 냄새가 지긋지긋하다'고 소리를 지르고.");
      await A.say('captain', "순례는 그날로 국밥을 끊었다. '그 애가 돌아와서 먹겠다고 하면, 그때 다시 끓인다'고.");
      await A.say('me', '…엄마는 한 번도 그런 얘길 안 했어요.');
      await A.say('captain', '안 했겠지. 대신 여름마다 널 내려보냈잖냐. 그게 네 어머니 식의 안부였다. 순례도 알았어.');
      await A.say('captain', '받아라. 생선구이 장이다. 낚싯대도 하나 주마. 부두 끝 물결 이는 데에 드리우면 된다.');
      A.learn(['grilled_fish']);
      A.flag('rod');
      A.toast('낚싯대를 받았다! 부두 끝에서 낚시할 수 있어요.');
      await A.say('captain', '마지막 장은 덕수가 안다. 이장 말이다. 그놈이 그날 네 어머니를 정류장까지 태워다 줬거든.');
      await A.say('captain', '생선 한 마리 구워 가라. 그러면 입을 열 거다.');
      A.setStep('q_ijang2');
    },

    /* ── 이장, 두 번째 ── */
    async ijang_give() {
      await A.say('ijang', '생선구이…? 한 선장이 보냈구나. 그 영감, 다 말했지?');
      await A.say('ijang', '…그래. 내가 태워다 줬다. 정희가 울면서 부탁하는데 어쩌겠냐. 누님한테는 평생 미안했지.');
      await A.say('ijang', "근데 누님은 날 한 번도 탓하지 않았어. 오히려 국밥 얘기가 나오면 웃으면서 그랬지. '덕수야, 된장은 딱 한 숟갈이다. 더 넣으면 정희가 안 먹는다.'");
      A.remember('doenjang');
      await A.say('ijang', '마지막 장은 내가 가진 게 아니다. 가마솥 안에 있다.');
      await A.say('ijang', `누님이 뚜껑을 덮으면서 그랬거든. '이건 ${josa(N(), '이가/가')} 연다'고.`);
      A.setStep('cauldron');
    },

    async cauldron_open() {
      await A.narr('삼십 년 동안 닫혀 있던 가마솥 뚜껑을 들어 올렸다.');
      await A.narr('솥 안은 깨끗했다. 방금 닦은 것처럼.\n그리고 바닥에, 기름종이에 싼 종이 한 장.');
      await A.letter(`${call()}.\n\n여기까지 왔으면 다 들었겠지.\n네 엄마는 내 국밥이 싫어서 떠난 게 아니다.\n내가 그 애를 이 솥 앞에 묶어 두려 해서 떠난 거지.\n그걸 아는 데 십 년이 걸렸고,\n말할 용기를 내는 데 이십 년이 더 걸렸는데,\n그만 시간이 다 됐구나.\n\n국밥 만드는 법은 적지 않는다.\n금자, 소리, 도윤이, 덕수.\n그 사람들 입이 기억하는 맛이 맞는 맛이다.\n\n네가 끓여라.\n그 애는 내 국밥은 못 먹어도,\n네 국밥은 먹을 게다.\n\n— 할미가`);
      await A.narr('수첩의 마지막 장에, 네 사람의 기억을 옮겨 적었다.\n무. 말아 낸 밥. 말린 버섯. 된장 한 숟갈.');
      A.flag('cauldronOpen');
      A.learn(['gukbap']);
      A.setStep('gukbap');
    },

    async ending() {
      await A.narr('가마솥에서 김이 오른다. 삼십 년 만에.');
      await A.narr('모락모락.\n가게 이름이 왜 그건지, 이제 알겠다.');
      await A.narr('전화기를 들었다. 신호가 길게 갔다.');
      await A.say('mom', '…여보세요.');
      await A.say('me', '엄마. 나 솥골이야. 국밥 끓였어.');
      await A.say('mom', '……');
      await A.say('mom', '…파는 넣지 마라. 네 할머니는 내 건 꼭 파를 빼 줬어.');
      await A.black(true);
      await A.narr('다음 날 저녁, 막차가 들어왔다.\n벤치에는 이번엔 내가 앉아 있었다.');
      await A.narr('엄마는 국밥을 한 숟갈 뜨고, 오래 씹었다.');
      await A.say('mom', '간이… 딱 엄마 거네.');
      await A.narr('그날 모락식당의 솥은 밤늦도록 식지 않았다.');
      await A.narr('모락모락\n1부 「식은 솥」 — 끝\n\n여기까지 함께해 주셔서 고맙습니다.');
      await A.black(false);
      A.setStep('epilogue');
      A.toast('모락국밥이 메뉴에 올랐어요. 식당은 계속 꾸려 갈 수 있어요.');
    },
  };

  /* ── 마을 사람과의 대화 ── */
  const st = () => A.state().step;
  const after = id => ORDER.indexOf(st()) > ORDER.indexOf(id);
  const ORDER = Object.keys(GOALS);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const talk = {
    async ijang() {
      const s = st();
      if (s === 'enter_shop') return A.say('ijang', '주황 지붕이 모락식당이다. 문 앞에 서서 문을 누르면 돼. 어여 가 봐라.');
      if (s === 'gather' && !A.state().flags.gift) {
        await A.say('ijang', '오, 수첩 봤구나. 달걀볶음밥이라… 누님이 네 자랑을 얼마나 했는지 아냐. 일곱 살짜리가 팬을 잡았다고.');
        await A.say('ijang', '자, 개업 축하 선물이다. 돈은 됐고, 첫 볶음밥 냄새나 풍겨 다오.');
        A.give('rice', 5); A.give('egg', 5); A.flag('gift');
        return A.say('ijang', '파는 식당 옆 텃밭에서 뽑아라. 누님이 심어 둔 게 아직 자란다. 텃밭은 하룻밤 자고 나면 다시 자라 있을 게다.');
      }
      if (s === 'q_ijang2') {
        if (A.has('grilled_fish')) {
          if (await A.choose(['생선구이를 드린다', '아직은…']) === 0) { A.take('grilled_fish'); return scenes.ijang_give(); }
          return;
        }
      }
      const c = await A.choose(['물건을 산다', '이야기한다']);
      if (c === 0) return A.shop();
      if (s === 'q_ijang2') return A.say('ijang', '응? 한 선장이 뭐라고 했다고? …허허, 맨입으로는 말 못 한다. 그 영감이 잡은 생선 맛이 그립구먼.');
      if (s === 'cauldron' || s === 'gukbap') return A.say('ijang', '가마솥은 누님이 제일 아끼던 거다. 네가 불을 지피는 걸 보면 좋아하실 게다.');
      if (s === 'epilogue') return A.say('ijang', pick(['정희가 다녀갔다며? …잘됐다. 참 잘됐어.', '요즘 마을에 밥 냄새가 돌아서 살맛이 난다. 허허.', '국밥 한 그릇 하러 저녁에 들르마!']));
      return A.say('ijang', pick([
        '텃밭이랑 숲, 바닷가 것들은 하룻밤 자고 나면 다시 난다. 솥골이 그런 데야.',
        '돈이 떨어져도 걱정 마라. 쌀이랑 달걀은 외상으로 주마. 누님 손주한테 그 정도야.',
        '누님은 손님 얼굴만 봐도 그날 뭘 먹여야 할지 알았지. 너도 곧 그렇게 될 게다.',
      ]));
    },
    async geumja() {
      const s = st();
      if (s === 'q_geumja') {
        if (A.has('doenjang_jjigae')) {
          if (await A.choose(['된장찌개를 드린다', '아직은…']) === 0) { A.take('doenjang_jjigae'); return scenes.geumja_give(); }
          return;
        }
        await A.say('geumja', '뉘 집 아이냐? …아, 순례 언니 손주. 눈매 보니 맞네.');
        return A.say('geumja', '레시피? 있지. 근데 맨입으론 안 돼. 언니가 끓이던 된장찌개, 그거 한 뚝배기 가져와 봐. 맛이 비슷하면 내어 주마.');
      }
      if (!after('q_geumja')) return A.say('geumja', '물때가 좋구먼. …누구냐, 처음 보는 얼굴인데.');
      return A.say('geumja', pick([
        '조개는 모래밭에, 미역은 물가에 있어. 자고 나면 바다가 또 내어 준다.',
        '언니는 내가 물에서 나올 시간이면 꼭 불을 지펴 놨어. 그게 삼십 년이야.',
        '소리 그 녀석, 혼자 잘 노는 척하지만 외로운 애다. 가끔 밥 좀 먹여라.',
      ]));
    },
    async sori() {
      const s = st();
      if (s === 'q_sori') {
        if (A.has('miyeok_guk')) {
          if (await A.choose(['조개미역국을 준다', '아직은…']) === 0) { A.take('miyeok_guk'); return scenes.sori_give(); }
          return;
        }
        return A.say('sori', '…누구세요? 아, 모락 할머니네 집! 할머니가 그랬어요. 언젠가 손주가 온다고. 진짜 왔네.');
      }
      if (!after('q_sori')) return A.say('sori', '…모르는 사람이랑은 말하면 안 된댔어요.');
      return A.say('sori', pick([
        '감자전 종이 뒤에 그린 그림 봤어요? 그거 할머니랑 나예요.',
        '저 고양이 이름은 누룽지예요. 할머니가 지었어요.',
        '엄마는 추석에 온대요. 그때 미역국 또 끓여 줄 수 있어요?',
      ]));
    },
    async doyun() {
      const s = st();
      if (s === 'q_doyun') {
        if (A.has('gamjajeon')) {
          if (await A.choose(['감자전을 건넨다', '아직은…']) === 0) { A.take('gamjajeon'); return scenes.doyun_give(); }
          return;
        }
        return A.say('doyun', '…어, 안녕하세요. 식당 다시 여셨다면서요. 지붕 새는 데 있으면 말씀하세요. 그 집 지붕, 제가 고쳤거든요.');
      }
      if (!after('q_doyun')) return A.say('doyun', '…아, 네. 안녕하세요. (나무를 다듬느라 바빠 보인다)');
      return A.say('doyun', pick([
        '버섯은 그늘진 나무 밑에, 산나물은 볕 드는 풀밭에 나요. 밤사이 또 올라오고요.',
        '도시에서 도망치듯 왔는데, 여기선 아무도 왜 왔냐고 안 묻더라고요.',
        '식당 의자가 삐걱거리면 가져오세요. 그런 건 제가 잘해요.',
      ]));
    },
    async captain() {
      const s = st();
      if (s === 'q_captain') {
        if (A.has('mushroom_rice')) {
          if (await A.choose(['버섯솥밥을 드린다', '아직은…']) === 0) { A.take('mushroom_rice'); return scenes.captain_give(); }
          return;
        }
        await A.say('captain', '…');
        return A.say('captain', '순례네 손주라고. …닮았군. 밥 생각 없다. 가 봐라.');
      }
      if (!after('q_captain')) return A.say('captain', '…');
      return A.say('captain', pick([
        '찌가 쑥 들어갈 때 채라. 너무 빨라도, 너무 늦어도 안 된다.',
        '고기는 하루에 다섯 마리면 족하다. 바다도 쉬어야지.',
        '…솥밥, 잘 먹었다.',
      ]));
    },
  };

  const look = {
    bench() {
      if (after('q_captain')) return A.narr('할머니가 매일 저녁 앉아 계셨다는 벤치.\n막차가 들어오는 길이 한눈에 보인다.');
      return A.narr('바다를 보고 놓인 낡은 벤치.\n앉는 자리 한쪽만 유난히 닳아 있다.');
    },
    cat() { return A.narr(after('q_sori') ? '누룽지가 느릿하게 눈을 깜빡인다.\n"야옹."' : '노란 고양이가 식당 문 앞을 지키고 있다.\n"야옹."'); },
    busstop() { return A.narr('솥골 정류장. 하루 네 번.\n막차는 저녁 일곱 시.'); },
    well() { return A.narr('마을 우물. 물이 차고 달다.'); },
    photo() { return A.narr('할머니 사진.\n솥 앞에서 국자를 들고 웃고 계신다.'); },
    sign_forest() { return A.narr('↑ 숲 (버섯·산나물)\n도윤네 오두막'); },
    sign_beach() { return A.narr('↓ 바닷가 (조개·미역)\n부두'); },
    locked() { return A.narr('문이 닫혀 있다.'); },
  };

  return { scenes, talk, look };
}
