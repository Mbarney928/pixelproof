// Runs the real pixelproof pipeline against the demo site and publishes the report for the review app:
//   1. capture release 1 and approve it as the baseline
//   2. capture release 2 and compare it with the baseline
//   3. copy the report into apps/review/public/report
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { run } from '../packages/cli/dist/index.js';
import { startDemoServer } from '../demo/server.js';

const WORK = '.pixelproof-demo';
const OUT = process.env.DEMO_REPORT_DIR ?? 'apps/review/public/report';

const page = (name, file) => ({ name, group: 'Lumen Supply', url: `/${file}` });
const shared = {
  dir: join(WORK, 'runs'),
  viewports: [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1280, height: 800 },
  ],
  themes: ['light', 'dark'],
  failOn: 'never',
};
const release1 = [
  page('Shop', 'index.html'),
  page('Plans', 'pricing.html'),
  page('Checkout', 'checkout.html'),
  page('UI kit', 'components.html'),
  page('Gift cards', 'gift-cards.html'),
];
const release2 = [...release1.slice(0, 4), page('About', 'about.html')];

const io = {
  stdout: (t) => process.stdout.write(t),
  stderr: (l) => process.stderr.write(`${l}\n`),
  env: process.env,
};

async function cli(args, configFile, baseUrl) {
  const code = await run([...args, '-c', configFile], {
    ...io,
    env: { ...process.env, PIXELPROOF_BASE_URL: baseUrl },
  });
  if (code === 2) throw new Error(`pixelproof ${args.join(' ')} failed`);
  return code;
}

await rm(WORK, { recursive: true, force: true });
await mkdir(WORK, { recursive: true });
const v1Config = join(WORK, 'release-1.json');
const v2Config = join(WORK, 'release-2.json');
await writeFile(v1Config, JSON.stringify({ ...shared, targets: { urls: release1 } }));
await writeFile(v2Config, JSON.stringify({ ...shared, targets: { urls: release2 } }));

const { server, url } = await startDemoServer(Number(process.env.DEMO_PORT ?? 4310));
try {
  console.log('Release 1 → baseline');
  await cli(['test'], v1Config, `${url}/v1/`);
  await cli(['approve', '--all'], v1Config, `${url}/v1/`);
  console.log('Release 2 → compare');
  await cli(['test'], v2Config, `${url}/v2/`);
} finally {
  server.close();
}

await rm(OUT, { recursive: true, force: true });
await cp(join(WORK, 'runs', 'report'), OUT, { recursive: true });
console.log(`Report ready in ${OUT}`);
