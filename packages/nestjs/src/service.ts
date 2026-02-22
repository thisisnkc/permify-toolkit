import { Reflector } from "@nestjs/core";
import { Injectable, Inject, type ExecutionContext } from "@nestjs/common";
import {
  createPermifyClient,
  checkPermission,
  type CheckPermissionParams
} from "@permify-toolkit/core";

import { PERMIFY_MODULE_OPTIONS, PERMIFY_RESOLVERS_KEY } from "./constant.js";
import type {
  ResolvedPermifyOptions,
  PermifyResolvers,
  PermifySubject
} from "./interfaces.js";

/**
 * Service providing Permify authorization capabilities to NestJS.
 *
 * This service wraps the Permify gRPC client and provides helper methods
 * for resolving authorization context (tenant, subject, resource) from
 * NestJS execution contexts.
 */
@Injectable()
export class PermifyService {
  private readonly client: ReturnType<typeof createPermifyClient>;

  constructor(
    @Inject(PERMIFY_MODULE_OPTIONS)
    private readonly options: ResolvedPermifyOptions,
    @Inject(Reflector)
    private readonly reflector: Reflector
  ) {
    this.client = createPermifyClient(this.options.client);
  }

  /**
   * Checks if a subject has permission on a specific entity.
   *
   * This is a low-level method that wraps the core `checkPermission` utility.
   * For most NestJS use cases, prefer using the `@CheckPermission()` decorator
   * and the `PermifyGuard`.
   *
   * @param params - The permission check parameters.
   * @returns A promise that resolves to `true` if access is allowed, `false` otherwise.
   *
   * @example
   * ```typescript
   * const allowed = await permifyService.checkPermission({
   *   tenantId: 'default',
   *   subject: { type: 'user', id: '1' },
   *   entity: { type: 'document', id: 'doc-abc' },
   *   permission: 'view',
   * });
   * ```
   */
  async checkPermission(params: CheckPermissionParams): Promise<boolean> {
    return checkPermission(this.client, params);
  }

  /**
   * Resolves the Permify tenant ID for the current execution context.
   *
   * Resolution precedence:
   * 1. Method-level `@PermifyResolvers({ tenant: ... })`
   * 2. Controller-level `@PermifyResolvers({ tenant: ... })`
   * 3. Global modules options `resolvers.tenant`
   * 4. Static tenant ID in module configuration
   *
   * @param context - The NestJS execution context.
   * @returns The resolved tenant ID string.
   * @throws {Error} If no tenant ID can be resolved.
   */
  async resolveTenant(context: ExecutionContext): Promise<string> {
    const resolvers = this.getResolvers(context);
    const resolver = resolvers?.tenant || this.options.resolvers?.tenant;

    if (resolver) {
      return resolver(context);
    }

    if (this.options.tenant) {
      return this.options.tenant;
    }

    throw new Error(
      "Tenant resolver is not defined and no tenant found in config"
    );
  }

  /**
   * Resolves the Permify subject for the current execution context.
   *
   * Resolution precedence:
   * 1. Method-level `@PermifyResolvers({ subject: ... })`
   * 2. Controller-level `@PermifyResolvers({ subject: ... })`
   * 3. Global modules options `resolvers.subject`
   *
   * @param context - The NestJS execution context.
   * @returns The resolved subject (string ID or {@link PermifySubject}).
   * @throws {Error} If no subject resolver is defined.
   */
  async resolveSubject(
    context: ExecutionContext
  ): Promise<string | PermifySubject> {
    const resolvers = this.getResolvers(context);
    const resolver = resolvers?.subject || this.options.resolvers?.subject;

    if (!resolver) {
      throw new Error("Permify Subject resolver is not defined.");
    }

    return resolver(context);
  }

  /**
   * Resolves the target resource for the current execution context.
   *
   * Resolution precedence:
   * 1. Method-level `@PermifyResolvers({ resource: ... })`
   * 2. Controller-level `@PermifyResolvers({ resource: ... })`
   * 3. Global modules options `resolvers.resource`
   *
   * @param context - The NestJS execution context.
   * @returns The resolved resource, or `undefined` if no resource resolver is set.
   */
  async resolveResource(
    context: ExecutionContext
  ): Promise<string | PermifySubject | undefined> {
    const resolvers = this.getResolvers(context);
    const resolver = resolvers?.resource || this.options.resolvers?.resource;

    if (!resolver) {
      return undefined;
    }

    return resolver(context);
  }

  /**
   * Resolves optional permission check metadata for the current context.
   *
   * Resolution precedence:
   * 1. Method-level `@PermifyResolvers({ metadata: ... })`
   * 2. Controller-level `@PermifyResolvers({ metadata: ... })`
   * 3. Global modules options `resolvers.metadata`
   *
   * @param context - The NestJS execution context.
   * @returns The resolved metadata object, or `undefined` if no metadata resolver is set.
   */
  async resolveMetadata(context: ExecutionContext): Promise<
    | {
        snapToken?: string;
        schemaVersion?: string;
        depth?: number;
        [key: string]: unknown;
      }
    | undefined
  > {
    const resolvers = this.getResolvers(context);
    const resolver = resolvers?.metadata || this.options.resolvers?.metadata;

    if (!resolver) {
      return undefined;
    }

    return resolver(context);
  }

  /**
   * Retrieves the resolvers metadata relative to the context.
   * Utilizes `getAllAndOverride` to enforce Route > Controller precedence.
   */
  private getResolvers(
    context: ExecutionContext
  ): PermifyResolvers | undefined {
    return this.reflector.getAllAndOverride<PermifyResolvers>(
      PERMIFY_RESOLVERS_KEY,
      [context.getHandler(), context.getClass()].filter(Boolean)
    );
  }
}
