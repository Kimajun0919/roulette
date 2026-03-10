import '../src/localization';
import { RouletteEngineAdapter } from './engine/RouletteEngineAdapter';

export function createEngine(mountElement?: HTMLElement) {
  return new RouletteEngineAdapter(mountElement);
}
