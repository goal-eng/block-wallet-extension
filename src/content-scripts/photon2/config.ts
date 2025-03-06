import { ManifestContentScript } from '@types';

export function photon2(): ManifestContentScript {
  return {
    matches: ['https://photon-sol.tinyastro.io/en/discover', 'https://photon-sol.tinyastro.io/en/trending'],
    run_at: 'document_end',
  };
}
