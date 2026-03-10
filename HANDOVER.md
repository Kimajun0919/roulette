# HANDOVER

최종 갱신: 2026-03-10 (main 기준)

## 1) 현재 브랜치/배포 기준

- 기준 브랜치: `main`
- 엔트리: `index.html -> src/main.tsx`
- 빌드 출력: `dist/`
- 패키지 매니저 기준: `npm` (`package-lock.json`)

## 2) 현재 상태 요약

- React + Vite 전환 완료
- `src-react`/Parcel 레거시 정리 완료
- Service Worker/Workbox 제거 완료
- 캔버스 오버레이 UI를 React 컴포넌트로 운영 중
  - `RankingOverlay`, `MinimapCard`, `FastForwardOverlay`, `WinnerSpotlightCard`

## 3) 핵심 파일 인수 포인트

### UI/상태
- `src/App.tsx`: 전체 화면 레이아웃/상호작용 허브
- `src/store/uiState.ts`: reducer, action, 초기 상태
- `src/store/useRouletteUi.ts`: names 파싱, API 모드 로딩

### 엔진 브릿지
- `src/engine/useRouletteEngine.ts`
  - 엔진 lifecycle
  - ranking/uiSnapshot/녹화 이벤트 동기화
- `src/engine/RouletteEngineAdapter.ts`
  - 엔진 메서드 래핑 (`setMap`, `setTheme`, `setFastForwardEnabled` 등)

### 엔진 코어
- `src/engine-core/roulette.ts`: 메인 시뮬레이션 루프
- `src/engine-core/rouletteRenderer.ts`: canvas 렌더
  - React가 만든 `<canvas>`를 주입받아 사용 가능
- `src/engine-core/physics-box2d.ts`: Box2D 연동

### API
- `src/api/haneulbit.ts`
  - 권한 체크(`super_admin`) + attendance 집계

## 4) 운영/개발 명령

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## 5) 문서 작성 시점 점검 결과

### 정상
- `npm run lint` 통과
- `npm run build` 통과

### 확인 필요/개선 후보
1. `useRouletteEngine`의 100ms polling 동기화
   - 이벤트 push 방식으로 변경 시 효율 개선 가능
2. `src/engine-core/misc/recap*.ts` 실사용 여부 재검토
3. 자동화 테스트(E2E smoke) 부재
4. API 운영 가이드(`.env.example`, 토큰 보안 가이드) 보강 필요

## 6) 권장 다음 작업

1) 엔진 -> UI snapshot 이벤트 기반 전환  
2) recap 파일 정리 여부 결정  
3) Playwright smoke 시나리오 추가  
4) API 모드 운영 문서 강화

## 7) 인수 체크리스트

- [ ] dev 서버 기동 확인 (`:1236`)
- [ ] 추첨 시나리오(first/last/custom) 확인
- [ ] FastForward / 미니맵 동작 확인
- [ ] API 모드 권한/데이터 반영 확인
- [ ] 녹화 다운로드 링크 확인
