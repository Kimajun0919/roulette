# React(Vite) 리팩토링 진행 현황

## 목표
1. 프로젝트 전체를 React + Vite 구조로 전환
2. Figma MCP 연동 가능한 컴포넌트 구조로 정리
3. API 모드(Haneulbit)와 로컬 모드를 공존시키되, 기본 동작은 안정 유지

---

## 완료된 항목
- 루트 엔트리 `index.html`를 React로 전환
- Canvas 엔진을 React 컴포넌트 내부(Canvas Host)에서 mount 하도록 변경
- 기존 inline script 기반 UI 로직을 React 컴포넌트로 이관
  - 참가자 입력/셔플
  - 당첨 옵션(첫번째/마지막/직접입력)
  - 속도/자동녹화/스킬사용
  - 맵/테마
  - 실행/리셋/당첨 결과/엔진 메시지
- 엔진 접근 통로를 `RouletteEngineAdapter`로 일원화
- API 모드 추가(Haneulbit)
  - super_admin 권한 확인
  - 승인된 참석 인증 횟수 집계
  - `이름*횟수` 형태로 룰렛 가중치 자동 반영
- Parcel 기반 legacy dev/build 스크립트 제거 (React 단일 빌드 체계)

---

## 진행중(마무리)
- 상태관리 단일화 (`useReducer` or store)
- API 모드 에러 메시지/복구 UX 고도화
- Figma MCP 연동 대비 컴포넌트 세분화

---

## 검증 체크리스트
- `npm run build` 성공
- Local 모드 추첨 정상
- API 모드(super_admin) 데이터 로드 및 가중치 반영 정상
- 모드 전환 시 기존 기능 회귀 없음
