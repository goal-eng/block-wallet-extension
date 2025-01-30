import { photon } from './photon/config';
import { dexscreener } from './dexscreener/config';
import { pumpfun } from './pumpfun/config';
import { main } from './main/config';

export const contentScripts = {
  main,
  'photon': photon,
  'dexscreener': dexscreener,
  'pumpfun': pumpfun
}
