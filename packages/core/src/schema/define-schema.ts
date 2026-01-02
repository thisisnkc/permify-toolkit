import { validateSchema } from "./validate";
import { compileToPermify } from "./compiler";
import type { SchemaAST, RelationNode, PermissionNode } from "./ast";

/**
 * Public input type (user-facing)
 */
export type DefineSchemaInput = {
  entities: Record<
    string,
    {
      relations?: Record<string, string>;
      permissions?: Record<string, string>;
    }
  >;
};

export function defineSchema(input: DefineSchemaInput) {
  const ast = buildAST(input);

  validateSchema(ast);

  return createSchemaHandle(ast);
}

/**
 * ---------- Internal helpers ----------
 */

function buildAST(input: DefineSchemaInput): SchemaAST {
  const entities: SchemaAST["entities"] = {};

  for (const [entityName, entityDef] of Object.entries(input.entities)) {
    entities[entityName] = {
      name: entityName,
      relations: mapRelations(entityDef.relations ?? {}),
      permissions: mapPermissions(entityDef.permissions ?? {})
    };
  }

  return { entities };
}

function mapRelations(
  relations: Record<string, string>
): Record<string, RelationNode> {
  const result: Record<string, RelationNode> = {};

  for (const [name, target] of Object.entries(relations)) {
    result[name] = {
      name,
      target
    };
  }

  return result;
}

function mapPermissions(
  permissions: Record<string, string>
): Record<string, PermissionNode> {
  const result: Record<string, PermissionNode> = {};

  for (const [name, expression] of Object.entries(permissions)) {
    result[name] = {
      name,
      expression
    };
  }

  return result;
}

function createSchemaHandle(ast: SchemaAST) {
  return {
    ast,
    validate: () => validateSchema(ast),
    toPermifySchema: () => compileToPermify(ast),
    permissions: buildPermissionProxy(ast)
  };
}

/**
 * Placeholder – we will implement this next
 */
function buildPermissionProxy(_ast: SchemaAST) {
  return {};
}
