# Marble Roulette

구슬을 떨어뜨려 당첨자를 뽑는 룰렛입니다.

[Demo](https://lazygyu.github.io/roulette)

## Tech Stack

- TypeScript
- React 18
- Vite 5
- box2d-wasm

## Run

```bash
npm install
npm run dev
```

- 기본 개발 서버: `http://localhost:1236`

## Build

```bash
npm run build
npm run preview
```

- 빌드 산출물: `dist/`

## Project Structure (요약)

- `src/main.tsx`: React 엔트리
- `src/App.tsx`: 상위 UI 조립
- `src/components/*`: UI 컴포넌트
- `src/store/*`: UI 상태/reducer/hook
- `src/engine/*`: 엔진 어댑터/React 훅
- `src/engine-core/*`: 룰렛 물리/렌더 코어
- `src/maps/stages.ts`: 맵 데이터

## Notes

- 현재 루트 엔트리(`index.html`)는 React 앱입니다.
- Canvas 엔진은 React 컴포넌트 내부(Canvas Host)에 mount 됩니다.
- API 모드(Haneulbit): 참석 인증 승인 횟수를 가중치(`이름*횟수`)로 불러와 룰렛에 반영합니다.
- API 모드는 `super_admin` 권한이 필요합니다.
- Parcel 레거시 엔트리/설정은 제거되었습니다.
