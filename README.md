# Marble Roulette

Box2D 기반 구슬 물리 시뮬레이션으로 당첨자를 뽑는 추첨 앱입니다.
현재 프로젝트는 **React + Vite 단일 앱 구조**이며, UI는 React 컴포넌트로, 물리/렌더는 `engine-core`로 분리되어 있습니다.

## 주요 기능

- 추첨 방식: `first` / `last` / `custom`
- 속도/스킬/자동 녹화 옵션
- 맵 변경, 라이트/다크 테마
- 오버레이 UI
  - 랭킹 오버레이
  - 미니맵(hover로 카메라 이동)
  - Fast Forward(누르고 있는 동안 2x)
  - 당첨자 스포트라이트 + 녹화 파일 다운로드
- Haneulbit API 모드
  - 승인된 attendance 횟수를 가중치(`name*count`)로 반영
  - `super_admin` 권한 확인

## 기술 스택

- React 18
- TypeScript
- Vite 5
- box2d-wasm
- Biome

## 실행

```bash
npm install
npm run dev
```

- Dev: `http://localhost:1236`

## 빌드/검증

```bash
npm run build
npm run preview
npm run lint
```

- Build output: `dist/`
- Preview: `http://localhost:4174`

## 프로젝트 구조

```text
src/
  main.tsx
  App.tsx
  styles.css

  components/
    ApiModeCard.tsx
    DrawOptionsCard.tsx
    EngineStatusCard.tsx
    FastForwardOverlay.tsx
    MapThemeCard.tsx
    MinimapCard.tsx
    ParticipantsCard.tsx
    RankingOverlay.tsx
    RunCard.tsx
    WinnerSpotlightCard.tsx
    NextStepsCard.tsx

  store/
    uiState.ts
    useRouletteUi.ts

  engine/
    RouletteEngineAdapter.ts
    useRouletteEngine.ts

  engine-core/
    roulette.ts
    rouletteRenderer.ts
    physics-box2d.ts
    marble.ts
    camera.ts
    data/*
    types/*
    utils/*

  maps/
    stages.ts

  api/
    haneulbit.ts
```

## 아키텍처 요약

1. `App.tsx`가 전체 화면(캔버스 + 설정 패널 + 오버레이) 조립
2. `useRouletteUi`가 폼/설정 상태를 reducer로 관리
3. `useRouletteEngine`이 엔진 생성/파괴 및 UI 동기화 담당
4. `RouletteEngineAdapter`가 engine-core API를 React 친화적으로 래핑
5. `engine-core`는 렌더/시뮬레이션만 담당

## API 모드

`ApiModeCard`에서 Base URL/Token 입력 후 attendance 데이터를 불러옵니다.

호출 순서:

- `GET /api/users/me` (권한 확인)
- `GET /api/users/`
- `GET /api/attendance/?verification_status=approved`

집계 결과를 `name*count`로 변환하여 참여자 입력에 반영합니다.

환경변수:

- `VITE_API_BASE_URL`

## 회귀 체크리스트

- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과
- [ ] local 모드 추첨(first/last/custom) 정상
- [ ] Fast Forward hold 동작
- [ ] 미니맵 hover 카메라 이동
- [ ] API 모드 권한 에러/성공 케이스 확인
- [ ] 자동 녹화 다운로드 링크 확인

## 참고

- 현재 엔진 동기화는 `useRouletteEngine`의 polling(100ms) 기반입니다.
- 성능 최적화 시 이벤트 기반 동기화로 전환 여지가 있습니다.

## License

MIT
