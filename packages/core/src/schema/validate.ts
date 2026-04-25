import type { SchemaDiagnostic } from "./parse-schema.js";
import type { PermissionNode, SchemaAST, SourceRange } from "./ast.js";

/**
 * Validates schema integrity.
 * Ensures all entity references, relations, and permissions are well-formed,
 * and that no permission cycles exist.
 *
 * @param ast - Schema AST to validate
 * @throws {Error} If validation fails with descriptive message
 */
export function validateSchema(ast: SchemaAST): void {
  const diagnostics = collectSchemaValidationDiagnostics(ast);
  const firstError = diagnostics.find(
    (diagnostic) => diagnostic.severity === "error"
  );

  if (firstError) {
    throw new Error(firstError.message);
  }
}

export function collectSchemaValidationDiagnostics(
  ast: SchemaAST
): SchemaDiagnostic[] {
  const diagnostics: SchemaDiagnostic[] = [];

  if (Object.keys(ast.entities).length === 0) {
    diagnostics.push({
      code: "empty-schema",
      message: "Schema must define at least one entity",
      severity: "error"
    });
    return diagnostics;
  }

  for (const entity of Object.values(ast.entities)) {
    validateEntityRelations(ast, entity, diagnostics);
    validateEntityPermissions(ast, entity, diagnostics);
    detectEntityPermissionCycles(entity, diagnostics);
  }

  return diagnostics;
}

/**
 * Returns non-blocking warnings about schema quality.
 * Does not throw — callers should surface these to the user.
 */
export function getSchemaWarnings(ast: SchemaAST): string[] {
  return collectSchemaWarningDiagnostics(ast).map(
    (diagnostic) => diagnostic.message
  );
}

export function collectSchemaWarningDiagnostics(
  ast: SchemaAST
): SchemaDiagnostic[] {
  if (!ast?.entities) return [];

  const warnings: SchemaDiagnostic[] = [];
  const usedRelations = new Set<string>(); // "entityName.relationName"

  for (const entity of Object.values(ast.entities)) {
    for (const perm of Object.values(entity.permissions)) {
      for (const id of extractIdentifiers(perm.expression)) {
        const [head] = id.split(".");
        if (entity.relations[head] !== undefined) {
          usedRelations.add(`${entity.name}.${head}`);
        }
      }
    }
  }

  // Collect entity names used as relation targets (they are legitimate bare entities)
  const referencedAsTarget = new Set<string>();
  for (const entity of Object.values(ast.entities)) {
    for (const relation of Object.values(entity.relations)) {
      for (const target of relation.target) {
        referencedAsTarget.add(target.split("#")[0]);
      }
    }
  }

  for (const entity of Object.values(ast.entities)) {
    const hasRelations = Object.keys(entity.relations).length > 0;
    const hasPermissions = Object.keys(entity.permissions).length > 0;

    if (
      !hasRelations &&
      !hasPermissions &&
      !referencedAsTarget.has(entity.name)
    ) {
      warnings.push({
        code: "empty-unreferenced-entity",
        message: `Entity "${entity.name}": is empty and not referenced by any other entity`,
        severity: "warning",
        location: entity.nameLocation ?? entity.location
      });
    } else if (hasRelations && !hasPermissions) {
      warnings.push({
        code: "entity-without-permissions",
        message: `Entity "${entity.name}": has no permissions defined`,
        severity: "warning",
        location: entity.nameLocation ?? entity.location
      });
    }

    for (const relation of Object.values(entity.relations)) {
      if (!usedRelations.has(`${entity.name}.${relation.name}`)) {
        warnings.push({
          code: "unused-relation",
          message: `Entity "${entity.name}": relation "${relation.name}" is never used in any permission`,
          severity: "warning",
          location: relation.nameLocation ?? relation.location
        });
      }
    }
  }

  return warnings;
}

/**
 * Validates that all relation targets reference existing entities.
 */
