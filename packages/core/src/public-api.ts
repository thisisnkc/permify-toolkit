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
  type PermifyConfig as Config
} from "./config.js";
