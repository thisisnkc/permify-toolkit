import type { SchemaAST } from "./ast.js";
import {
  parseSchemaWithDiagnostics,
  type SchemaDiagnostic
} from "./parse-schema.js";
import {
  collectSchemaValidationDiagnostics,
  getSchemaWarnings
} from "./validate.js";

export type { SchemaDiagnostic, ParseSchemaResult } from "./parse-schema.js";

export function getSchemaDiagnostics(
  input: string | SchemaAST
): SchemaDiagnostic[] {
  if (typeof input === "string") {
    const parsed = parseSchemaWithDiagnostics(input);
    const hasParseErrors = parsed.diagnostics.some(
      (diagnostic) => diagnostic.severity === "error"
    );

    if (hasParseErrors) {
      return parsed.diagnostics;
    }

    return [
      ...parsed.diagnostics,
      ...collectSchemaValidationDiagnostics(parsed.ast),
      ...getSchemaWarnings(parsed.ast).map((message) => ({
        code: "schema-warning",
        message,
        severity: "warning" as const
      }))
    ];
  }

  return [
    ...collectSchemaValidationDiagnostics(input),
    ...getSchemaWarnings(input).map((message) => ({
      code: "schema-warning",
      message,
      severity: "warning" as const
    }))
  ];
}

export function getDiagnostics(input: string | SchemaAST): SchemaDiagnostic[] {
  return getSchemaDiagnostics(input);
}
