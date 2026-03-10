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
    <>
      <div className="row">
        <label>
          <i className="icon gear" />
          <span>Mode</span>
        </label>
        <div className="btn-group two-up">
          <button type="button" className={mode === 'local' ? 'active' : ''} onClick={() => onModeChange('local')}>
            Local
          </button>
          <button type="button" className={mode === 'api' ? 'active' : ''} onClick={() => onModeChange('api')}>
            API
          </button>
        </div>
      </div>

      {mode === 'api' ? (
        <>
          <div className="row row-stack">
            <label htmlFor="api-base">API Base URL</label>
            <input id="api-base" value={apiBaseUrl} onChange={(e) => onApiBaseUrlChange(e.target.value)} />
          </div>
          <div className="row row-stack">
            <label htmlFor="api-token">Bearer Token (super_admin)</label>
            <textarea
              id="api-token"
              rows={3}
              value={apiToken}
              onChange={(e) => onApiTokenChange(e.target.value)}
              placeholder="eyJ..."
            />
          </div>
          <div className="row row-api-action">
            <button type="button" onClick={onLoadAttendance} disabled={!apiBaseUrl || !apiToken}>
              Load attendance
            </button>
          </div>
          <p className="api-status">Role: {apiRole || 'unknown'}</p>
          <p className="api-status">Status: {apiStatus}</p>
          <ul className="api-preview">
            {weights.slice(0, 10).map((w) => (
              <li key={w.userId}>
                {w.name} - approved {w.count}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
