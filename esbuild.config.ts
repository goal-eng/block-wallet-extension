import { html } from '@esbuilder/html';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import { BuildOptions } from 'esbuild';
import postcssImport from 'postcss-import';
import discardComments from 'postcss-discard-comments';
import postcssPluginNamespace from 'postcss-plugin-namespace';
import addSlashesPlugin from './postcss-add-slashes';
import cssnano from 'cssnano';

import { esbuildCssPlugin } from './scripts/utils';

export function makeConfig(entryPoints: string[], outDir: string, isHtml?: boolean) {
  const config: BuildOptions = {
    entryPoints,
    outdir: outDir,
    bundle: true,
    sourcemap: false,
    minify: false,
    target: ['chrome99', 'firefox102', 'safari16', 'edge113'],
    loader: {
      '.png': 'dataurl',
      '.webp': 'dataurl',
      '.jpeg': 'dataurl',
      '.svg': 'dataurl',
      '.json': 'json',
    },
    plugins: [
      esbuildCssPlugin({
        plugins: [
          tailwindcss,
          autoprefixer,
          postcssImport(),
          // addSlashesPlugin(),
          // discardComments({ removeAll: true }),
          cssnano({ preset: 'default' }), // Minify CSS
        ],
        inject: isHtml,
      })
    ],
  }

  if (isHtml) {
    config.plugins?.push(
      html(),
    )
  }

  return config;
}
