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
  type PermifyConfigOptions as Config
} from "./config.js";

export {
  createPermifyClient,
  clientOptionsFromEnv,
  type PermifyClientOptions
} from "./client/index.js";
