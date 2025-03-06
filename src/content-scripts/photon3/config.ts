import { ManifestContentScript } from '@types';

export function photon3(): ManifestContentScript {
  return {
    matches: ['https://photon-sol.tinyastro.io/*'],
    run_at: 'document_end',
  };
}
