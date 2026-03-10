export function NextStepsCard() {
  return (
    <section className="card">
      <h2>다음 단계</h2>
      <ul>
        <li>Panel 단위 컴포넌트 분해를 Form/Result 위젯 단위로 추가 세분화</li>
        <li>백엔드 실제 API 스펙 맞춤(경로/필드/에러코드)</li>
        <li>엔진 옵션/상태를 useReducer 또는 전역 스토어로 통합</li>
        <li>Figma MCP 연결 후 디자인 토큰/컴포넌트 규격 동기화</li>
      </ul>
    </section>
  );
}
