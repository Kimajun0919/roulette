# Marble roulette

This is a lucky draw by dropping marbles.

[Demo]( https://lazygyu.github.io/roulette )

## Requirements

- TypeScript
- React + Vite
- box2d-wasm

## Development

```shell
npm install
npm run dev
```

## Build

```shell
npm run build
npm run preview
```

## Notes
- 루트 엔트리(`index.html`)는 React 앱입니다.
- Canvas 엔진은 React 컴포넌트 내부(Canvas Host)에 mount 됩니다.
- API 모드(Haneulbit): 참석 인증 승인 횟수를 가중치(`이름*횟수`)로 불러와 룰렛에 반영합니다.
- API 모드는 `super_admin` 권한이 필요합니다.
