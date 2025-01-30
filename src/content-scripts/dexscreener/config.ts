import { ManifestContentScript } from '@types';

export function dexscreener(): ManifestContentScript {
  return {
    matches: ['https://dexscreener.com/solana/*'],
    run_at: 'document_end',
  };
}
