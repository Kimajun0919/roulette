import '../src/localization';
import { RouletteEngineAdapter } from './engine/RouletteEngineAdapter';

let engine: RouletteEngineAdapter | null = null;

export function getEngine() {
  if (!engine) {
    engine = new RouletteEngineAdapter();
  }
  return engine;
}
