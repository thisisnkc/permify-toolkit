import type { SchemaAST } from "./ast.js";

/**
 * Validates schema integrity.
 * Ensures all entity references, relations, and permissions are well-formed.
 *
 * @param ast - Schema AST to validate
 * @throws {Error} If validation fails with descriptive message
 */
export function validateSchema(ast: SchemaAST): void {
  for (const entity of Object.values(ast.entities)) {
    validateEntityRelations(ast, entity);
    validateEntityPermissions(ast, entity);
  }
}

/**
 * Validates that all relation targets reference existing entities.
 */
function validateEntityRelations(
  ast: SchemaAST,
  entity: SchemaAST["entities"][string]
): void {
  for (const relation of Object.values(entity.relations)) {
    // Relations now have `targets` array, not single `target`
    for (const target of relation.target) {
      if (!ast.entities[target]) {
        throw new Error(
          `Entity "${target}" referenced in relation "${entity.name}.${relation.name}" does not exist`
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
  for (const permission of Object.values(entity.permission)) {
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
  permission: SchemaAST["entities"][string]["permission"][string]
): void {
  // Extract identifiers from expression (split by operators, parens, whitespace)
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
 * Extracts identifiers from permission expression.
 * Removes operators (and, or) and structural characters.
 */
function extractIdentifiers(expression: string): string[] {
  // Split by whitespace, parens, and filter out operators
  const parts = expression.split(/[\s()]+/).filter(Boolean);
  return parts.filter((part) => !["and", "or", "not"].includes(part));
}

/**
 * Validates nested permission reference (e.g., `parent.view`).
 */
function validateNestedReference(
  ast: SchemaAST,
  entity: SchemaAST["entities"][string],
  permission: SchemaAST["entities"][string]["permission"][string],
  reference: string
): void {
  const [relationName, targetPermName] = reference.split(".");

  // Check relation exists locally
  const relation = entity.relations[relationName];
  if (!relation) {
    throw new Error(
      `Permission "${entity.name}.${permission.name}" references undefined relation "${relationName}"`
    );
  }

  // Check all targets have the referenced permission
  for (const targetEntityName of relation.target) {
    const targetEntity = ast.entities[targetEntityName];

    if (!targetEntity) {
      // Should never happen if relations validated first
      continue;
    }

    const hasPermission = targetEntity.permission[targetPermName] !== undefined;
    const hasRelation = targetEntity.relations[targetPermName] !== undefined;

    if (!hasPermission && !hasRelation) {
      throw new Error(
        `Permission "${entity.name}.${permission.name}" references undefined permission or relation "${targetPermName}" on entity "${targetEntityName}"`
      );
    }
  }
}

/**
 * Validates local reference (direct relation or permission).
 */
function validateLocalReference(
  entity: SchemaAST["entities"][string],
  permission: SchemaAST["entities"][string]["permission"][string],
  reference: string
): void {
  const hasRelation = entity.relations[reference] !== undefined;
  const hasPermission = entity.permission[reference] !== undefined;

  if (!hasRelation && !hasPermission) {
    throw new Error(
      `Permission "${entity.name}.${permission.name}" references undefined relation or permission "${reference}"`
    );
  }
}
