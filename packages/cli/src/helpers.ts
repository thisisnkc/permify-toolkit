import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";
import { validateConfig, type Config } from "@permify-toolkit/core";

const CONFIG_FILE = "permify.config.ts";

/**
 * Loads the Permify configuration file from the current working directory.
 */
export async function loadConfig(): Promise<Config> {
  const cwd = process.cwd();
  const configPath = path.join(cwd, CONFIG_FILE);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found. Please create ${CONFIG_FILE}`);
  }

  const jiti = createJiti(cwd);

  // jiti interop: handle default export
  const mod = (await jiti.import(configPath, { default: true })) as any;
  const config = mod.default || mod;

  try {
    validateConfig(config as Config);
  } catch (err: any) {
    throw new Error(
      `Invalid configuration in ${path.basename(configPath)}: ${err.message}`
    );
  }

  return config as Config;
}
