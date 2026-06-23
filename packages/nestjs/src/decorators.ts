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
 * Requires the guard to have already run for this route. Returns an empty
 * array when no guard ran (public routes).
 *
 * @example
 * ```typescript
 * @UseGuards(PermifyGuard)
 * @CheckPermission(['document.view', 'document.edit'], { mode: 'OR' })
 * @Get(':id')
 * async get(@PermissionResult() results: PermissionCheckResult[]) {
 *   const canEdit = results.find(r => r.permission === 'edit')?.allowed;
 * }
 * ```
 */
export const PermissionResult = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PermissionCheckResult[] =>
    (ctx.switchToHttp().getRequest<Record<string, unknown>>()[
      PERMIFY_RESULT_KEY
    ] as PermissionCheckResult[] | undefined) ?? []
);
