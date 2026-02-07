import { resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const execAsync = promisify(exec);
const __dirname = fileURLToPath(new URL(".", import.meta.url));

export const stripAnsi = (str: string) =>
  str.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001B\u009B][#();?[]*(?:\d{1,4}(?:;\d{0,4})*)?[\d<=>A-ORZcf-nqry]/g,
    ""
  );

export function runCli(args: string, options: any = {}) {
  const cliPath = resolve(__dirname, "../bin/permify-toolkit");
  return execAsync(`npx tsx ${cliPath} ${args}`, {
    ...options,
    env: { ...process.env, FORCE_COLOR: "0", ...options.env }
  });
}
