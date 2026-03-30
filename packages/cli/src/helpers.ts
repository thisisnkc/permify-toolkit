import fs from "node:fs";
import path from "node:path";
import { Flags } from "@oclif/core";
import {
  loadConfig,
  getSchemaWarnings,
  type SchemaHandle,
  type Relationship
} from "@permify-toolkit/core";

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to read schema file: ${msg}`);
    }
  }

  throw new Error("Schema must be either a SchemaHandle or a file path string");
}

export interface ValidationResult {
  warnings: string[];
}

/**
 * Validates schema content without pushing to Permify.
 *
 * - SchemaHandle: calls .validate() for semantic checks, then collects warnings.
 * - string (compiled .perm content): checks structural basics and expression sanity.
 *
 * @returns ValidationResult containing any non-blocking warnings
 * @throws {Error} with a descriptive message on the first hard error found
 */
export function validateSchemaContent(
  schema: SchemaHandle | string
): ValidationResult {
  if (
    typeof schema === "object" &&
    "compile" in schema &&
    "validate" in schema
  ) {
    (schema as SchemaHandle).validate();
    const warnings = getSchemaWarnings((schema as SchemaHandle).ast);
    return { warnings };
  }

  if (typeof schema === "string") {
    const content = schema.trim();
    if (!content) {
      throw new Error("Schema file is empty");
    }
    if (!/entity\s+\w+\s*{/.test(content)) {
      throw new Error(
        'Schema file contains no entity definitions. Expected at least one "entity NAME { ... }" block.'
      );
    }
    validatePermExpressions(content);
    return { warnings: [] };
  }

  // TypeScript exhaustiveness guard — should never be reached
  throw new Error("Schema must be a SchemaHandle or a compiled DSL string");
}

/**
 * Shared filter flags for relationship query commands (list, export).
 * Spread these into your command's `static flags` alongside BaseCommand.baseFlags.
 */
export const relationshipFilterFlags = {
  "entity-type": Flags.string({
    char: "e",
    description: "Entity type to query",
    required: true as const
  }),
  "entity-id": Flags.string({
    aliases: ["eid"],
    description: "Filter by entity ID"
  }),
  relation: Flags.string({
    char: "r",
    description: "Filter by relation name"
  }),
  "subject-type": Flags.string({
    char: "s",
    description: "Filter by subject type"
  }),
  "subject-id": Flags.string({
    aliases: ["sid"],
    description: "Filter by subject ID"
  })
};

export function buildTupleFilter(flags: {
  "entity-type": string;
  "entity-id"?: string;
  relation?: string;
  "subject-type"?: string;
  "subject-id"?: string;
}) {
  return {
    entity: {
      type: flags["entity-type"],
      ids: flags["entity-id"] ? [flags["entity-id"]] : []
    },
    relation: flags.relation ?? "",
    subject: flags["subject-type"]
      ? {
          type: flags["subject-type"],
          ids: flags["subject-id"] ? [flags["subject-id"]] : [],
          relation: ""
        }
      : { type: "", ids: [], relation: "" }
  };
}

export function formatCompactTuple(r: Relationship): string {
  const subjectRelation = r.subject.relation ? `#${r.subject.relation}` : "";
  return `${r.entity.type}:${r.entity.id}#${r.relation}@${r.subject.type}:${r.subject.id}${subjectRelation}`;
}

/**
 * Runs lightweight sanity checks on permission expressions in a raw .perm file.
 * Catches obvious authoring mistakes without replicating full Permify parsing.
 *
 * @throws {Error} on the first malformed expression found
 */
function validatePermExpressions(content: string): void {
  // Detect permissions with empty expressions (nothing or only a comment after =)
  if (/^\s*permission\s+\w+\s*=\s*(?:\/\/.*)?$/m.test(content)) {
    throw new Error("Schema has a permission with an empty expression");
  }

  const permRegex = /permission\s+\w+\s*=\s*(.+)/g;
  // Strip inline comments before analysing each expression
  const expressions = [...content.matchAll(permRegex)].map((m) =>
    m[1].replace(/\/\/.*$/, "").trim()
  );

  for (const expr of expressions) {
    // Double-dot traversal: parent..view
    if (/\.\./.test(expr)) {
      throw new Error(
        `Invalid permission expression: double-dot traversal found in "${expr}"`
      );
    }

    // Dangling operator at end: "owner or", "owner and"
    if (/\b(?:or|and|not)\s*$/.test(expr)) {
      throw new Error(
        `Invalid permission expression: dangling operator at end of "${expr}"`
      );
    }

    // Leading binary operator: "or owner", "and owner"
    if (/^\s*(?:or|and)\b/.test(expr)) {
      throw new Error(
        `Invalid permission expression: expression starts with binary operator in "${expr}"`
      );
    }

    // Two consecutive identifiers with no operator between them: "viewer owner"
    const operators = new Set(["and", "or", "not"]);
    const tokens = expr
      .trim()
      .split(/[\s()]+/)
      .filter(Boolean);
    for (let i = 0; i < tokens.length - 1; i++) {
      if (!operators.has(tokens[i]) && !operators.has(tokens[i + 1])) {
        throw new Error(
          `Invalid permission expression: missing operator between "${tokens[i]}" and "${tokens[i + 1]}" in "${expr}"`
        );
      }
    }

    // Unbalanced parentheses
    let depth = 0;
    for (const ch of expr) {
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      if (depth < 0) {
        throw new Error(
          `Invalid permission expression: unbalanced parentheses in "${expr}"`
        );
      }
    }
    if (depth !== 0) {
      throw new Error(
        `Invalid permission expression: unbalanced parentheses in "${expr}"`
      );
    }
  }
}
