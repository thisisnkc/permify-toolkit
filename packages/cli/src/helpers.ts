import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";
import {
  validateConfig,
  type Config,
  type SchemaHandle
} from "@permify-toolkit/core";

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

/**
 * Loads schema from config, handling both AST-based and file-based schemas.
 *
 * @param schema - Either a SchemaHandle or a file path string
 * @returns The compiled Permify DSL string
 */
export function loadSchemaFromConfig(schema: SchemaHandle | string): string {
  if (typeof schema === "object" && "compile" in schema) {
    return schema.compile();
  }

  if (typeof schema === "string") {
    const fullPath = path.resolve(schema);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Schema file not found: ${fullPath}`);
    }

    if (!fullPath.endsWith(".perm")) {
      throw new Error(`Schema file must end with .perm extension: ${fullPath}`);
    }

    try {
      return fs.readFileSync(fullPath, "utf-8");
    } catch (err: any) {
      throw new Error(`Failed to read schema file: ${err.message}`);
    }
  }

  throw new Error("Schema must be either a SchemaHandle or a file path string");
}
