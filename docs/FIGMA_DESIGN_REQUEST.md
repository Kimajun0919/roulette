# Figma Design Request

## 문서 목적

이 문서는 디자이너에게 바로 전달할 수 있는 요청서입니다.

목표는 다음 두 가지를 동시에 만족하는 맵 제작입니다.

- 런타임에서 전체 맵을 교체할 수 있어야 함
- 일부 요소만 수정해서 다시 가져오는 것도 가능해야 함

중요한 점은, 이 프로젝트의 맵은 단순한 화면 시안이 아니라 `physics + visuals + anchors`를 가진 런타임 자산이라는 점입니다.

## 이번 요청의 핵심

이번 맵 작업은 일반적인 UI 시안 전달이 아닙니다.

다음 조건을 지켜야 엔지니어링 쪽 importer가 안전하게 맵을 읽을 수 있습니다.

- scene마다 top-level frame 1개
- 내부 구조 고정
  - `physics`
  - `visuals`
  - `anchors`
- scale 고정
- physics 네이밍 규칙 고정
- visual과 physics 완전 분리

## 디자이너에게 전달할 요약 문구

아래 문구를 그대로 전달해도 됩니다.

```text
이번 roulette 맵은 일반 시안이 아니라 런타임에서 직접 교체 가능한 scene 자산으로 제작해야 합니다.
각 맵은 Figma top-level frame 1개로 만들고, 내부에 반드시 physics / visuals / anchors 세 그룹을 포함해 주세요.
physics는 실제 충돌과 게임 판정을 위한 레이어이고, visuals는 장식 전용입니다.
physics와 visuals를 절대 섞지 말아 주세요.
전체 scene은 고정 스케일로 작업해야 하며, 2600px = 26 world units, 100px = 1 world unit 기준을 사용합니다.
```

## 전달물 요구사항

### 필수 전달물

- scene별 top-level frame
- frame 내부의 `physics`, `visuals`, `anchors`
- 정확한 anchor 이름
  - `goal-y`
  - `zoom-y`
  - `spawn-center`
- physics 레이어명 메타데이터
- 고정 scale 준수

### 권장 전달물

- scene title
- scene id
- scene version
- 최종 의도 스크린샷
- 움직이는 요소 목록
- 주의가 필요한 구간 메모

### 있으면 좋은 전달물

- image asset 목록
- 사용된 외부 이미지 원본
- mask/boolean 사용 의도 메모

## Figma 파일 구조

각 scene은 아래 구조로 제작해 주세요.

```text
Scene/<scene-id>
  physics/
  visuals/
  anchors/
```

### `physics`

실제 게임 충돌과 물리 판정에 사용됩니다.

허용:

- Rectangle
- Perfect Ellipse
- Line
- Flattened Vector

금지:

- Text
- Image
- Boolean group을 physics 원본으로 사용하는 것
- Component instance
- Auto layout container를 physics 원본으로 사용하는 것
- 장식 레이어

### `visuals`

화면에 보이는 디자인 자산 전용입니다.

허용:

- background
- logo
- label
- glow
- frame
- image
- gradient
- mask
- boolean
- decorative vector

중요:

- visuals는 물리 판정에 사용되지 않습니다
- 예쁘게 보여도 physics와 맞지 않으면 게임 플레이가 깨질 수 있습니다
- 예외적으로 prototype/dummy 검증용이면 visual 레이어에 `body=static|kinematic`와 `collider=box|circle|polyline`를 붙여 collider proxy로 사용할 수 있습니다
- 다만 production handoff는 여전히 `physics`와 `visuals`를 분리하는 방식을 우선합니다

### `anchors`

런타임 기준점입니다.

필수 anchor:

- `goal-y`
- `zoom-y`
- `spawn-center`

권장 anchor:

- `minimap-bounds`
- `camera-start`

## 좌표계와 스케일

반드시 아래 기준을 지켜 주세요.

- scene width: `2600 px`
- runtime width: `26 world units`
- 변환 비율: `100 px = 1 world unit`

중요:

- 모든 scene에서 같은 비율을 사용해야 합니다
- 특정 맵만 다른 스케일로 만들면 importer가 어긋납니다
- positive y는 아래 방향입니다

## physics 레이어 네이밍 규칙