function validateEntityRelations(
  ast: SchemaAST,
  entity: SchemaAST["entities"][string],
  diagnostics: SchemaDiagnostic[]
): void {
  for (const relation of Object.values(entity.relations)) {
    for (const [index, target] of relation.target.entries()) {
      // Strip scoped relation suffix (e.g. "org#member" → "org")
      const entityName = target.split("#")[0];
      if (!ast.entities[entityName]) {
        diagnostics.push({
          code: "undefined-entity",
          message: `Entity "${entityName}" referenced in relation "${entity.name}.${relation.name}" does not exist`,
          severity: "error",
          location: relation.targetLocations?.[index] ?? relation.nameLocation
        });
      }
    }
  }
}

/**
 * Validates that all permission expressions reference valid relations/permissions.
 */
function validateEntityPermissions(
  ast: SchemaAST,
  entity: SchemaAST["entities"][string],
  diagnostics: SchemaDiagnostic[]
): void {
  for (const permission of Object.values(entity.permissions)) {
    validatePermissionExpression(ast, entity, permission, diagnostics);
  }
}

/**
 * Validates a single permission expression.
 * Handles:
 * - Direct references: `member`
 * - Nested references: `parent.view`
 * - Operators: `and`, `or`
 * - Parentheses: `(owner or editor)`
 */
function validatePermissionExpression(
  ast: SchemaAST,
  entity: SchemaAST["entities"][string],
  permission: SchemaAST["entities"][string]["permissions"][string],
  diagnostics: SchemaDiagnostic[]
): void {
  if (!permission.expression.trim()) {
    diagnostics.push({
      code: "empty-permission-expression",
      message: `Permission "${entity.name}.${permission.name}" has an empty expression`,
      severity: "error",
      location: permission.expressionLocation ?? permission.nameLocation
    });
    return;
  }

  validateExpressionTokenOrder(
    permission.expression,
    `${entity.name}.${permission.name}`,
    permission,
    diagnostics
  );

  const identifiers = extractIdentifierTokens(permission);

  for (const identifier of identifiers) {
    if (identifier.value.includes(".")) {
      validateNestedReference(ast, entity, permission, identifier, diagnostics);
    } else {
      validateLocalReference(entity, permission, identifier, diagnostics);
    }
  }
}

/**
 * Validates that no two identifiers appear adjacent without an operator between them.
 * Catches expressions like `viewer owner` (missing `or` / `and`).
 */
function validateExpressionTokenOrder(
  expr: string,
  context: string,
  permission: PermissionNode,
  diagnostics: SchemaDiagnostic[]
): void {
  const operators = new Set(["and", "or", "not"]);
  const tokens = expr
    .trim()
    .split(/[\s()]+/)
    .filter(Boolean);

  for (let i = 0; i < tokens.length - 1; i++) {
    const curr = tokens[i];
    const next = tokens[i + 1];

    if (!operators.has(curr) && !operators.has(next)) {
      diagnostics.push({
        code: "missing-operator",
        message: `Permission "${context}" has invalid expression: missing operator between "${curr}" and "${next}"`,
        severity: "error",
        location: permission.expressionLocation ?? permission.nameLocation
      });
      return;
    }
  }
}

/**
 * Extracts identifiers from permission expression.
 * Removes operators (and, or, not) and structural characters.
 */
function extractIdentifiers(expression: string): string[] {
  return extractIdentifierTokens({ name: "", expression }).map(
    (token) => token.value
  );
}

function extractIdentifierTokens(permission: PermissionNode): Array<{
  value: string;
  location?: SourceRange;
}> {
  const tokens: Array<{ value: string; location?: SourceRange }> = [];
  const pattern = /[A-Z_a-z]\w*(?:\.[A-Z_a-z]\w*)?/g;

  for (const match of permission.expression.matchAll(pattern)) {
    const value = match[0];
    if (value === "and" || value === "or" || value === "not") {
      continue;
    }

    tokens.push({
      value,
      location: permission.expressionLocation
        ? offsetRange(
            permission.expressionLocation,
            match.index ?? 0,
            value.length
          )
        : undefined
    });
  }

  return tokens;
}

