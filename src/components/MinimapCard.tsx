import type { PointerEventHandler } from 'react';
import { initialZoom } from '../engine-core/data/constants';
import type { MapEntityState } from '../engine-core/types/MapEntity.type';

type UiSnapshot = {
  sceneId: string;
  stageWidth: number;
  stageGoalY: number;
  camera: { x: number; y: number; zoom: number };
  viewport: { width: number; height: number };
  marbles: Array<{ x: number; y: number; hue: number; name: string }>;
  entities: MapEntityState[];
  theme: { minimapBackground: string; minimapViewport: string };
};

type Props = {
  snapshot: UiSnapshot | null;
  onHoverViewport: (pos?: { x: number; y: number }) => void;
};

export function MinimapCard({ snapshot, onHoverViewport }: Props) {
  if (!snapshot) return null;

  const stageWidth = snapshot.stageWidth;
  const stageHeight = Math.max(30, snapshot.stageGoalY);
  const zoom = snapshot.camera.zoom * initialZoom;
  const viewW = Math.min(snapshot.viewport.width / zoom, stageWidth);
  const viewH = snapshot.viewport.height / zoom;

  const toDegrees = (rotation: number) => {
    if (Math.abs(rotation) > Math.PI * 2) return rotation;
    return (rotation * 180) / Math.PI;
  };

  const handleMove: PointerEventHandler<SVGSVGElement> = (e) => {
    if (!snapshot) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * stageWidth;
    const y = ((e.clientY - rect.top) / rect.height) * stageHeight;
    onHoverViewport({ x, y });
  };

  return (
    <aside className="minimap-overlay" aria-label="Stage minimap">
      <svg
        className="mini-map"
        viewBox={`0 0 ${stageWidth} ${stageHeight}`}
        preserveAspectRatio="none"
        onPointerMove={handleMove}
        onPointerLeave={() => onHoverViewport(undefined)}
      >
        <rect width={stageWidth} height={stageHeight} fill={snapshot.theme.minimapBackground} />

        {snapshot.entities.map((entity, index) => {
          const stroke = entity.shape.color ?? 'rgba(255,255,255,0.35)';

          if (entity.shape.type === 'polyline') {
            return (
              <g key={`polyline-${index}`} transform={`translate(${entity.x} ${entity.y}) rotate(${toDegrees(entity.angle)})`}>
                <polyline
                  points={entity.shape.points.map(([x, y]) => `${x},${y}`).join(' ')}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="0.4"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            );
          }

          if (entity.shape.type === 'circle') {
            return (
              <g key={`circle-${index}`} transform={`translate(${entity.x} ${entity.y}) rotate(${toDegrees(entity.angle)})`}>
                <circle r={entity.shape.radius} fill="none" stroke={stroke} strokeWidth="0.35" />
              </g>
            );
          }

          const width = entity.shape.width * 2;
          const height = entity.shape.height * 2;
          return (
            <g key={`box-${index}`} transform={`translate(${entity.x} ${entity.y}) rotate(${toDegrees(entity.angle)})`}>
              <g transform={`rotate(${toDegrees(entity.shape.rotation)})`}>
                <rect
                  x={-width / 2}
                  y={-height / 2}
                  width={width}
                  height={height}
                  fill="rgba(255,255,255,0.05)"
                  stroke={stroke}
                  strokeWidth="0.3"
                />
              </g>
            </g>
          );
        })}

        {snapshot.marbles.map((marble) => (
          <circle key={`${marble.name}-${marble.x}-${marble.y}`} cx={marble.x} cy={marble.y} r="0.45" fill={`hsl(${marble.hue} 100% 70%)`} />
        ))}

        <rect
          x={snapshot.camera.x - viewW / 2}
          y={snapshot.camera.y - viewH / 2}
          width={viewW}
          height={viewH}
          fill="none"
          stroke={snapshot.theme.minimapViewport}
          strokeWidth="0.35"
        />
      </svg>
    </aside>
  );
}
