import { validateSchema } from "./validate.js";
import { compileToPermify } from "./compiler.js";
import type {
  SchemaAST,
  RelationNode,
  PermissionNode,
  AttributeNode
} from "./ast.js";

/**
 * Defines a relation to one or more target entities.
 */
export interface RelationDef {
  /** Target entity types (e.g. `['user']`, `['user', 'organization#member']`). */
  targets: string[];
}

/**
 * Defines an attribute with a specific type.
 */
export interface AttributeDef {
  /** Attribute type (e.g. `string`, `boolean`, `integer`). */
  type: string;
}

/**
 * Defines a permission using a relational expression.
 */
export interface PermissionDef {
  /** Permission logic (e.g. `owner or editor`, `organization.admin`). */
  expression: string;
}

/**
 * Encapsulates the relations, permissions, and attributes of an entity.
 */
export interface EntityDef {
  /** Relationships to other entities. */
  relations?: Record<string, RelationDef>;
  /** Fine-grained permissions and access control logic. */
  permissions?: Record<string, PermissionDef>;
  /** Key-value data associated with the entity. */
  attributes?: Record<string, AttributeDef>;
}

/**
 * Defines an entity with its associated relations, permissions, and attributes.
 *
 * Use this within a {@link schema} call to build your authorization model.
 *
 * @param def - The entity structure.
 * @returns The entity definition object.
 *
 * @example
 * ```typescript
 * entity({
 *   relations: {
 *     owner: relation('user'),
 *   },
 *   permissions: {
 *     edit: permission('owner'),
 *   }
 * })
 * ```
 */
export function entity(def: EntityDef): EntityDef {
  return def;
}

/**
 * Defines a relationship to one or more target entity types.
 *
 * Targets can be simple entity types (e.g. `'user'`) or scoped
 * relations (e.g. `'organization#member'`).
 *
 * @param targets - One or more target entity types.
 * @returns A relation definition object.
 *
 * @example
 * ```typescript
 * // Simple relation
 * relation('user')
 *
 * // Multiple targets
 * relation('user', 'workspace#member')
 * ```
 */
export function relation(...targets: string[]): RelationDef {
  return { targets };
}

/**
 * Defines an attribute with a specific type.
 *
 * Attributes allow you to store data (e.g. `boolean`, `integer`)
 * directly on entities for use in permission expressions.
 *
 * @param type - The primitive type of the attribute.
 * @returns An attribute definition object.
 *
 * @example
 * ```typescript
 * attribute('boolean')
 * attribute('integer')
 * ```
 */
export function attribute(type: string): AttributeDef {
  return { type };
}

/**
 * Defines a permission using an expression of relations and attributes.
 *
 * Expressions support logic operators like `or`, `and`, and `not`,
 * as well as traversal (e.g. `folder.parent.view`).
 *
 * @param expression - The relational permission logic.
 * @returns A permission definition object.
 *
 * @example
 * ```typescript
 * permission('owner or editor')
 * permission('organization.admin and not blocked')
 * ```
 */
export function permission(expression: string): PermissionDef {
  return { expression };
}

// --- Schema Definition ---

/**
 * User-facing schema definition input.
 * Maps entity names to their entity definitions.
 *
 * @example
 * ```ts
 * const schema = schema({
 *   user: entity({}),
 *   organization: entity({
 *     relations: {
 *       member: relation('user')
 *     },
 *     permissions: {
 *       view: permission('member')
 *     }
 *   })
 * })
 * ```
 */
export interface SchemaInput {
  [entityName: string]: EntityDef;
}

/**
 * Schema handle returned by schema.
 * Provides methods to validate, compile, and access typed permissions.
 */
export interface SchemaHandle<TInput extends SchemaInput = SchemaInput> {
  /** Raw AST representation */
  readonly ast: SchemaAST;
  /** Validate schema integrity */
  validate(): void;
  /** Compile to Permify DSL string */
  compile(): string;
  /** Type-safe permission string access */
  readonly permissions: PermissionProxy<TInput>;
}

