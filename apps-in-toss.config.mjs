// 앱인토스(토스 앱 안 미니앱) 설정.
// appName은 앱인토스 콘솔에 등록한 앱 이름과 글자 하나까지 같아야 해요. 콘솔에서 다른 이름으로 등록했다면 여기를 고치고 다시 빌드하세요.
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'morakmorak',
  permissions: [],            // 카메라·위치·연락처 등은 쓰지 않아요
  webBundleDir: 'dist',       // tools/build-toss.mjs가 게임 파일을 모아 두는 곳
  navigationBar: { withBackButton: true, withHomeButton: true, withTitle: true },
  webView: {
    bounces: false,                              // 화면이 고무줄처럼 튕기지 않게
    pullToRefreshEnabled: false,                 // 아래로 당겨 새로고침 금지 (게임 중 실수 방지)
    overScrollMode: 'never',
    allowsBackForwardNavigationGestures: false,  // 옆으로 밀어 뒤로 가기 금지
    allowsInlineMediaPlayback: true,
    mediaPlaybackRequiresUserAction: true,       // 소리는 첫 터치 뒤에 시작
  },
});
