# 인수인계서 (Handover)

최종 업데이트: 2026-03-10

## 1. 현재 상태 요약

- 브랜치: `feat/react-vite-migration-phase1`
- 앱 엔트리: `index.html -> src/main.tsx` (React)
- 소스 루트: `src/`
- 빌드 산출물: `dist/`
- 레거시 Parcel 엔트리/설정 제거 완료
- SW/Workbox 제거 완료
- UI 관련 주요 오버레이(랭킹/미니맵/패스트포워드) React 이관 완료

---

## 2. 주요 설계 원칙

1. **UI는 React**에서 처리
2. **engine-core는 시뮬레이션/렌더 책임**으로 유지
3. API 모드(Haneulbit attendance weight) 유지
4. 파괴적 변경은 단계별 작은 커밋으로 진행

---

## 3. 핵심 모듈 인수인계

### 3.1 UI 상태
- 파일: `src/store/uiState.ts`, `src/store/useRouletteUi.ts`
- 역할:
  - names/winner/speed/theme 등 UI 상태 관리
  - API 모드 호출 후 weighted names로 변환

### 3.2 엔진 브릿지
- 파일: `src/engine/RouletteEngineAdapter.ts`, `src/engine/useRouletteEngine.ts`
- 역할:
  - 엔진 초기화/해제
  - `ready`, `goal`, `message`, `recordingready` 이벤트 구독
  - React에 필요한 snapshot/ranking 제공

### 3.3 엔진 코어
- 파일: `src/engine-core/*`
- 역할:
  - 물리(Box2D), 카메라, 렌더, 구슬 로직
  - UI 렌더가 아닌 코어 시뮬레이션 중심

---

## 4. 최근 정리 항목 (핵심)

- `src-react` -> `src` 변경
- `dist-react` -> `dist` 변경
- `.parcelrc`, `recap_2025.html`, `.parcel-cache` 정리
- `build-sw.js`, SW 등록 로직, `workbox-build` 제거
- 캔버스 내부 UIObject 계층 제거
  - 삭제: `UIObject.ts`, `fastForwader.ts`, `minimap.ts`, `rankRenderer.ts`, `types/mouseEvents.type.ts`
  - 대체: `MinimapCard.tsx`, `RunCard`의 fast-forward 버튼, `App.tsx` ranking UI

---

## 5. 점검 결과 (문서 작성 중 동시 점검)

### 통과
- `npm run build` 성공
- 구조적으로 React 단일 엔트리 확인
- 컴포넌트 레이어 존재/연결 정상

### 부족/개선 포인트
1. **엔진 동기화 방식 개선 여지**
   - 현재 `useRouletteEngine`에서 100ms polling으로 ranking/uiSnapshot 동기화
   - 개선안: 이벤트 기반 push(예: `uisnapshot` custom event)로 변경

2. **미사용 가능 코드 정리 후보**
   - `src/engine-core/misc/recap.ts`
   - `src/engine-core/misc/recap-2025-data.ts`
   - 실제 사용 여부 재검증 후 제거 고려

3. **테스트 자동화 부재**
   - 현재는 수동 회귀 위주
   - 최소 smoke 테스트(E2E) 도입 권장

4. **운영 가이드 문서 강화 필요**
   - API 토큰 취급 방식(.env.sample, 권한 정책) 문서화 필요

---

## 6. 다음 작업 우선순위 제안

1) `useRouletteEngine` polling -> 이벤트 기반 리팩터링  
2) recap 관련 파일 사용성 검증 후 정리  
3) Playwright 기반 기본 시나리오 3~5개 추가  
4) `.env.example` + 운영 가이드 보강

---

## 7. 빠른 실행/검증 명령

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

---

## 8. 인수자 체크리스트

- [ ] 로컬에서 `npm run build` 통과 확인
- [ ] Local 모드 추첨 플로우 확인
- [ ] API 모드(super_admin / non-super_admin) 확인
- [ ] 녹화 다운로드 링크 생성 확인
- [ ] 미니맵 hover 카메라 이동 확인
- [ ] FastForward 버튼(press/hold) 확인
