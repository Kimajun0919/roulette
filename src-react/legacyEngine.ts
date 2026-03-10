import '../src/localization';
import options from '../src/options';
import { registerServiceWorker } from '../src/registerServiceWorker';
import { Roulette } from '../src/roulette';

let roulette: Roulette | null = null;

export function startLegacyEngine() {
  if (roulette) return roulette;
  registerServiceWorker();
  roulette = new Roulette();
  (window as any).roulette = roulette;
  (window as any).options = options;
  return roulette;
}