/**
 * Validates nested permission reference (e.g., `parent.view`).
 */
function validateNestedReference(
  ast: SchemaAST,
  entity: SchemaAST["entities"][string],
  permission: SchemaAST["entities"][string]["permissions"][string],
  reference: { value: string; location?: SourceRange },
  diagnostics: SchemaDiagnostic[]
): void {
  const [relationName, targetPermName] = reference.value.split(".");

  const relation = entity.relations[relationName];
  if (!relation) {
    diagnostics.push({
      code: "undefined-relation",
      message: `Permission "${entity.name}.${permission.name}" references undefined relation "${relationName}"`,
      severity: "error",
      location: reference.location ?? permission.expressionLocation
    });
    return;
  }

  for (const targetEntityName of relation.target) {
    const resolvedName = targetEntityName.split("#")[0];
    const targetEntity = ast.entities[resolvedName];

    if (!targetEntity) {
      continue;
    }

    const hasPermission =
      targetEntity.permissions[targetPermName] !== undefined;
    const hasRelation = targetEntity.relations[targetPermName] !== undefined;

    if (!hasPermission && !hasRelation) {
      diagnostics.push({
        code: "undefined-nested-reference",
        message: `Permission "${entity.name}.${permission.name}" references undefined permission or relation "${targetPermName}" on entity "${resolvedName}"`,
        severity: "error",
        location: reference.location ?? permission.expressionLocation
      });
      return;
    }
  }
}

/**
 * Validates local reference (direct relation or permission).
 */
function validateLocalReference(
  entity: SchemaAST["entities"][string],
  permission: SchemaAST["entities"][string]["permissions"][string],
  reference: { value: string; location?: SourceRange },
  diagnostics: SchemaDiagnostic[]
): void {
  const hasRelation = entity.relations[reference.value] !== undefined;
  const hasPermission = entity.permissions[reference.value] !== undefined;

  if (!hasRelation && !hasPermission) {
    diagnostics.push({
      code: "undefined-reference",
      message: `Permission "${entity.name}.${permission.name}" references undefined relation or permission "${reference.value}"`,
      severity: "error",
      location: reference.location ?? permission.expressionLocation
    });
  }
}

/**
 * Detects permission cycles within a single entity using DFS.
 * Throws if a direct or indirect cycle is found.
 */
function detectEntityPermissionCycles(
  entity: SchemaAST["entities"][string],
  diagnostics: SchemaDiagnostic[]
): void {
  const permissionNames = new Set(Object.keys(entity.permissions));

  // Build adjacency: permission → local permissions it references
  const graph: Record<string, string[]> = {};
  for (const perm of Object.values(entity.permissions)) {
    graph[perm.name] = extractIdentifiers(perm.expression).filter(
      (id) => !id.includes(".") && permissionNames.has(id)
    );
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(node: string): void {
    visited.add(node);
    inStack.add(node);

    for (const neighbor of graph[node] ?? []) {
      if (inStack.has(neighbor)) {
        diagnostics.push({
          code: "permission-cycle",
          message: `Permission cycle detected in entity "${entity.name}": "${node}" → "${neighbor}"`,
          severity: "error",
          location:
            entity.permissions[node]?.nameLocation ??
            entity.permissions[node]?.location
        });
        return;
      }
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    }

    inStack.delete(node);
  }

  for (const permName of Object.keys(graph)) {
    if (!visited.has(permName)) {
      dfs(permName);
    }
  }
}

function offsetRange(
  base: SourceRange,
  startOffset: number,
  length: number
): SourceRange {
  return {
    start: {
      line: base.start.line,
      column: base.start.column + startOffset,
      offset: base.start.offset + startOffset
    },
    end: {
      line: base.start.line,
      column: base.start.column + startOffset + length,
      offset: base.start.offset + startOffset + length
    }
  };
}
