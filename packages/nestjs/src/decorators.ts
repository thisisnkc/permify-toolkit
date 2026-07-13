import {
  SetMetadata,
  createParamDecorator,
  type ExecutionContext
} from "@nestjs/common";

import type { PermissionCheckResult } from "./interfaces.js";
import { PERMIFY_PERMISSION_KEY, PERMIFY_RESULT_KEY } from "./constant.js";

/**
 * Defines the logical mode applied when multiple permissions are provided.
 */
export type PermissionMode = "AND" | "OR";

/**
 * Standard logical modes for evaluating multiple permissions.
 */
export const PermissionModes = {
  AND: "AND",
  OR: "OR"
} as const;

/**
 * Options for complex permission checks.
 */
export interface CheckPermissionOptions {
  /**
   * The logical operator applied when evaluating multiple permissions.
   * - "AND": Requires granting ALL provided permissions.
   * - "OR": Requires granting AT LEAST ONE provided permission.
   *
   * @default "AND"
   */
  mode?: PermissionMode;
}

/**
 * Decorator to enforce a Permify permission check on a method or controller.
 *
 * It accepts either a single permission string or an array of permissions,
 * and an optional mode configuring "AND" / "OR" logic defaults to "AND".
 *
 * @param permissions - The permission(s) or relation(s) to check.
 * @param options - Configuration including operational 'mode'.
 *
 * @example
 * ```typescript
 * @CheckPermission('document.edit')
 * @CheckPermission(['document.view', 'document.edit'])
 * @CheckPermission(['admin', 'editor'], { mode: 'OR' })
 * @Post(':id')
 * update(@Param('id') id: string) { ... }
 * ```
 */
export const CheckPermission = (
  permissions: string | string[],
  options?: CheckPermissionOptions
) => {
  const normalizedPermissions = Array.isArray(permissions)
    ? permissions
    : [permissions];

  if (normalizedPermissions.length === 0) {
    throw new Error(
      "CheckPermission decorator requires at least one permission string."
    );
  }

  const mode: PermissionMode = options?.mode ?? PermissionModes.AND;

  if (mode !== PermissionModes.AND && mode !== PermissionModes.OR) {
    throw new Error(
      `Invalid permission mode '${mode}'. Expected 'AND' or 'OR'.`
    );
  }

  return SetMetadata(PERMIFY_PERMISSION_KEY, {
    permissions: normalizedPermissions,
    mode
  });
};

/**
 * Parameter decorator that injects the permission check results computed by
 * {@link PermifyGuard} into the handler method.
 *
 * Without an argument it injects the full results array. With a permission
 * name it injects a single boolean — `true` only when that permission was
 * checked and granted. Qualified names ("document.edit") match the bare
 * form stored by the guard ("edit").
 *
 * Requires the guard to have already run for this route. When no guard ran
 * (public routes), the array form returns `[]` and the boolean form
 * returns `false`.
 *
 * @example
 * ```typescript
 * @UseGuards(PermifyGuard)
 * @CheckPermission(['document.view', 'document.edit'], { mode: 'OR' })
 * @Get(':id')
 * async get(
 *   @PermissionResult() results: PermissionCheckResult[],
 *   @PermissionResult('document.edit') canEdit: boolean
 * ) { ... }
 * ```
 */
export const PermissionResult = createParamDecorator(
  (
    data: string | undefined,
    ctx: ExecutionContext
  ): PermissionCheckResult[] | boolean => {
    const results =
      (ctx.switchToHttp().getRequest<Record<string, unknown>>()[
        PERMIFY_RESULT_KEY
      ] as PermissionCheckResult[] | undefined) ?? [];

    if (data === undefined) {
      return results;
    }

    const parts = data.split(".");
    const bare = parts.length > 1 ? parts[1] : data;
    return results.some((r) => r.permission === bare && r.allowed);
  }
);
