import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";

import { validateConfig } from "./config.js";
import type { PermifyConfigOptions } from "./config.js";

const DEFAULT_CONFIG_FILE = "permify.config.ts";

/**
 * Loads the Permify configuration file.
 *
 * @param configFilePath - Optional path to the config file. Defaults to `permify.config.ts` in CWD.
 * @returns The validated Permify configuration.
 */
export async function loadConfig(
  configFilePath?: string
): Promise<PermifyConfigOptions> {
  const cwd = process.cwd();
  const configPath = configFilePath
    ? path.resolve(configFilePath)
    : path.join(cwd, DEFAULT_CONFIG_FILE);

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Config file not found: ${configPath}. Please create ${DEFAULT_CONFIG_FILE}`
    );
  }

  const jiti = createJiti(path.dirname(configPath), {
    fsCache: false,
    moduleCache: false
  });

  const mod = (await jiti.import(configPath, { default: true })) as any;
  const config = mod.default || mod;

  try {
    validateConfig(config as PermifyConfigOptions);
  } catch (err: any) {
    throw new Error(
      `Invalid configuration in ${path.basename(configPath)}: ${err.message}`
    );
  }

  return config as PermifyConfigOptions;
}
