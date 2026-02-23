import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";

import { validateConfig } from "./config.js";
import type { PermifyConfigOptions } from "./config.js";

const DEFAULT_CONFIG_FILE = "permify.config.ts";

/**
 * Loads a `.env` file from the given directory into `process.env`.
 * Only sets variables that are not already defined so explicit env vars win.
 * This is a lightweight helper to avoid an external `dotenv` dependency.
 */
function loadEnvFile(dir: string): void {
  const envPath = path.join(dir, ".env");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Strip surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Don't overwrite existing env vars
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

/**
 * Loads and validates the Permify configuration file.
 *
 * This function searches for `permify.config.ts` in the current directory
 * (or uses the provided path), loads any local `.env` file, and returns
 * a validated configuration object.
 *
 * @param configFilePath - Path to the config file (defaults to `permify.config.ts` in CWD).
 * @returns A promise that resolves to the validated configuration.
 * @throws {Error} If the config file is missing or contains validation errors.
 *
 * @example
 * ```typescript
 * const config = await loadConfig();
 * const configCustom = await loadConfig('./configs/permify.ts');
 * ```
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

  // Load .env from the config file's directory so that helpers like
  // `clientOptionsFromEnv()` can read env vars inside the config file.
  loadEnvFile(path.dirname(configPath));

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