/**
 * Type-safe permission proxy.
 * Provides autocomplete for entity.permission -> "entity:permission"
 */
export type PermissionProxy<TInput extends SchemaInput> = {
  [Entity in keyof TInput]: TInput[Entity] extends { permissions: infer P }
    ? { [Permission in keyof P & string]: `${Entity & string}:${Permission}` }
    : Record<string, never>;
};

/**
 * Defines a Permify authorization schema.
 * Validates structure and provides typed permission access.
 *
 * @param input - Entity definitions
 * @returns Schema handle with validation, compilation, and typed permissions
 * @throws {Error} If schema validation fails
 *
 * @example
 * ```ts
 * const schema = schema({
 *   user: entity({}),
 *   document: entity({
 *     relations: {
 *       owner: relation('user')
 *     },
 *     permissions: {
 *       view: permission('owner')
 *     }
 *   })
 * })
 *
 * const dsl = schema.compile()
 * const perm = schema.permissions.document.view // "document:view"
 * ```
 */
export function schema<TInput extends SchemaInput>(
  input: TInput
): SchemaHandle<TInput> {
  const ast = buildAST(input);
  validateSchema(ast);
  return createSchemaHandle(ast);
}

/**
 * Converts user input to internal AST representation.
 */
function buildAST(input: SchemaInput): SchemaAST {
  const entities: SchemaAST["entities"] = {};

  for (const [entityName, entityDef] of Object.entries(input)) {
    if (typeof entityDef !== "object" || entityDef === null) {
      throw new Error(
        `Entity definition for "${entityName}" must be an object (use entity({...}))`
      );
    }

    entities[entityName] = {
      name: entityName,
      relations: buildRelationNodes(entityDef.relations ?? {}),
      permissions: buildPermissionNodes(entityDef.permissions ?? {}),
      attributes: buildAttributeNodes(entityDef.attributes ?? {})
    };
  }

  return { entities };
}

/**
 * Converts relation definitions to AST nodes.
 */
function buildRelationNodes(
  relations: Record<string, RelationDef>
): Record<string, RelationNode> {
  const nodes: Record<string, RelationNode> = {};

  for (const [name, def] of Object.entries(relations)) {
    nodes[name] = {
      name,
      target: def.targets
    };
  }

  return nodes;
}

/**
 * Converts permission definitions to AST nodes.
 */
function buildPermissionNodes(
  permissions: Record<string, PermissionDef>
): Record<string, PermissionNode> {
  const nodes: Record<string, PermissionNode> = {};

  for (const [name, def] of Object.entries(permissions)) {
    nodes[name] = {
      name,
      expression: def.expression
    };
  }

  return nodes;
}

/**
 * Converts attribute definitions to AST nodes.
 */
function buildAttributeNodes(
  attributes: Record<string, AttributeDef>
): Record<string, AttributeNode> {
  const nodes: Record<string, AttributeNode> = {};

  for (const [name, def] of Object.entries(attributes)) {
    nodes[name] = {
      name,
      type: def.type
    };
  }

  return nodes;
}

/**
 * Creates the public schema handle with validation and compilation methods.
 */
function createSchemaHandle<TInput extends SchemaInput>(
  ast: SchemaAST
): SchemaHandle<TInput> {
  return {
    ast,
    validate: () => validateSchema(ast),
    compile: () => compileToPermify(ast),
    permissions: buildPermissionProxy<TInput>(ast)
  };
}

/**
 * Builds a runtime proxy for typed permission string access.
 * Returns empty object as typing provides the value.
 *
 * @example
 * schema.permissions.document.view → "document:view" (typed)
 */
function buildPermissionProxy<TInput extends SchemaInput>(
  ast: SchemaAST
): PermissionProxy<TInput> {
  const proxy: Record<string, Record<string, string>> = {};

  for (const [entityName, entity] of Object.entries(ast.entities)) {
    proxy[entityName] = {};

    for (const permissionName of Object.keys(entity.permissions)) {
      proxy[entityName][permissionName] = `${entityName}:${permissionName}`;
    }
  }

  return proxy as PermissionProxy<TInput>;
}
