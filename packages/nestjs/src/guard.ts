import { Reflector } from "@nestjs/core";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import {
  Injectable,
  Inject,
  ForbiddenException,
  InternalServerErrorException,
  Logger
} from "@nestjs/common";

import { PermifyService } from "./service.js";
import { PermissionModes } from "./decorators.js";
import { PERMIFY_PERMISSION_KEY } from "./constant.js";
import type { CheckPermissionMetadata } from "./interfaces.js";

/**
 * Guard that enforces Permify permission checks.
 *
 * This guard uses the permission string defined via the `@CheckPermission()`
 * decorator and resolves the necessary context (tenant, subject, resource)
 * using the {@link PermifyService}.
 *
 * @example
 * ```typescript
 * @UseGuards(PermifyGuard)
 * @CheckPermission('document.view')
 * @Controller('documents')
 * export class DocumentsController {}
 * ```
 */
@Injectable()
export class PermifyGuard implements CanActivate {
  private readonly logger = new Logger(PermifyGuard.name);

  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PermifyService) private readonly permifyService: PermifyService
  ) {}

  /**
   * Logical entry point for the guard.
   *
   * Resolves the permission, tenant, subject, and resource, then performs
   * a permission check against the Permify server.
   *
   * @param context - The NestJS execution context.
   * @returns `true` if access is allowed, throws `ForbiddenException` otherwise.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadataRaw = this.reflector.getAllAndOverride<
      CheckPermissionMetadata | string
    >(PERMIFY_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!metadataRaw) {
      return true;
    }

    // Normalizing string into object structure for backward compatibility
    const permissionMeta: CheckPermissionMetadata =
      typeof metadataRaw === "string"
        ? { permissions: [metadataRaw], mode: PermissionModes.AND }
        : metadataRaw;

    const tenantId = await this.permifyService.resolveTenant(context);
    const subject = await this.permifyService.resolveSubject(context);
    const resource = await this.permifyService.resolveResource(context);

    if (!resource) {
      throw new ForbiddenException("Resource could not be resolved");
    }

    const checks: {
      entity: { type: string; id: string };
      permission: string;
    }[] = [];

    for (const permission of permissionMeta.permissions) {
      let resourceParam: { type: string; id: string };
      let finalPermission: string;

      // Split permission to check for override: e.g. "organization.manage"
      const permissionParts = permission.split(".");
      const hasOverride = permissionParts.length > 1;

      if (typeof resource === "string") {
        // If resource is just an ID, we expect permission to be "type.action"
        if (!hasOverride) {
          throw new ForbiddenException(
            "Invalid permission format: When resource is a string, permission must be in 'type.action' format"
          );
        }
        resourceParam = { type: permissionParts[0], id: resource };
        finalPermission = permissionParts[1];
      } else {
        if (hasOverride) {
          // Override the type from the resource
          resourceParam = { type: permissionParts[0], id: resource.id };
          finalPermission = permissionParts[1];
        } else {
          resourceParam = resource;
          finalPermission = permission;
        }
      }

      checks.push({ entity: resourceParam, permission: finalPermission });
    }

    let subjectParam: { type: string; id: string };
    if (typeof subject === "string") {
      subjectParam = { type: "user", id: subject };
    } else {
      subjectParam = subject;
    }

    // The Permify gRPC server requires PermissionCheckRequestMetadata to be
    // present with a `depth` value >= 3. When no metadata resolver is
    // provided, we default to { depth: 20 } so the check works
    // out-of-the-box.
    const metadata = (await this.permifyService.resolveMetadata(context)) ?? {
      depth: 20
    };

    try {
      const results = await this.permifyService.evaluatePermissions({
        tenantId,
        metadata,
        subject: {
          type: subjectParam.type,
          id: subjectParam.id
        },
        checks
      });

      if (permissionMeta.mode === PermissionModes.AND) {
        const failedCheck = results.find((r) => !r.allowed);
        if (failedCheck) {
          const msg = `Permission denied: ${failedCheck.permission} failed (mode: AND)`;
          this.logger.warn(msg);
          throw new ForbiddenException(msg);
        }
        return true;
      }

      if (permissionMeta.mode === PermissionModes.OR) {
        const anyAllowed = results.some((r) => r.allowed);
        if (!anyAllowed) {
          const required = permissionMeta.permissions.join(", ");
          const msg = `None of the required permissions were granted: ${required}`;
          this.logger.warn(msg);
          throw new ForbiddenException(msg);
        }
        return true;
      }

      return false;
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      this.logger.error("Permission check execution failed", err);
      // Propagate technical/system errors as 500 rather than swallowing them as 403
      throw new InternalServerErrorException(
        "Permission check execution failed"
      );
    }
  }
}
