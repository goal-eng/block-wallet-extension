import { ManifestConfig, ManifestContentScript } from '@types';

import { buildManifestV2 } from "./build-manifest-v2";
import { buildManifestV3 } from "./build-manifest-v3";
import { contentScripts } from '../content-scripts';

export const hostPermissions = ['https://photon-sol.tinyastro.io/*', 'https://dexscreener.com/*', 'https://pump.fun/*', 'https://gmgn.ai/*', 'http://localhost:3000/*'];
export function buildManifest(version: number, config: ManifestConfig) {

  const scripts = Object.entries(contentScripts)
    .map(([name, getConfig]): ManifestContentScript => ({
      ...getConfig({ hostPermissions }),
      js: config.content[name].js,
      css: config.content[name].css,
    }));

  switch (version) {
    case 2: {
      return buildManifestV2(config, hostPermissions, scripts);
    }
    case 3: {
      return buildManifestV3(config, hostPermissions, scripts);
    }
  }
}
