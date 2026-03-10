# Marble roulette

This is a lucky draw by dropping marbles.

[Demo]( https://lazygyu.github.io/roulette )

## Requirements

- Typescript
- Parcel (legacy)
- React + Vite (migration target)
- box2d-wasm

## Development

### React (기본)
```shell
> npm install
> npm run dev
```

### Legacy (비교/검증용)
```shell
> npm run dev:legacy
```

## Build

### React (기본)
```shell
> npm run build
```

### Legacy (비교/검증용)
```shell
> npm run build:legacy
```

## Migration note
- `react.html` + `src-react/*` 에 React 마이그레이션 베이스를 추가했습니다.
- 현재는 레거시 엔진과 공존하는 단계이며, React UI로 입력/옵션/실행 + 맵/테마/자동녹화 패널을 이관했습니다.
- `src-react/engine/RouletteEngineAdapter.ts`로 엔진 접근 통로를 일원화했습니다.
- `src-react/components/*`로 UI를 카드 단위 컴포넌트로 분해했습니다(Figma MCP 연결 준비).
- `src-react/api/*` + `DataSyncCard`로 백엔드 추첨 데이터 list/create 연결 지점을 추가했습니다.
- 최종 목표는 전체 React 구조 전환 + Figma MCP 기반 UI 개선 + 백엔드 추첨 데이터 연동입니다.
