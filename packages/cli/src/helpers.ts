import fs from "node:fs";
import path from "node:path";
import { loadConfig, type SchemaHandle } from "@permify-toolkit/core";

export { loadConfig };

/**
 * Validates the schema file path and returns the full path.
 *
 * @param schemaPath - The path to the schema file
 * @returns The full path to the schema file
 */
export function validateSchemaFile(schemaPath: string): string {
  const fullPath = path.resolve(schemaPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Schema file not found: ${fullPath}`);
  }

  if (!fullPath.endsWith(".perm")) {
    throw new Error(`Schema file must end with .perm extension: ${fullPath}`);
  }
  return fullPath;
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
    const fullPath = validateSchemaFile(schema);

    try {
      return fs.readFileSync(fullPath, "utf-8");
    } catch (err: any) {
      throw new Error(`Failed to read schema file: ${err.message}`);
    }
  }

  throw new Error("Schema must be either a SchemaHandle or a file path string");
}
