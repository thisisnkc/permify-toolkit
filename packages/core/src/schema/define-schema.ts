import { validateSchema } from "./validate.js";
import { compileToPermify } from "./compiler.js";
import type {
  SchemaAST,
  RelationNode,
  PermissionNode,
  AttributeNode
} from "./ast.js";

/**
 * User-facing schema definition input.
 * Maps entity names to their relations and permission.
 *
 * @example
 * ```ts
 * const schema = defineSchema({
 *   organization: {
 *     relations: {
 *       member: ['user']
 *     },
 *     permission: {
 *       view: 'member'
 *     }
 *   }
 * })
 * ```
 */
export interface DefineSchemaInput {
  [entityName: string]: {
    /** Relations define edges to other entities */
    relations?: Record<string, string[]>;
    /** Permissions define access rules using relation expressions */
    permission?: Record<string, string>;
    /** Attributes define typed properties on entities */
    attributes?: Record<string, string>;
  };
}

/**
 * Schema handle returned by defineSchema.
 * Provides methods to validate, compile, and access typed permissions.
 */
export interface SchemaHandle<
  TInput extends DefineSchemaInput = DefineSchemaInput
> {
  /** Raw AST representation */
  readonly ast: SchemaAST;
  /** Validate schema integrity */
  validate(): void;
  /** Compile to Permify DSL string */
  compile(): string;
  /** Type-safe permission string access */
  readonly permission: PermissionProxy<TInput>;
}

/**
 * Type-safe permission proxy.
 * Provides autocomplete for entity.permission -> "entity:permission"
 */
export type PermissionProxy<TInput extends DefineSchemaInput> = {
  [Entity in keyof TInput]: TInput[Entity] extends { permission: infer P }
    ? { [Permission in keyof P & string]: `${Entity & string}:${Permission}` }
    : Record<string, never>;
};

/**
 * Defines a Permify authorization schema.
 * Validates structure and provides typed permission access.
 *
 * @param input - Entity definitions with relations and permissions
 * @returns Schema handle with validation, compilation, and typed permissions
 * @throws {Error} If schema validation fails
 *
 * @example
 * ```ts
 * const schema = defineSchema({
 *   document: {
 *     relations: {
 *       owner: ['user']
 *     },
 *     permission: {
 *       view: 'owner'
 *     }
 *   },
 *   user: {}
 * })
 *
 * const dsl = schema.compile()
 * const perm = schema.permission.document.view // "document:view"
 * ```
 */
export function defineSchema<TInput extends DefineSchemaInput>(
  input: TInput
): SchemaHandle<TInput> {
  const ast = buildAST(input);
  validateSchema(ast);
  return createSchemaHandle(ast);
}

/**
 * Converts user input to internal AST representation.
 */
function buildAST(input: DefineSchemaInput): SchemaAST {
  const entities: SchemaAST["entities"] = {};

  for (const [entityName, entityDef] of Object.entries(input)) {
    entities[entityName] = {
      name: entityName,
      relations: buildRelationNodes(entityDef.relations ?? {}),
      permission: buildPermissionNodes(entityDef.permission ?? {}),
      attributes: buildAttributeNodes(entityDef.attributes ?? {})
    };
  }

  return { entities };
}

/**
 * Converts relation definitions to AST nodes.
 */
function buildRelationNodes(
  relations: Record<string, string[]>
): Record<string, RelationNode> {
  const nodes: Record<string, RelationNode> = {};

  for (const [name, target] of Object.entries(relations)) {
    nodes[name] = {
      name,
      target
    };
  }

  return nodes;
}

/**
 * Converts permission definitions to AST nodes.
 */
function buildPermissionNodes(
  permissions: Record<string, string>
): Record<string, PermissionNode> {
  const nodes: Record<string, PermissionNode> = {};

  for (const [name, expression] of Object.entries(permissions)) {
    nodes[name] = {
      name,
      expression
    };
  }

  return nodes;
}

/**
 * Converts attribute definitions to AST nodes.
 */
function buildAttributeNodes(
  attributes: Record<string, string>
): Record<string, AttributeNode> {
  const nodes: Record<string, AttributeNode> = {};

  for (const [name, type] of Object.entries(attributes)) {
    nodes[name] = {
      name,
      type
    };
  }

  return nodes;
}

/**
 * Creates the public schema handle with validation and compilation methods.
 */
function createSchemaHandle<TInput extends DefineSchemaInput>(
  ast: SchemaAST
): SchemaHandle<TInput> {
  return {
    ast,
    validate: () => validateSchema(ast),
    compile: () => compileToPermify(ast),
    permission: buildPermissionProxy<TInput>(ast)
  };
}

/**
 * Builds a runtime proxy for typed permission string access.
 * Returns empty object as typing provides the value.
 *
 * @example
 * schema.permission.document.view → "document:view" (typed)
 */
function buildPermissionProxy<TInput extends DefineSchemaInput>(
  ast: SchemaAST
): PermissionProxy<TInput> {
  const proxy: Record<string, Record<string, string>> = {};

  for (const [entityName, entity] of Object.entries(ast.entities)) {
    proxy[entityName] = {};

    for (const permissionName of Object.keys(entity.permission)) {
      proxy[entityName][permissionName] = `${entityName}:${permissionName}`;
    }
  }

  return proxy as PermissionProxy<TInput>;
}
