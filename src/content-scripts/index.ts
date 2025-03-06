import { photon } from './photon/config';
import { dexscreener } from './dexscreener/config';
import { pumpfun } from './pumpfun/config';
import { main } from './main/config';
import { wallet } from './wallet/config';
import { gmgn } from './gmgn/config';
import { photon2 } from './photon2/config';
import { photon3 } from './photon3/config';

export const contentScripts = {
  main,
  'wallet': wallet,
  'photon': photon,
  'photon2': photon2,
  'photon3': photon3,
  'dexscreener': dexscreener,
  'pumpfun': pumpfun,
  'gmgn': gmgn
}
