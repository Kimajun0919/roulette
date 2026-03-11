# Marble Roulette

Box2D 기반 추첨/레이싱 프로젝트입니다. 현재 구조는 `React + Vite + TypeScript` 프론트엔드와 `engine-core` 캔버스 엔진으로 분리되어 있습니다.

2026-03-11 기준으로 맵 시스템은 더 이상 `stages.ts` 하드코딩 배열에만 직접 의존하지 않습니다. 런타임은 `scene id` 기반으로 scene catalog를 읽고, legacy stage와 external scene JSON, raw Figma frame JSON을 함께 다룰 수 있습니다.

## 현재 상태 요약

- React/Vite 마이그레이션 완료
- canvas 엔진과 React UI 분리 완료
- scene id 기반 맵 선택 지원
- external scene manifest 기반 외부 맵 로드 지원
- raw Figma frame JSON -> `SceneDef` importer 스켈레톤 이상 구현 완료
- Figma visuals 일부를 실제 캔버스에 렌더링 가능
- Figma image paint, gradient, vector path, boolean path, clipsContent, isMask 일부 지원

## 주요 기능

- 추첨 방식
  - `first`
  - `last`
  - `custom`
- 속도 조절
- 자동 녹화
- skill 사용 on/off
- 다크/라이트 테마
- minimap hover 카메라 이동
- Fast Forward hold 중 2x 가속
- 우승자 spotlight와 녹화 파일 다운로드
- Haneulbit attendance API 기반 가중치 로드
- external scene 및 Figma-imported scene 선택

## 기술 스택

- React 18
- TypeScript 5
- Vite 5
- box2d-wasm
- Biome

## 실행

```bash
npm install
npm run dev
```

- Dev server: `http://localhost:1236`

## 빌드와 점검

```bash
npm run build
npm run preview
npm run lint
```

- Preview server: `http://localhost:4174`
- Build output: `dist/`

## 프로젝트 구조

```text
src/
  App.tsx
  main.tsx
  styles.css

  api/
    haneulbit.ts

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
    externalSceneManifest.ts
    sceneLoader.ts
    sceneSchema.ts
    scenes.ts
    stages.ts
    importers/
      figmaSceneImporter.ts

  store/
    uiState.ts
    useRouletteUi.ts

public/
  scenes/
    external-demo-ramp.scene.json
    figma-frame-demo.scene.json
    figma-rich-demo.scene.json
    figma-demo-badge.svg

docs/
  FIGMA_MAP_AUTHORING_GUIDE.md
  FIGMA_DESIGN_REQUEST.md
  REACT_MIGRATION_PLAN.md
```

## 런타임 아키텍처

### UI 레이어

- `src/App.tsx`
  - 전체 화면 조합
  - canvas host와 overlay 배치
  - settings 패널, notice, toast 관리
- `src/store/useRouletteUi.ts`
  - names 파싱
  - winner rank 계산
  - API 모드 attendance 로드
- `src/store/uiState.ts`
  - reducer 기반 UI 상태 보관

### 엔진 브리지

- `src/engine/useRouletteEngine.ts`
  - 엔진 생성/파괴
  - ready 이벤트 수신
  - ranking/ui snapshot polling
  - scene 변경, speed, theme, recording, skills 연결
- `src/engine/RouletteEngineAdapter.ts`
  - React 친화 API 제공
  - `setScene(sceneId)`
  - `getMaps()`
  - `getUiSnapshot()`
  - `onGoal()`, `onMessage()`, `onRecordingReady()`

### 엔진 코어

- `src/engine-core/roulette.ts`
  - 메인 시뮬레이션 루프
  - scene catalog 로드
  - scene 전환
  - marble 스폰, 카메라, ranking, recording
- `src/engine-core/rouletteRenderer.ts`
  - canvas 렌더링
  - physics entities 렌더
  - scene visuals 렌더
  - image, path, gradient, blend mode, clip, effects 일부 지원
- `src/engine-core/physics-box2d.ts`
  - Box2D world 연결

## Scene 시스템

### 현재 scene 소스

- legacy scenes
  - `src/maps/stages.ts`
  - `src/maps/scenes.ts`에서 `SceneDef`로 감쌈
- external scenes
  - `src/maps/externalSceneManifest.ts`
  - 현재 등록된 샘플
    - `/scenes/external-demo-ramp.scene.json`
    - `/scenes/figma-frame-demo.scene.json`
    - `/scenes/figma-rich-demo.scene.json`

### scene 로드 흐름

1. `Roulette`가 초기화 시 `loadSceneCatalog()` 호출
2. `sceneLoader.ts`가 legacy scenes와 external scenes를 합침
3. external URL은 `Promise.allSettled()`로 로드
4. payload 타입별 처리
   - 정규화된 `SceneDef` JSON
   - raw Figma frame JSON
   - `{ figmaFrame, imageUrls }` wrapper payload
5. 최종적으로 scene option 목록과 default scene id 생성

