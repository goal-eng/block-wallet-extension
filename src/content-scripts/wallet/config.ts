import { ManifestContentConfig, ManifestContentScript } from '@types';

export function wallet({ hostPermissions }: ManifestContentConfig): ManifestContentScript {
  return {
    matches: hostPermissions,
    run_at: 'document_end',
  };
}
