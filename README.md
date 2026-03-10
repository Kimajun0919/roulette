# Marble roulette

This is a lucky draw by dropping marbles.

[Demo]( https://lazygyu.github.io/roulette )

## Requirements

- Typescript
- Parcel (legacy)
- React + Vite (migration target)
- box2d-wasm

## Development

### Legacy (현재 서비스 기준)
```shell
> yarn
> yarn dev
```

### React migration shell (신규)
```shell
> yarn
> yarn dev:react
```

## Build

### Legacy
```shell
> yarn build
```

### React migration shell
```shell
> yarn build:react
```

## Migration note
- `react.html` + `src-react/*` 에 React 마이그레이션 베이스를 추가했습니다.
- 현재는 레거시 엔진과 공존하는 단계이며, React UI로 입력/옵션/실행 패널을 1차 이관했습니다.
- 최종 목표는 전체 React 구조 전환 + Figma MCP 기반 UI 개선 + 백엔드 추첨 데이터 연동입니다.
