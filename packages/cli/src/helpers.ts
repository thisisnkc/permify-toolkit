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

/**
 * Validates schema content without pushing to Permify.
 *
 * - SchemaHandle: calls .validate() for semantic checks (entity refs, permissions).
 *   Note: in real usage the schema() factory already validated at construction time;
 *   this call is a no-op for correctly built schemas but is the hook for future checks.
 * - string (compiled .perm content): checks structural basics —
 *   non-empty (note: loadConfig already catches empty files) and presence of entity blocks.
 *
 * @throws {Error} with a descriptive message on the first failure found
 */
export function validateSchemaContent(schema: SchemaHandle | string): void {
  if (typeof schema === "object" && "compile" in schema && "validate" in schema) {
    (schema as SchemaHandle).validate();
    return;
  }

  if (typeof schema === "string") {
    const content = schema.trim();
    if (!content) {
      throw new Error("Schema file is empty");
    }
    if (!/entity\s+\w+\s*\{/.test(content)) {
      throw new Error(
        'Schema file contains no entity definitions. Expected at least one "entity NAME { ... }" block.'
      );
    }
    return;
  }

  // TypeScript exhaustiveness guard — should never be reached
  throw new Error("Schema must be a SchemaHandle or a compiled DSL string");
}
