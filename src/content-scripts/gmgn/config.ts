import { ManifestContentScript } from '@types';

export function gmgn(): ManifestContentScript {
  return {
    matches: ['https://gmgn.ai/*'],
    run_at: 'document_end',
  };
}
