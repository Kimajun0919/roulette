import type { DrawRecord } from '../api/types';

type Props = {
  apiBase: string;
  status: string;
  records: DrawRecord[];
  onRefresh: () => void;
  onSave: () => void;
  canSave: boolean;
};

export function DataSyncCard({ apiBase, status, records, onRefresh, onSave, canSave }: Props) {
  return (
    <section className="card">
      <h2>백엔드 추첨 데이터 연동 (스캐폴드)</h2>
      <p className="muted">API Base: {apiBase || '(same-origin)'}</p>
      <div className="row">
        <button onClick={onRefresh}>이력 새로고침</button>
        <button onClick={onSave} disabled={!canSave}>현재 결과 저장</button>
      </div>
      <p className="muted">상태: {status}</p>
      <ul>
        {records.slice(0, 5).map((r) => (
          <li key={r.id}>{r.createdAt} - {r.winner} ({r.participants.length}명)</li>
        ))}
      </ul>
    </section>
  );
}