### scene schema 핵심 필드

- `id`
- `title`
- `width`
- `goalY`
- `zoomY`
- `anchors`
  - `goalY`
  - `zoomY`
  - `spawnCenter`
  - `minimapBounds`
  - `cameraStart`
- `entities`
- `visuals`
- `source`
  - `legacy`
  - `json`
  - `figma`

## Figma 연동 상태

### 현재 지원되는 입력

- 정규화된 scene JSON
- raw Figma frame JSON
- wrapper payload

예시 wrapper payload:

```json
{
  "sceneId": "figma-rich-demo",
  "sceneTitle": "Figma Rich Demo",
  "imageUrls": {
    "badge-ref": "/scenes/figma-demo-badge.svg"
  },
  "figmaFrame": {
    "type": "FRAME",
    "children": []
  }
}
```

### Figma frame 구조 규칙

- top-level frame 1개
- 내부 그룹
  - `physics`
  - `visuals`
  - `anchors`

이 규칙의 상세 내용은 `docs/FIGMA_MAP_AUTHORING_GUIDE.md`를 참고합니다.

### 현재 importer가 처리하는 것

- physics
  - `RECTANGLE` -> `box`
  - `ELLIPSE` -> `circle`
  - `LINE/VECTOR` -> `polyline`
- visuals
  - `RECTANGLE`, `ELLIPSE`, `TEXT`
  - `VECTOR`, `BOOLEAN_OPERATION`, `STAR`, `POLYGON`
  - `FRAME`, `INSTANCE`, `COMPONENT`, `COMPONENT_SET`
  - image paint
  - text fill
  - `fillGeometry`, `strokeGeometry`
- anchors
  - `goal-y`
  - `zoom-y`
  - `spawn-center`
  - `minimap-bounds`
  - `camera-start`

### 현재 renderer가 처리하는 것

- world layer visuals
- screen layer visuals
- solid fill
- linear gradient
- radial gradient
- conic gradient
- diamond gradient
- text
- image draw
- image clip
  - circle
  - rounded rect
- blend mode 일부
- `clipsContent`
- `isMask` 기반 vector/path mask
- effects 일부
  - `DROP_SHADOW`
  - `LAYER_BLUR`

### 아직 완전히 지원하지 않는 것

- `INNER_SHADOW`
- `BACKGROUND_BLUR`
- mask type 세부 규칙 전체
- Figma auto layout 재계산
  - 현재는 absolute bounding box 기준 정규화
- effect parity 100%
- Figma export 자동화
- MCP에서 바로 추출 후 manifest 자동 등록

## 샘플 scene 설명

### `external-demo-ramp.scene.json`

- 정규화된 external scene 예시
- physics / anchors / visuals 구조 확인용

### `figma-frame-demo.scene.json`

- raw Figma frame JSON을 직접 읽는 예시
- importer 기본 경로 확인용

### `figma-rich-demo.scene.json`

- richer visual 기능 확인용
- 포함 항목
  - image paint
  - boolean path
  - radial gradient
  - angular gradient
  - frame clipping
  - blend mode
  - vector mask

## UI와 scene 연결 포인트

- `MapThemeCard`
  - scene id 기반 드롭다운 렌더
- `useRouletteEngine`
  - `setMap(sceneId)`에서 `engine.setScene(sceneId)` 호출
- `roulette.ts`
  - `setScene(sceneId)` 지원
- `MinimapCard`
  - snapshot의 `stageWidth`와 entity 상태를 사용
  - minimap은 visuals가 아니라 physics/entity 기준

## API 모드

`ApiModeCard`에서 base URL과 token을 입력한 뒤 attendance 데이터를 불러올 수 있습니다.

호출 순서:

- `GET /api/users/me`
- `GET /api/users/`
- `GET /api/attendance/?verification_status=approved`

attendance count는 `name*count` 형태로 names input에 반영됩니다.

환경 변수:

- `VITE_API_BASE_URL`

기본값:

- `https://haneulbit-api.holyimpact.org`

## 문서

- Figma authoring contract: `docs/FIGMA_MAP_AUTHORING_GUIDE.md`
- 디자이너 전달용 요청서: `docs/FIGMA_DESIGN_REQUEST.md`
- React 전환 메모: `docs/REACT_MIGRATION_PLAN.md`
- 인수인계: `HANDOVER.md`

## 빠른 체크리스트

- [ ] `npm install`
- [ ] `npm run dev`
- [ ] `npm run build`
- [ ] local 추첨 동작 확인
- [ ] API 모드 로드 확인
- [ ] scene 드롭다운에 external scenes 표시 확인
- [ ] `Figma Rich Demo`에서 clip/blend/mask 시각 확인

## 현재 검증 상태

2026-03-11 기준 최근 확인:

- `npm run build` 통과
- dev server `:1236` 응답 확인
- `/scenes/figma-rich-demo.scene.json` 응답 확인

## 라이선스

MIT
