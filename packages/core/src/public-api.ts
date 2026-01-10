export {
  defineSchema,
  entity,
  relation,
  attribute,
  permission,
  type DefineSchemaInput,
  type SchemaHandle,
  type PermissionProxy,
  type EntityDef,
  type RelationDef,
  type AttributeDef,
  type PermissionDef
} from "./schema/define-schema.js";

export { relationsOf } from "./schema/helpers.js";

export { writeSchemaToPermify } from "./schema/write-schema.js";
