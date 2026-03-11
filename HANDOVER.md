# HANDOVER

최종 갱신: 2026-03-11

## 1. 인수인계 요약

이번 작업의 핵심은 맵 시스템을 `legacy stage array` 중심 구조에서 `scene catalog + external scene + Figma importer` 구조로 확장한 것입니다.

현재 앱은 다음을 할 수 있습니다.

- legacy stage를 scene id로 선택
- external scene JSON을 manifest에 등록해 런타임에서 교체
- raw Figma frame JSON을 importer로 읽어서 scene으로 변환
- Figma visuals 일부를 실제 canvas에 렌더
- `clipsContent`, blend mode, vector mask 일부를 scene visuals에 반영
- visual dummy에 `body=` / `collider=` metadata를 주면 obstacle proxy로 physics에 같이 올릴 수 있음

즉, 지금 상태는 `디자인 자산 기반 맵 교체 파이프라인의 1차 usable 버전`입니다. 아직 완전 자동화나 Figma parity 100%는 아니지만, external scene 교체와 richer visual 렌더는 가능한 상태입니다.

## 2. 최근 변경 사항

### 2.1 scene 구조 도입

- `src/maps/sceneSchema.ts`
  - `SceneDef`, `SceneOption`, `SceneCatalog` 추가
  - anchors, visuals, paint, effects, clip schema 정의
- `src/maps/scenes.ts`
  - legacy `stages.ts`를 `SceneDef[]`로 감쌈
- `src/maps/sceneLoader.ts`
  - legacy + external scene merge
  - URL 로드
  - raw Figma frame payload 처리
- `src/maps/externalSceneManifest.ts`
  - external scene URL 등록 지점

### 2.2 엔진 scene id 전환

- `src/engine-core/roulette.ts`
  - `loadSceneCatalog()` 호출
  - `setScene(sceneId)` 추가
  - scene anchor 기반 `spawnCenter`, `cameraStart` 사용
  - UI snapshot에 `sceneId`, `stageWidth` 등 반영
- `src/engine/RouletteEngineAdapter.ts`
  - `setScene(sceneId)` 노출
- `src/engine/useRouletteEngine.ts`
  - scene option과 scene id 기반 상태 반영
- `src/store/uiState.ts`
  - `selectedSceneId` 보관
- `src/App.tsx`
  - 드롭다운 선택 시 `setScene(sceneId)` 호출

### 2.3 minimap과 scene 폭 연동

- `src/components/MinimapCard.tsx`
  - 더 이상 고정 `26`만 가정하지 않음
  - snapshot의 `stageWidth` 기반으로 viewBox 계산

### 2.4 Figma importer 확장

- `src/maps/importers/figmaSceneImporter.ts`
  - physics / visuals / anchors 파싱
  - image paint
  - text
  - vector/boolean path
  - gradient
  - effects 일부
  - blend mode 일부
  - `clipsContent`
  - `isMask`
  - visual collider proxy

### 2.5 renderer 확장

- `src/engine-core/rouletteRenderer.ts`
  - scene visuals 렌더
  - world/screen layer 분리
  - image draw
  - gradient draw
  - `Path2D` path draw
  - clip 적용
  - blend mode 적용
  - vector mask clip 적용

### 2.6 샘플 scene 추가

- `public/scenes/external-demo-ramp.scene.json`
- `public/scenes/figma-frame-demo.scene.json`
- `public/scenes/figma-rich-demo.scene.json`
- `public/scenes/figma-demo-badge.svg`

## 3. 현재 동작 방식

### 3.1 앱 초기화

1. React가 `App.tsx` 렌더
2. `useRouletteEngine()`가 `RouletteEngineAdapter` 생성
3. `Roulette` 초기화 시 `loadSceneCatalog()` 호출
4. scene catalog 준비 후 `ready` 이벤트 발생
5. UI는 map dropdown에 `SceneOption[]` 렌더

### 3.2 scene 선택

