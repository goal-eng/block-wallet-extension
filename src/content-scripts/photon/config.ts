import { ManifestContentScript } from '@types';

export function photon(): ManifestContentScript {
  return {
    matches: ['https://photon-sol.tinyastro.io/en/memescope'],
    run_at: 'document_end',
  };
}
