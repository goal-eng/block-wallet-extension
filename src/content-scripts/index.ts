import { photon } from './photon/config';
import { dexscreener } from './dexscreener/config';
import { pumpfun } from './pumpfun/config';
import { main } from './main/config';
import { wallet } from './wallet/config';
import { gmgn } from './gmgn/config';

export const contentScripts = {
  main,
  'wallet': wallet,
  'photon': photon,
  'dexscreener': dexscreener,
  'pumpfun': pumpfun,
  'gmgn': gmgn
}
