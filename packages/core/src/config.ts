import * as fs from "node:fs";

import type { PermifyClientOptions } from "./client/index.js";
import type { SchemaHandle } from "./schema/define-schema.js";

/**
 * Modes for seeding relationships into Permify.
 */
export enum SeedingMode {
  /** Add new relationships without removing existing ones. */
  APPEND = "append",
  /** Wipe existing relationships before seeding new ones. */
  REPLACE = "replace"
}

/**
 * Configuration options for the Permify Toolkit.
 *
 * This object defines how the toolkit connects to Permify, which tenant
 * to use, and how to handle the schema and relationship seeding.
 */
export interface PermifyConfigOptions {
  /**
   * The default Permify tenant ID for all operations.
   *
   * If omitted, some operations may require an explicit `tenantId` parameter.
   */
  tenant?: string;

  /** Connection settings for the Permify gRPC client. */
  client: PermifyClientOptions;

  /**
   * The authorization schema.
   *
   * Can be a {@link SchemaHandle} (returned by {@link schema}) or a
   * string path to a `.perm` file.
   */
  schema: SchemaHandle | string;

  /** Configuration for relationship seeding. */
  relationships?: {
    /** Path to a YAML or JSON file containing relationship tuples. */
    seedFile?: string;
    /** Whether to append or replace relationships when seeding (defaults to `APPEND`). */
    mode?: SeedingMode | "append" | "replace";
  };
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
 * Defines and validates the configuration for the Permify Toolkit.
 *
 * This is a type-safe helper that returns the config object as-is.
 * Use it in your `permify.config.ts` file.
 *
 * @param config - The configuration options.
 * @returns The configuration object.
 *
 * @example
 * ```typescript
 * export default defineConfig({
 *   tenant: 'default',
 *   client: { endpoint: 'localhost:3478' },
 *   schema: schemaFile('./schema.perm'),
 * });
 * ```
 */
export function defineConfig(
  config: PermifyConfigOptions
): PermifyConfigOptions {
  return config;
}

/**
 * Validates a Permify configuration object.
 *
 * Checks for required fields, correct types, and ensures that
 * schema files exist on disk.
 *
 * @param config - The configuration to validate.
 * @throws {TypeError | Error} If the configuration is invalid.
 */
export function validateConfig(config: PermifyConfigOptions): void {
  if (typeof config !== "object" || config === null) {
    throw new TypeError("Configuration must be an object");
  }

  if (!config.client || typeof config.client.endpoint !== "string") {
    throw new TypeError("Client endpoint must be a string");
  }

  if (config.tenant !== undefined) {
    if (typeof config.tenant !== "string" || config.tenant.trim() === "") {
      throw new TypeError("Tenant must be a non-empty string");
    }
  }

  if (!config.schema) {
    throw new TypeError("Schema must be provided");
  }

  validateSchema(config.schema);

  if (config.relationships) {
    if (
      config.relationships.seedFile !== undefined &&
      typeof config.relationships.seedFile !== "string"
    ) {
      throw new TypeError("Relationships seedFile must be a string");
    }
    if (
      config.relationships.mode !== undefined &&
      !Object.values(SeedingMode).includes(
        config.relationships.mode as SeedingMode
      )
    ) {
      throw new TypeError(
        `Relationships mode must be one of: ${Object.values(SeedingMode).join(", ")}`
      );
    }
  }
}

/**
 * Validates the Permify schema.
 */
function validateSchema(schema: SchemaHandle | string): void {
  if (typeof schema === "string") {
    if (!fs.existsSync(schema)) {
      throw new Error(`Schema file not found: ${schema}`);
    }
    if (!schema.endsWith(".perm")) {
      throw new Error(`Schema file must have a .perm extension: ${schema}`);
    }
    const stats = fs.statSync(schema);
    if (stats.size === 0) {
      throw new Error(`Schema file cannot be empty: ${schema}`);
    }
  } else if (typeof schema === "object") {
    if (typeof schema.ast !== "object") {
      throw new TypeError("Invalid schema: missing AST");
    }
    if (typeof schema.compile !== "function") {
      throw new TypeError("Invalid schema: missing compile method");
    }
  }
}
