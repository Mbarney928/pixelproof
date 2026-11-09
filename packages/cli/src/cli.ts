import { access, writeFile } from 'node:fs/promises';

import { Command, CommanderError, Option } from 'commander';

import { approve } from './approve.js';
import { capture } from './capture.js';
import { compareRun, exitCodeFor } from './compare.js';
import { loadConfig, STARTER_CONFIG, type Config } from './config.js';
import { UserError } from './errors.js';
import { createLogger, type LogFormat, type LogLevel, type Logger } from './logger.js';
import { resolveJobs, type FetchJson } from './targets.js';
import { VERSION } from './version.js';

export interface CliIo {
  stdout: (text: string) => void;
  stderr: (line: string) => void;
  env: Record<string, string | undefined>;
  fetchJson?: FetchJson;
}

interface GlobalOptions {
  config: string;
  logFormat: LogFormat;
  logLevel: LogLevel;
  json: boolean;
}

/** Exit codes: 0 passed, 1 visual changes need review, 2 usage or runtime error. */
export async function run(argv: readonly string[], io: CliIo): Promise<number> {
  let exitCode = 0;
  const program = new Command()
    .name('pixelproof')
    .description('Visual regression testing for Storybook stories and pages.')
    .version(VERSION)
    .option('-c, --config <path>', 'config file', 'pixelproof.config.json')
    .addOption(
      new Option('--log-format <format>', 'log output').choices(['pretty', 'json']).default('pretty'),
    )
    .addOption(
      new Option('--log-level <level>', 'minimum log level')
        .choices(['debug', 'info', 'warn', 'error'])
        .default('info'),
    )
    .option('--json', 'print a machine-readable summary on stdout', false)
    .exitOverride()
    .configureOutput({
      writeOut: io.stdout,
      writeErr: (s) => {
        io.stderr(s.trimEnd());
      },
    });

  const setup = async (cmd: Command): Promise<{ config: Config; logger: Logger; opts: GlobalOptions }> => {
    const opts = cmd.optsWithGlobals<GlobalOptions>();
    const logger = createLogger({ level: opts.logLevel, format: opts.logFormat, write: io.stderr });
    const config = await loadConfig(opts.config, {
      PIXELPROOF_BASE_URL: io.env.PIXELPROOF_BASE_URL,
      PIXELPROOF_DIR: io.env.PIXELPROOF_DIR,
      PIXELPROOF_CONCURRENCY: io.env.PIXELPROOF_CONCURRENCY,
    });
    return { config, logger, opts };
  };

  const doCapture = async (config: Config, logger: Logger) => {
    const jobs = await resolveJobs(config, io.fetchJson);
    logger.info('Capturing', {
      snapshots: jobs.length,
      viewports: config.viewports.length,
      themes: config.themes.join(','),
    });
    return capture(config, jobs, { logger });
  };

  const doCompare = async (config: Config, logger: Logger, opts: GlobalOptions) => {
    const report = await compareRun(config, { logger });
    if (opts.json) io.stdout(`${JSON.stringify({ runId: report.runId, summary: report.summary })}\n`);
    exitCode = exitCodeFor(report, config.failOn);
    if (exitCode === 1) logger.warn('Visual changes need review', { failOn: config.failOn });
  };

  program
    .command('init')
    .description('write a starter pixelproof.config.json')
    .action(async (_o, cmd: Command) => {
      const { config: path } = cmd.optsWithGlobals<GlobalOptions>();
      try {
        await access(path);
        throw new UserError(`${path} already exists`);
      } catch (error) {
        if (error instanceof UserError) throw error;
      }
      await writeFile(path, `${JSON.stringify(STARTER_CONFIG, null, 2)}\n`);
      io.stderr(`› Wrote ${path}`);
    });

  program
    .command('capture')
    .description('screenshot every target into <dir>/current')
    .action(async (_o, cmd: Command) => {
      const { config, logger } = await setup(cmd);
      await doCapture(config, logger);
    });

  program
    .command('compare')
    .description('diff <dir>/current against the baseline and write <dir>/report')
    .action(async (_o, cmd: Command) => {
      const { config, logger, opts } = await setup(cmd);
      await doCompare(config, logger, opts);
    });

  program
    .command('test')
    .description('capture, then compare (what CI runs)')
    .action(async (_o, cmd: Command) => {
      const { config, logger, opts } = await setup(cmd);
      await doCapture(config, logger);
      await doCompare(config, logger, opts);
    });

  program
    .command('approve')
    .description('promote reviewed snapshots to the baseline')
    .argument('[ids...]', 'snapshot ids to approve')
    .option('--all', 'approve every changed, new and removed snapshot')
    .option('--from <file>', 'apply an approvals.json exported from the review app')
    .action(async (ids: string[], o: { all?: boolean; from?: string }, cmd: Command) => {
      const { config, logger, opts } = await setup(cmd);
      const result = await approve(
        config,
        { ids, ...(o.all ? { all: true } : {}), ...(o.from ? { from: o.from } : {}) },
        { logger },
      );
      if (opts.json) io.stdout(`${JSON.stringify(result)}\n`);
    });

  try {
    await program.parseAsync(argv, { from: 'user' });
    return exitCode;
  } catch (error) {
    if (error instanceof CommanderError) return error.exitCode === 0 ? 0 : 2;
    const message =
      error instanceof UserError ? error.message : `Unexpected error: ${(error as Error).message}`;
    io.stderr(`✗ ${message}`);
    return 2;
  }
}
