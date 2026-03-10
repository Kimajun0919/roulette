type MapOption = { index: number; title: string };

type Props = {
  engineReady: boolean;
  maps: MapOption[];
  selectedMap: number;
  onMapChange: (index: number) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
};

export function MapThemeCard({ engineReady, maps, selectedMap, onMapChange, theme, onThemeChange }: Props) {
  return (
    <>
      <div className="row">
        <label htmlFor="sltMap">
          <i className="icon map" />
          <span>Map</span>
        </label>
        <select id="sltMap" value={selectedMap} onChange={(e) => onMapChange(Number(e.target.value))} disabled={!engineReady}>
          {maps.map((m) => (
            <option key={m.index} value={m.index}>
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
