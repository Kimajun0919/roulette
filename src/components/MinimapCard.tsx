import { type MouseEventHandler, useEffect, useRef } from 'react';
import { initialZoom } from '../engine-core/data/constants';
import type { MapEntityState } from '../engine-core/types/MapEntity.type';

type UiSnapshot = {
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

const SCALE = 4;
const MAP_WIDTH = 26;

export function MinimapCard({ snapshot, onHoverViewport }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !snapshot) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const h = snapshot.stageGoalY * SCALE;
    canvas.width = MAP_WIDTH * SCALE;
    canvas.height = Math.max(120, h);

    ctx.fillStyle = snapshot.theme.minimapBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(SCALE, SCALE);

    snapshot.entities.forEach((entity) => {
      ctx.save();
      ctx.translate(entity.x, entity.y);
      ctx.rotate(entity.angle);
      ctx.strokeStyle = entity.shape.color ?? '#ccc';
      switch (entity.shape.type) {
        case 'box': {
          const w = entity.shape.width * 2;
          const hh = entity.shape.height * 2;
          ctx.rotate(entity.shape.rotation);
          ctx.strokeRect(-w / 2, -hh / 2, w, hh);
          break;
        }
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, entity.shape.radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 'polyline':
          if (entity.shape.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(entity.shape.points[0][0], entity.shape.points[0][1]);
            for (let i = 1; i < entity.shape.points.length; i++) {
              ctx.lineTo(entity.shape.points[i][0], entity.shape.points[i][1]);
            }
            ctx.stroke();
          }
          break;
      }
      ctx.restore();
    });

    snapshot.marbles.forEach((marble) => {
      ctx.beginPath();
      ctx.fillStyle = `hsl(${marble.hue} 100% 70%)`;
      ctx.arc(marble.x, marble.y, 0.45, 0, Math.PI * 2);
      ctx.fill();
    });

    const zoom = snapshot.camera.zoom * initialZoom;
    const viewW = snapshot.viewport.width / zoom;
    const viewH = snapshot.viewport.height / zoom;
    ctx.strokeStyle = snapshot.theme.minimapViewport;
    ctx.lineWidth = 0.3;
    ctx.strokeRect(snapshot.camera.x - viewW / 2, snapshot.camera.y - viewH / 2, viewW, viewH);

    ctx.restore();
  }, [snapshot]);

  const handleMove: MouseEventHandler<HTMLCanvasElement> = (e) => {
    if (!snapshot) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * MAP_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * snapshot.stageGoalY;
    onHoverViewport({ x, y });
  };

  return (
    <section className="card">
      <h2>미니맵 (React UI)</h2>
      <canvas
        ref={canvasRef}
        className="mini-map"
        onMouseMove={handleMove}
        onMouseLeave={() => onHoverViewport(undefined)}
      />
    </section>
  );
}
