# React(Vite) 리팩토링 단계별 계획

## 최종 목표
1. 프로젝트 전체를 React + Vite 구조로 전환
2. Figma MCP 연동으로 UI 수정 워크플로우 구축
3. 기존 백엔드(추첨 데이터 관련)와 안정적으로 연결

---

## Phase 1 (완료)
- React + Vite 공존 골격 추가
- 레거시 Roulette 엔진을 React에서 부팅 가능한 어댑터 추가
- 명령어 추가: `dev:react`, `build:react`, `preview:react`

산출물:
- `react.html`
- `vite.react.config.ts`
- `src-react/*`

---

## Phase 2 (진행중)
- `index.html`의 inline script 로직을 React 컴포넌트로 분리
  - [x] 입력 패널(이름 입력)
  - [x] 당첨 순위/옵션 패널(첫번째/마지막/직접입력, 속도)
  - [x] 실행/결과 패널(시작/리셋, goal 이벤트 표시)
  - [ ] 나머지 옵션/맵/고급 기능 패널 이관
- 기존 `window.roulette/window.options` 의존 제거
  - [x] React 어댑터(`legacyEngine`)로 직접 접근 통로 통일
  - [ ] 전역 window 의존 완전 제거

---

## Phase 3 (진행중)
- 상태 관리 구조화
  - [x] React 상태 기반으로 핵심 실행 플로우 유지
  - [ ] `useReducer` or Zustand로 단일 스토어 통합
- 이벤트/엔진 브릿지 정리
  - [x] `RouletteEngineAdapter` 도입 (엔진 접근 통로 일원화)
  - [x] goal 이벤트를 React 상태로 연결
  - [ ] canvas mount 위치를 React DOM 노드로 이관
- 추가 이관
  - [x] 맵 선택 / 테마 선택 / 자동녹화 옵션 React UI 반영
  - [ ] 기타 고급 옵션/패널 이관 완료

---

## Phase 4 (준비 시작)
- 백엔드 연동 계층 추가
  - [x] `src-react/api/*` API 클라이언트 스캐폴드 생성
  - [ ] 추첨 데이터 저장/조회/이력 API 실제 연결
- 실패/재시도/로딩 상태 표준화
  - [ ] 에러/로딩 핸들링 공통 유틸 적용

---

## Phase 5
- Figma MCP 연동
  - 디자인 토큰 동기화
  - 주요 화면 컴포넌트 매핑
  - UI 수정 프로세스(디자인->코드 반영) 정착

---

## Phase 6
- Parcel 제거
- React 빌드 파이프라인으로 완전 전환
- 회귀 테스트 + 성능 점검 + 배포 스크립트 정리

---

## 체크포인트(매 단계 공통)
- 레거시 기능 동등성(당첨 로직/물리 동작)
- 성능(FPS, 렌더 지연)
- 다국어/테마/녹화 기능 유지 여부
