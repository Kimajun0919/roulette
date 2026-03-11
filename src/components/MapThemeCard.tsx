import type { SceneOption } from '../maps/sceneSchema';

type Props = {
  engineReady: boolean;
  maps: SceneOption[];
  selectedSceneId: string;
  onMapChange: (sceneId: string) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
};

export function MapThemeCard({ engineReady, maps, selectedSceneId, onMapChange, theme, onThemeChange }: Props) {
  return (
    <>
      <div className="row">
        <label htmlFor="sltMap">
          <i className="icon map" />
          <span>Map</span>
        </label>
        <select id="sltMap" value={selectedSceneId} onChange={(e) => onMapChange(e.target.value)} disabled={!engineReady}>
          {maps.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
      </div>

      <div className="row row-theme">
        <div className="theme">
          <i className="icon sun" />
          <input
            type="checkbox"
            id="chkDarkMode"
            checked={theme === 'dark'}
            disabled={!engineReady}
            onChange={(e) => onThemeChange(e.target.checked ? 'dark' : 'light')}
          />
          <i className="icon moon" />
        </div>
      </div>
    </>
  );
}
