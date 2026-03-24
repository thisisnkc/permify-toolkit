import type { SchemaAST } from "./ast.js";

/**
 * Validates schema integrity.
 * Ensures all entity references, relations, and permissions are well-formed,
 * and that no permission cycles exist.
 *
 * @param ast - Schema AST to validate
 * @throws {Error} If validation fails with descriptive message
 */
export function validateSchema(ast: SchemaAST): void {
  if (Object.keys(ast.entities).length === 0) {
    throw new Error("Schema must define at least one entity");
  }

  for (const entity of Object.values(ast.entities)) {
    validateEntityRelations(ast, entity);
    validateEntityPermissions(ast, entity);
    detectEntityPermissionCycles(entity);
  }
}

/**
 * Returns non-blocking warnings about schema quality.
 * Does not throw — callers should surface these to the user.
 */
export function getSchemaWarnings(ast: SchemaAST): string[] {
  if (!ast?.entities) return [];

  const warnings: string[] = [];
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
      warnings.push(
        `Entity "${entity.name}": is empty and not referenced by any other entity`
      );
    } else if (hasRelations && !hasPermissions) {
      warnings.push(`Entity "${entity.name}": has no permissions defined`);
    }

    for (const relation of Object.values(entity.relations)) {
      if (!usedRelations.has(`${entity.name}.${relation.name}`)) {
        warnings.push(
          `Entity "${entity.name}": relation "${relation.name}" is never used in any permission`
        );
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
  entity: SchemaAST["entities"][string]
): void {
  for (const relation of Object.values(entity.relations)) {
    for (const target of relation.target) {
      // Strip scoped relation suffix (e.g. "org#member" → "org")
      const entityName = target.split("#")[0];
      if (!ast.entities[entityName]) {
        throw new Error(
          `Entity "${entityName}" referenced in relation "${entity.name}.${relation.name}" does not exist`
        );
      }
    }
  }
}

/**
 * Validates that all permission expressions reference valid relations/permissions.
 */
function validateEntityPermissions(
  ast: SchemaAST,
  entity: SchemaAST["entities"][string]
): void {
  for (const permission of Object.values(entity.permissions)) {
    validatePermissionExpression(ast, entity, permission);
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
  permission: SchemaAST["entities"][string]["permissions"][string]
): void {
  if (!permission.expression.trim()) {
    throw new Error(
      `Permission "${entity.name}.${permission.name}" has an empty expression`
    );
  }

  validateExpressionTokenOrder(
    permission.expression,
    `${entity.name}.${permission.name}`
  );

  const identifiers = extractIdentifiers(permission.expression);

  for (const identifier of identifiers) {
    if (identifier.includes(".")) {
      validateNestedReference(ast, entity, permission, identifier);
    } else {
      validateLocalReference(entity, permission, identifier);
    }
  }
}

/**
 * Validates that no two identifiers appear adjacent without an operator between them.
 * Catches expressions like `viewer owner` (missing `or` / `and`).
 */
function validateExpressionTokenOrder(expr: string, context: string): void {
  const operators = new Set(["and", "or", "not"]);
  const tokens = expr
    .trim()
    .split(/[\s()]+/)
    .filter(Boolean);

  for (let i = 0; i < tokens.length - 1; i++) {
    const curr = tokens[i];
    const next = tokens[i + 1];

    if (!operators.has(curr) && !operators.has(next)) {
      throw new Error(
        `Permission "${context}" has invalid expression: missing operator between "${curr}" and "${next}"`
      );
    }
  }
}

/**
 * Extracts identifiers from permission expression.
 * Removes operators (and, or, not) and structural characters.
 */
function extractIdentifiers(expression: string): string[] {
  const parts = expression.split(/[\s()]+/).filter(Boolean);
  return parts.filter((part) => !["and", "or", "not"].includes(part));
}

/**
 * Validates nested permission reference (e.g., `parent.view`).
 */
function validateNestedReference(
  ast: SchemaAST,
  entity: SchemaAST["entities"][string],
  permission: SchemaAST["entities"][string]["permissions"][string],
  reference: string
): void {
  const [relationName, targetPermName] = reference.split(".");

  const relation = entity.relations[relationName];
  if (!relation) {
    throw new Error(
      `Permission "${entity.name}.${permission.name}" references undefined relation "${relationName}"`
    );
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
      throw new Error(
        `Permission "${entity.name}.${permission.name}" references undefined permission or relation "${targetPermName}" on entity "${resolvedName}"`
      );
    }
  }
}

/**
 * Validates local reference (direct relation or permission).
 */
function validateLocalReference(
  entity: SchemaAST["entities"][string],
  permission: SchemaAST["entities"][string]["permissions"][string],
  reference: string
): void {
  const hasRelation = entity.relations[reference] !== undefined;
  const hasPermission = entity.permissions[reference] !== undefined;

  if (!hasRelation && !hasPermission) {
    throw new Error(
      `Permission "${entity.name}.${permission.name}" references undefined relation or permission "${reference}"`
    );
  }
}

/**
 * Detects permission cycles within a single entity using DFS.
 * Throws if a direct or indirect cycle is found.
 */
function detectEntityPermissionCycles(
  entity: SchemaAST["entities"][string]
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
        throw new Error(
          `Permission cycle detected in entity "${entity.name}": "${node}" → "${neighbor}"`
        );
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
