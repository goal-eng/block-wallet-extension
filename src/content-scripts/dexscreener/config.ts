import { ManifestContentScript } from '@types';

export function dexscreener(): ManifestContentScript {
  return {
    matches: ['https://dexscreener.com/*'],
    run_at: 'document_end',
  };
}
