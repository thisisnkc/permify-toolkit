import { SetMetadata } from "@nestjs/common";

import { PERMIFY_PERMISSION_KEY } from "./constant.js";

/**
 * Decorator to enforce a Permify permission check on a method or controller.
 *
 * The permission string is used by the {@link PermifyGuard}. If the resource
 * resolved is a string ID, the permission should be in `type.action` format
 * (e.g. `document.view`). If the resource is a {@link PermifySubject},
 * the permission can be just the action name.
 *
 * @param permission - The permission or relation to check.
 *
 * @example
 * ```typescript
 * @CheckPermission('document.edit')
 * @Post(':id')
 * update(@Param('id') id: string) { ... }
 * ```
 */
export const CheckPermission = (permission: string) =>
  SetMetadata(PERMIFY_PERMISSION_KEY, permission);
