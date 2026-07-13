import type { SchemaHandle, PermissionName } from "@permify-toolkit/core";

import {
  CheckPermission,
  PermissionResult,
  type CheckPermissionOptions
} from "./decorators.js";

/**
 * Creates decorators typed against a specific schema.
 *
 * The returned `CheckPermission` and `PermissionResult` behave identically
 * to the base decorators but only accept identifiers that exist in the given
 * schema — both qualified (`"document.view"`) and bare (`"view"`) forms.
 * Invalid names are a compile error, and editors autocomplete the valid ones.
 *
 * Bind it once to your schema and re-export it from your auth module.
 *
 * @example
 * ```typescript
 * // auth.ts
 * import { createPermifyDecorators } from '@permify-toolkit/nestjs';
 * import { appSchema } from './permify.config';
 *
 * export const { CheckPermission, PermissionResult } =
 *   createPermifyDecorators<typeof appSchema>();
 *
 * // controller.ts
 * @CheckPermission('document.edit') // OK
 * @CheckPermission('document.xyz')  // compile error
 * ```
 */
export function createPermifyDecorators<H extends SchemaHandle>() {
  type Name = PermissionName<H>;

  return {
    CheckPermission: (
      permissions: Name | Name[],
      options?: CheckPermissionOptions
    ) => CheckPermission(permissions, options),
    PermissionResult: (permission?: Name) => PermissionResult(permission)
  };
}
