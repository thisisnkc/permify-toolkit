export {
  schema,
  entity,
  relation,
  attribute,
  permission,
  type SchemaInput,
  type SchemaHandle,
  type PermissionProxy,
  type EntityDef,
  type RelationDef,
  type AttributeDef,
  type PermissionDef
} from "./schema/define-schema.js";

export { relationsOf } from "./schema/helpers.js";

export { writeSchemaToPermify } from "./schema/write-schema.js";

export {
  defineConfig,
  validateConfig,
  schemaFile,
  SeedingMode,
  type PermifyConfigOptions as Config
} from "./config.js";

export { loadConfig } from "./load-config.js";

export {
  createPermifyClient,
  clientOptionsFromEnv,
  type PermifyClientOptions
} from "./client/index.js";

export {
  writeRelationships,
  deleteRelationships,
  type Relationship,
  type DeleteRelationshipsParams
} from "./data/write-relationships.js";

export {
  checkPermission,
  type CheckPermissionParams
} from "./permission/check-permission.js";
