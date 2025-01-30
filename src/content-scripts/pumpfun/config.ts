import { ManifestContentScript } from '@types';

export function pumpfun(): ManifestContentScript {
  return {
    matches: ['https://pump.fun/*'],
    run_at: 'document_end',
  };
}
