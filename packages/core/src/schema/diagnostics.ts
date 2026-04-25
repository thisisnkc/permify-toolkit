import type { SchemaAST } from "./ast.js";
import {
  parseSchemaWithDiagnostics,
  type SchemaDiagnostic
} from "./parse-schema.js";
import {
  collectSchemaValidationDiagnostics,
  collectSchemaWarningDiagnostics
} from "./validate.js";

export type { SchemaDiagnostic, ParseSchemaResult } from "./parse-schema.js";

export function getSchemaDiagnostics(
  input: string | SchemaAST
): SchemaDiagnostic[] {
  if (typeof input === "string") {
    const parsed = parseSchemaWithDiagnostics(input);

    return [
      ...parsed.diagnostics,
      ...collectSchemaValidationDiagnostics(parsed.ast),
      ...collectSchemaWarningDiagnostics(parsed.ast)
    ];
  }

  return [
    ...collectSchemaValidationDiagnostics(input),
    ...collectSchemaWarningDiagnostics(input)
  ];
}

export function getDiagnostics(input: string | SchemaAST): SchemaDiagnostic[] {
  return getSchemaDiagnostics(input);
}
