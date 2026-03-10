type MapOption = { index: number; title: string };

type Props = {
  engineReady: boolean;
  maps: MapOption[];
  selectedMap: number;
  onMapChange: (index: number) => void;
  themes: string[];
  theme: string;
  onThemeChange: (theme: string) => void;
};

export function MapThemeCard({ engineReady, maps, selectedMap, onMapChange, themes, theme, onThemeChange }: Props) {
  return (
    <section className="card">
      <h2>맵/테마</h2>
      <div className="row">
        <label htmlFor="map-select">맵</label>
        <select
          id="map-select"
          value={selectedMap}
          onChange={(e) => onMapChange(Number(e.target.value))}
          disabled={!engineReady}
        >
          {maps.map((m) => (
            <option key={m.index} value={m.index}>
              {m.index + 1}. {m.title}
            </option>
          ))}
        </select>
      </div>

      <div className="row" style={{ marginTop: 10 }}>
        <label htmlFor="theme-select">테마</label>
        <select id="theme-select" value={theme} onChange={(e) => onThemeChange(e.target.value)} disabled={!engineReady}>
          {themes.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
