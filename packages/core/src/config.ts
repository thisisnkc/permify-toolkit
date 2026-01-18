import type { SchemaHandle } from "./schema/define-schema.js";

export interface PermifyClientOptions {
  endpoint: string;
  cert?: string;
  insecure?: boolean;
  pk?: string;
  certChain?: string;
  metadata?: Record<string, string>;
}

export interface PermifyConfig {
  client: PermifyClientOptions;
  schema: SchemaHandle;
}

/**
 * Defines the configuration for the Permify Toolkit.
 */
export function defineConfig(config: PermifyConfig): PermifyConfig {
  return config;
}

/**
 * Validates the Permify configuration.
 */
export function validateConfig(config: PermifyConfig): void {
  if (typeof config !== "object" || config === null) {
    throw new TypeError("Configuration must be an object");
  }

  if (config.client) {
    if (typeof config.client.endpoint !== "string") {
      throw new TypeError("Client endpoint must be a string");
    }
  }

  if (config.schema) {
    if (typeof config.schema.ast !== "object") {
      throw new TypeError("Invalid schema: missing AST");
    }
    if (typeof config.schema.compile !== "function") {
      throw new TypeError("Invalid schema: missing compile method");
    }
  }
}
