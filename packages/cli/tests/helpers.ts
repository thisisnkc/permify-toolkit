import type { Command } from "@oclif/core";

export const stripAnsi = (str: string) =>
  str.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001B\u009B][#();?[]*(?:\d{1,4}(?:;\d{0,4})*)?[\d<=>A-ORZcf-nqry]/g,
    ""
  );

/**
 * Run an oclif command class in-process (no child process spawning).
 * Temporarily changes cwd if `options.cwd` is specified.
 *
 * @throws The oclif error (CLIError / parse error) if the command fails.
 */
export async function runCommand(
  CommandClass: typeof Command,
  args: string[] = [],
  options?: { cwd?: string }
): Promise<unknown> {
  const originalCwd = process.cwd();

  if (options?.cwd) {
    process.chdir(options.cwd);
  }

  try {
    return await (CommandClass as any).run(args);
  } finally {
    // oclif's catch() sets process.exitCode = 1 on errors, which persists
    // after the error is caught by tests - reset it to avoid poisoning the runner
    process.exitCode = undefined;

    if (options?.cwd) {
      process.chdir(originalCwd);
    }
  }
}
