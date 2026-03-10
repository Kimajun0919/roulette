# Marble Roulette

구슬 물리 시뮬레이션(Box2D) 기반 추첨 앱입니다.  
현재 구조는 **React + Vite 단일 엔트리**로 정리되어 있으며, UI 레이어는 React 컴포넌트 중심으로 동작합니다.

---

## 1) 핵심 기능

- 구슬 기반 추첨 (물리 엔진: `box2d-wasm`)
- 당첨 방식 선택
  - 첫 번째 (`first`)
  - 마지막 (`last`)
  - N번째 (`custom`)
- 속도 제어, 스킬 사용 여부, 자동 녹화 옵션
- 맵/테마 선택
- 결과 순위 표시 (React UI)
- 미니맵 + 뷰포트 이동 (React UI)
- Fast Forward(누르고 있는 동안 2x) (React UI)
- Haneulbit API 모드 (참석 승인 횟수 기반 가중치)
  - `name*count` 형태로 추첨 가중치 반영
  - `super_admin` 권한 확인 포함

---

## 2) 기술 스택

- React 18
- TypeScript
- Vite 5
- box2d-wasm
- Biome (lint/format)

---

## 3) 실행 방법

### 요구사항

- Node.js 18+
- npm

### 설치

```bash
npm install
```

### 개발 서버

```bash
npm run dev
```

- 기본 주소: `http://localhost:1236`

### 빌드

```bash
npm run build
```

- 산출물: `dist/`

### 프리뷰

```bash
npm run preview
```

- 기본 주소: `http://localhost:4174`

### 린트

```bash
npm run lint
```

---

## 4) 프로젝트 구조

```text
src/
  main.tsx                     # React entry
  App.tsx                      # 화면 조립
  styles.css                   # 전역 스타일

  components/
    ApiModeCard.tsx            # API 모드 UI
    DrawOptionsCard.tsx        # 추첨/속도/옵션 UI
    EngineStatusCard.tsx       # 엔진 상태 UI
    MapThemeCard.tsx           # 맵/테마 선택 UI
    MinimapCard.tsx            # React 미니맵 UI
    ParticipantsCard.tsx       # 참여자 입력 UI
    RunCard.tsx                # 실행/리셋/FastForward UI
    NextStepsCard.tsx          # 안내 UI

  store/
    uiState.ts                 # reducer + state/action 타입
    useRouletteUi.ts           # UI 상태 훅 + API 로딩 로직

  engine/
    RouletteEngineAdapter.ts   # 엔진 어댑터 (React 친화 API)
    useRouletteEngine.ts       # 엔진 생명주기/동기화 훅

  engine-core/
    roulette.ts                # 시뮬레이션 메인
    rouletteRenderer.ts        # canvas 렌더
    physics-box2d.ts           # 물리 연동
    marble.ts                  # 구슬 로직
    camera.ts                  # 카메라 제어
    data/*                     # 상수/맵 alias
    misc/*                     # recap 유틸
    utils/*                    # 공통 유틸/녹화

  maps/
    stages.ts                  # 맵 데이터(실체)

  api/
    haneulbit.ts               # 외부 API 호출/가중치 생성
```

---

## 5) 아키텍처 요약

1. React UI(`App.tsx`, `components/*`)가 사용자 입력을 받음
2. `useRouletteUi`가 UI 상태(reducer) 관리
3. `useRouletteEngine`이 엔진 생성/초기화/상태 동기화 담당
4. `RouletteEngineAdapter`가 engine-core를 React에 맞게 래핑
5. `engine-core`는 순수 시뮬레이션/렌더 책임만 가짐

> 원칙: **UI는 React**, 엔진은 상태/제어 API 제공.

---

## 6) API 모드 (Haneulbit)

`ApiModeCard`에서 다음 정보를 입력합니다.

- Base URL
- Bearer Token

호출 흐름:

- `GET /api/users/me` → 권한 확인(`super_admin`)
- `GET /api/users/`
- `GET /api/attendance/?verification_status=approved`
- `user_id`별 승인 횟수 집계 → `name*count` 변환

실패 시 상태 문구(`apiStatus`)에 에러 표시.

환경변수 지원:

- `VITE_API_BASE_URL` (없으면 코드 기본값 사용)

---

## 7) React 전환 상태

- 루트 엔트리: React (`index.html -> src/main.tsx`)
- `src-react` → `src` 정리 완료
- 빌드 출력: `dist/` 단일화
- Parcel 관련 레거시 제거
- Service Worker/Workbox 잔재 제거
- 캔버스 오버레이 UI(랭킹/미니맵/패스트포워드) React UI로 이관 완료

---

## 8) 점검 체크리스트 (회귀)

아래 항목을 PR/배포 전 최소 1회 확인 권장:

- [ ] `npm run build` 성공
- [ ] Local 모드
  - [ ] 이름 입력/셔플 정상
  - [ ] first/last/custom 당첨 정상
  - [ ] 속도 변경 반영
  - [ ] 맵 변경 반영
  - [ ] 테마 변경 반영
  - [ ] FastForward(누르는 동안 2x) 동작
  - [ ] 미니맵 hover 시 뷰포트 이동
- [ ] API 모드
  - [ ] super_admin 아닐 때 권한 에러 노출
  - [ ] approved attendance 기반 가중치 반영
- [ ] 자동 녹화 ON 시 다운로드 링크 생성

---

## 9) 알려진 주의사항

- 엔진 상태 동기화(`useRouletteEngine`)가 100ms polling 기반이므로,
  데이터량이 매우 큰 경우 성능 튜닝 여지가 있습니다.
- `engine-core/misc/recap*.ts`는 현재 메인 플로우에서 직접 사용되지 않을 수 있으므로,
  필요 없으면 정리 대상 후보입니다.

---

## 10) 라이선스

MIT
