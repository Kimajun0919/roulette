import type { AttendanceWeight } from '../api/haneulbit';

type Props = {
  mode: 'local' | 'api';
  onModeChange: (mode: 'local' | 'api') => void;
  apiBaseUrl: string;
  apiToken: string;
  apiStatus: string;
  apiRole: string;
  weights: AttendanceWeight[];
  onApiBaseUrlChange: (value: string) => void;
  onApiTokenChange: (value: string) => void;
  onLoadAttendance: () => void;
};

export function ApiModeCard(props: Props) {
  const {
    mode,
    onModeChange,
    apiBaseUrl,
    apiToken,
    apiStatus,
    apiRole,
    weights,
    onApiBaseUrlChange,
    onApiTokenChange,
    onLoadAttendance,
  } = props;

  return (
    <section className="card">
      <h2>모드</h2>
      <div className="row">
        <button className={mode === 'local' ? 'active' : ''} onClick={() => onModeChange('local')}>Local</button>
        <button className={mode === 'api' ? 'active' : ''} onClick={() => onModeChange('api')}>API (Haneulbit)</button>
      </div>

      {mode === 'api' && (
        <>
          <div className="row" style={{ marginTop: 10 }}>
            <label htmlFor="api-base">API Base URL</label>
            <input id="api-base" value={apiBaseUrl} onChange={(e) => onApiBaseUrlChange(e.target.value)} />
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <label htmlFor="api-token">Bearer Token (super_admin)</label>
            <textarea
              id="api-token"
              rows={3}
              value={apiToken}
              onChange={(e) => onApiTokenChange(e.target.value)}
              placeholder="eyJ..."
            />
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button onClick={onLoadAttendance} disabled={!apiBaseUrl || !apiToken}>참석 인증 횟수 불러오기</button>
          </div>
          <p className="muted">권한: {apiRole || '미확인'}</p>
          <p className="muted">상태: {apiStatus}</p>
          <ul>
            {weights.slice(0, 10).map((w) => (
              <li key={w.userId}>{w.name} — 승인 {w.count}회</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
