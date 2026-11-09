#!/usr/bin/env node
import { run } from './cli.js';

const code = await run(process.argv.slice(2), {
  stdout: (text) => process.stdout.write(text),
  stderr: (line) => process.stderr.write(`${line}\n`),
  env: process.env,
});
process.exitCode = code;
