import type { SchemaHandle } from "./schema/define-schema.js";

export interface PermifyClientOptions {
  endpoint: string;
  cert?: string;
  insecure?: boolean;
  pk?: string;
  certChain?: string;
  metadata?: Record<string, string>;
}

export interface PermifyConfigOptions {
  client: PermifyClientOptions;
  schema: SchemaHandle | string;
}

/**
 * Helper function to specify a schema file path.
 * Returns the path as-is for use in configuration.
 *
 * @param path - Path to the .perm schema file
 * @returns The file path string
 *
 * @example
 * ```ts
 * defineConfig({
 *   client: { endpoint: "localhost:3478" },
 *   schema: schemaFile("./schema.perm")
 * })
 * ```
 */
export function schemaFile(path: string): string {
  return path;
}

/**
 * Defines the configuration for the Permify Toolkit.
 */
export function defineConfig(
  config: PermifyConfigOptions
): PermifyConfigOptions {
  return config;
}

/**
 * Validates the Permify configuration.
 */
export function validateConfig(config: PermifyConfigOptions): void {
  if (typeof config !== "object" || config === null) {
    throw new TypeError("Configuration must be an object");
  }

  if (!config.client || typeof config.client.endpoint !== "string") {
    throw new TypeError("Client endpoint must be a string");
  }

  if (!config.schema) {
    throw new TypeError("Schema must be provided");
  }

  if (typeof config.schema === "object") {
    if (typeof config.schema.ast !== "object") {
      throw new TypeError("Invalid schema: missing AST");
    }
    if (typeof config.schema.compile !== "function") {
      throw new TypeError("Invalid schema: missing compile method");
    }
  }
}
