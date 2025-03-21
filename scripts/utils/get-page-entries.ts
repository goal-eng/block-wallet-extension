import fse from 'fs-extra';

import { resolve } from 'path';

const entrySearch = {
  html: [/index(-\w+)?\.html/i],
  ts: [/(index|inject)\.(ts|js)/],
  build: [/(index|inject)\.js/, /\.css$/],
  resources: [/\.js/, /\.css$/],
}

export async function getEntryPoint(path: string, type: keyof typeof entrySearch) {
  const files = await fse.readdir(path);
  const entries = files.filter((name) =>
    entrySearch[type].find((regexp) => regexp.test(name))
  )

  return entries.map((name) => resolve(path, name));
}