1. 사용자가 Map 드롭다운에서 scene 선택
2. `App.tsx`가 reducer state의 `selectedSceneId` 갱신
3. `useRouletteEngine().setMap(sceneId)` 호출
4. adapter가 `roulette.setScene(sceneId)` 호출
5. 엔진이 scene을 교체하고 names/winner rank 재적용

### 3.3 external scene 로드

`src/maps/externalSceneManifest.ts`에 URL을 추가하면 됩니다.

로더는 URL별로 아래 순서로 판별합니다.

1. Figma wrapper payload인가
2. raw Figma frame node인가
3. 정규화된 scene JSON인가

로딩 실패 scene은 `Promise.allSettled()`에서 버리고 `console.warn()`만 남깁니다. 전체 앱 부팅은 막지 않습니다.

## 4. scene 데이터 계약

### 4.1 핵심 타입

`SceneDef`

- `id`
- `title`
- `width`
- `goalY`
- `zoomY`
- `anchors`
- `entities`
- `visuals`
- `source`

`source`

- `legacy`
- `json`
- `figma`

### 4.2 anchors

- `goalY`
  - 우승 판정 라인
- `zoomY`
  - 카메라 축소/집중 로직 기준
- `spawnCenter`
  - marble 스폰 중심
- `minimapBounds`
  - 현재 로더/정규화 fallback용
- `cameraStart`
  - 초기 카메라 위치

### 4.3 visuals

지원 visual kind

- `shape`
- `text`
- `image`
- `group`

지원 fill/paint

- solid color
- linear gradient
- radial gradient
- conic gradient
- diamond gradient

지원 effect

- `drop-shadow`
- `layer-blur`

지원 clip

- rect clip
- circle clip
- path clip

## 5. Figma importer 상세

### 5.1 기대하는 Figma frame 구조

top-level frame 아래 정확히 다음 그룹을 둡니다.

- `physics`
- `visuals`
- `anchors`

### 5.2 physics 변환

- `RECTANGLE` -> `box`
- `ELLIPSE` -> `circle`
- `LINE/VECTOR` -> `polyline`

physics metadata는 레이어명 `| key=value` 또는 `pluginData`에서 읽습니다.

현재 읽는 항목:

- `body`
- `density`
- `restitution`
- `angularVelocity`
- `life`

### 5.3 visuals 변환

현재 처리 대상:

- `RECTANGLE`
- `ELLIPSE`
- `TEXT`
- `FRAME`
- `INSTANCE`
- `COMPONENT`
- `COMPONENT_SET`
- `VECTOR`
- `BOOLEAN_OPERATION`
- `STAR`
- `POLYGON`

현재 처리 속성:

- `fills`
- `strokes`
- `fillGeometry`
- `strokeGeometry`
- `imageRef`
- `effects`
- `blendMode`
- `clipsContent`
- `isMask`
- `textAlignHorizontal`
- `fontSize`
- `fontName`
- `absoluteBoundingBox`

### 5.4 mask와 clipping 규칙

- frame-like node의 `clipsContent`는 자식 clip으로 전파
- `isMask: true` 노드는 직접 렌더하지 않음
- `isMask` 노드는 같은 sibling 이후 요소들에 clip path로 적용
- 현재 구현은 practical subset 기준
  - Figma의 모든 mask mode를 1:1 재현하는 구조는 아직 아님

### 5.5 visual collider proxy 규칙

- `visuals` 내부 노드라도 `body=static|kinematic`가 있으면 physics entity를 같이 생성함
- 필요하면 `collider=box|circle|polyline`로 충돌 형상을 강제 가능
- 지원 목적
  - prototype
  - dummy obstacle
  - 디자인 주도 시안 검증
- production 권장안은 여전히 `physics`와 `visuals` 분리

## 6. Renderer 상세

### 6.1 현재 지원되는 visual 렌더

- rect
- circle
- polyline
- path
- text
- image

### 6.2 현재 지원되는 visual 속성

- opacity
- rotation
- scaleX
- scaleY
- zIndex
- blend mode
- clipRect
- clips
- stroke width
- corner radius

### 6.3 gradient 처리

- linear
  - native linear gradient