physics 내부 레이어는 아래 형식을 지켜 주세요.

```text
<name> | body=<static|kinematic> | density=<number> | restitution=<number> | angularVelocity=<number> | life=<number>
```

예시:

```text
wall-left | body=static | density=1 | restitution=0
peg-01 | body=static | density=1 | restitution=1.2
rotor-main | body=kinematic | density=1 | restitution=0 | angularVelocity=3.5
```

설명:

- `body`
  - `static`
  - `kinematic`
- `density`
  - 기본 질량 계수
- `restitution`
  - 반발 계수
- `angularVelocity`
  - 회전 속도
- `life`
  - 필요 시만 사용

## visuals 제작 가이드

### 지금 엔진이 이미 처리 가능한 것

- solid fill
- linear gradient
- radial gradient
- angular gradient
- diamond gradient
- image paint
- text
- vector path
- boolean path
- `clipsContent`
- `isMask`
- blend mode 일부
- drop shadow
- layer blur

### 아직 완전하지 않은 것

- inner shadow
- background blur
- 고급 mask behavior 전체
- Figma auto layout semantics 전체

디자인 시 주의:

- auto layout은 써도 되지만, 최종 absolute layout이 깨지지 않아야 합니다
- 너무 복잡한 효과를 physics와 겹쳐 쓰지 말아 주세요
- 마스크는 가능하면 명확한 의도를 가진 단순 구조로 써 주세요

## 금지 사항

아래는 importable scene 기준으로 금지합니다.

- physics와 visuals 혼합
- physics 그룹에 unnamed layer 사용
- scene마다 임의 스케일 변경
- ellipse로 타원을 그리고 circle처럼 쓰는 것
- hidden gameplay layer를 visuals에 숨겨두는 것
- component instance를 physics shape로 사용하는 것
- exporter가 이해하기 어려운 과도한 nested booleans

## 디자이너 체크리스트

- [ ] scene마다 top-level frame 1개인가
- [ ] `physics`, `visuals`, `anchors`가 모두 있는가
- [ ] `goal-y`, `zoom-y`, `spawn-center`가 정확한 이름으로 있는가
- [ ] physics 레이어가 모두 parseable naming을 가졌는가
- [ ] `2600 px = 26 units` 기준을 지켰는가
- [ ] visuals와 physics를 분리했는가
- [ ] image asset 원본을 함께 전달했는가

## 엔지니어가 기대하는 handoff 방식

가능한 handoff 방식은 아래 3가지입니다.

### 1. 가장 권장

- Figma frame JSON export
- image asset URL 또는 원본 파일
- scene id / title / version 메모

### 2. 차선

- Figma 파일 링크
- scene별 최종 스크린샷
- 엔지니어가 MCP/REST로 JSON을 다시 추출

### 3. 임시

- JSON 없이 frame 구조와 asset만 전달
- 엔지니어가 수동 정규화

## 디자이너에게 같이 전달할 설명

```text
이 프로젝트는 맵이 단순 배경이 아니라 runtime scene으로 교체되어야 합니다.
그래서 physics와 visuals를 분리해서 제작해야 하고, anchor 이름과 scale이 고정되어야 합니다.
visuals는 비교적 자유롭게 표현해도 되지만, gameplay와 관련된 실제 충돌선/충돌물은 반드시 physics 그룹에서만 정의해 주세요.
```

## 요청 우선순위

### 1차 요청

- 구조가 맞는 scene 제작
- anchors 정확히 배치
- physics naming 정확히 작성
- visuals와 physics 분리

### 2차 요청

- richer visuals
  - gradient
  - image paint
  - mask
  - decorative boolean

### 3차 요청

- 브랜딩 강화
- 대체 스킨 버전
- variant scene 실험

## 수락 기준

다음 조건을 만족하면 엔지니어링 handoff 가능으로 봅니다.

- scene이 importer 구조를 만족함
- physics가 손실 없이 변환 가능함
- anchors가 정확히 읽힘
- visuals가 크게 깨지지 않고 렌더됨
- image asset 참조가 복원 가능함

## 참고 문서

- Authoring contract: `docs/FIGMA_MAP_AUTHORING_GUIDE.md`
- Project overview: `README.md`
- Handover: `HANDOVER.md`
