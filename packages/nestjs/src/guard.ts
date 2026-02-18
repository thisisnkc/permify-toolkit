import { Reflector } from "@nestjs/core";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Injectable, Inject, ForbiddenException, Logger } from "@nestjs/common";

import { PermifyService } from "./service.js";
import { PERMIFY_PERMISSION_KEY } from "./constant.js";

@Injectable()
export class PermifyGuard implements CanActivate {
  private readonly logger = new Logger(PermifyGuard.name);

  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PermifyService) private readonly permifyService: PermifyService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<string>(
      PERMIFY_PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!permission) {
      return true;
    }

    const tenantId = await this.permifyService.resolveTenant(context);
    const subject = await this.permifyService.resolveSubject(context);
    const resource = await this.permifyService.resolveResource(context);

    if (!resource) {
      throw new ForbiddenException("Resource could not be resolved");
    }

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
      // Resource is { type, id }
      if (hasOverride) {
        // Override the type from the resource
        resourceParam = { type: permissionParts[0], id: resource.id };
        finalPermission = permissionParts[1];
      } else {
        // Use the type from the resource
        resourceParam = resource;
        finalPermission = permission;
      }
    }

    let subjectParam: { type: string; id: string };
    if (typeof subject === "string") {
      subjectParam = { type: "user", id: subject };
    } else {
      subjectParam = subject;
    }

    const metadata = await this.permifyService.resolveMetadata(context);

    try {
      const allowed = await this.permifyService.checkPermission({
        tenantId,
        metadata,
        subject: {
          type: subjectParam.type,
          id: subjectParam.id
        },
        entity: {
          type: resourceParam.type,
          id: resourceParam.id
        },
        permission: finalPermission
      });

      return allowed;
    } catch (err) {
      this.logger.error("Permission check failed", err);
      throw new ForbiddenException();
    }
  }
}