- radial
  - native radial gradient
- conic
  - 브라우저 `createConicGradient()` 사용
  - 미지원 브라우저에서는 linear fallback
- diamond
  - 현재 radial approximation

### 6.4 주의 사항

- minimap은 visuals를 그리지 않음
- minimap은 entity physics 상태만 사용
- renderer는 Figma parity보다 `런타임 안정성` 우선

## 7. 샘플 asset 설명

### `external-demo-ramp.scene.json`

- 정규화된 scene JSON 예시
- external scene 기본 교체 확인용

### `figma-frame-demo.scene.json`

- raw Figma frame JSON의 최소 사용 예시

### `figma-rich-demo.scene.json`

- 현재 지원되는 richer visual 기능 시연용
- 포함 기능
  - image paint
  - boolean path
  - radial gradient
  - angular gradient
  - blend mode
  - frame clipping
  - vector mask

## 8. 문서와 전달물

- `README.md`
  - 현재 구조와 빠른 시작
- `docs/FIGMA_MAP_AUTHORING_GUIDE.md`
  - Figma authoring contract
- `docs/FIGMA_DESIGN_REQUEST.md`
  - 디자이너 전달용 요청서

## 9. 아직 안 된 것

이 항목들은 아직 미구현 또는 partial support 상태입니다.

- `INNER_SHADOW`
- `BACKGROUND_BLUR`
- mask mode 세부 규칙 전체
- Figma auto layout 재계산
- effect parity 100%
- Figma export 자동화
- MCP -> export -> manifest 자동 등록
- scene validation 강화
- scene schema versioning

## 10. 리스크와 주의점

### 10.1 importer 안정성

현재 importer는 demo/authoring contract 기반으로는 usable 하지만, arbitrary Figma 파일을 아무 제약 없이 넣는 수준은 아닙니다.

리스크:

- layer naming 누락 시 physics metadata 손실
- 복잡한 vector는 path fidelity 차이 발생 가능
- design이 px scale을 어기면 physics와 visuals가 어긋남

### 10.2 auto layout 해석

현재는 auto layout engine을 다시 계산하지 않습니다. Figma가 이미 계산한 absolute bounding box를 사용합니다.

즉:

- 최종 위치는 대체로 맞음
- layout semantics 자체를 런타임이 이해하는 것은 아님

### 10.3 clip/mask 구현 범위

현재는 `practical subset` 구현입니다.

- frame clipping은 usable
- vector mask도 usable
- 하지만 advanced mask behavior는 아직 아님

## 11. 다음 우선순위

### 우선순위 1

- `INNER_SHADOW`
- `BACKGROUND_BLUR`
- 오프스크린 합성 레이어 추가

### 우선순위 2

- importer validation 강화
- scene schema version 필드 도입
- 잘못된 Figma payload 오류 메시지 개선

### 우선순위 3

- Figma export automation
- manifest 자동 등록 도구
- 디자인 자산 pipeline 문서화 강화

## 12. 운영/개발 명령

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

기본 포트:

- dev: `1236`
- preview: `4174`

## 13. 인수 체크리스트

- [ ] `npm run dev`로 앱 기동 확인
- [ ] Map 드롭다운에 external scenes가 보이는지 확인
- [ ] `External Demo Ramp` 선택 시 scene 교체 확인
- [ ] `Figma Frame Demo` 선택 시 importer 기본 경로 확인
- [ ] `Figma Rich Demo` 선택 시 clip/blend/mask 시각 확인
- [ ] local names 입력 후 추첨 시작 확인
- [ ] API 모드 attendance 로드 확인
- [ ] 자동 녹화 다운로드 확인

## 14. 최근 검증

2026-03-11 기준 확인 완료:

- `npm run build` 통과
- `http://localhost:1236/` 응답 확인
- `http://localhost:1236/scenes/figma-rich-demo.scene.json` 응답 확인

## 15. 참고

Figma REST API 참고:

- https://developers.figma.com/docs/rest-api/file-node-types/
- https://developers.figma.com/docs/rest-api/images/
