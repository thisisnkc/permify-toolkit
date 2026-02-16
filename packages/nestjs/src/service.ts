import { Reflector } from "@nestjs/core";
import { Injectable, Inject, type ExecutionContext } from "@nestjs/common";
import {
  createPermifyClient,
  checkPermission,
  type CheckPermissionParams
} from "@permify-toolkit/core";

import { PERMIFY_MODULE_OPTIONS, PERMIFY_RESOLVERS_KEY } from "./constant.js";
import type {
  PermifyModuleOptions,
  PermifyResolvers,
  PermifySubject
} from "./interfaces.js";

@Injectable()
export class PermifyService {
  private readonly client: ReturnType<typeof createPermifyClient>;

  constructor(
    @Inject(PERMIFY_MODULE_OPTIONS)
    private readonly options: PermifyModuleOptions,
    @Inject(Reflector)
    private readonly reflector: Reflector
  ) {
    this.client = createPermifyClient(this.options.client);
  }

  /**
   * Checks permission using the initialized Permify client.
   *
   * @param params - The permission check parameters.
   * @returns true if access is allowed, false otherwise.
   */
  async checkPermission(params: CheckPermissionParams): Promise<boolean> {
    return checkPermission(this.client, params);
  }

  /**
   * Resolves the tenant ID for the current execution context.
   * Priority: Route > Controller > Global
   *
   * @param context - The execution context.
   * @returns The resolved tenant ID.
   */
  async resolveTenant(context: ExecutionContext): Promise<string> {
    const resolvers = this.getResolvers(context);
    const resolver = resolvers?.tenant || this.options.resolvers.tenant;
    return resolver(context);
  }

  /**
   * Resolves the subject for the current execution context.
   * Priority: Route > Controller > Global
   *
   * @param context - The execution context.
   * @returns The resolved subject.
   */
  async resolveSubject(
    context: ExecutionContext
  ): Promise<string | PermifySubject> {
    const resolvers = this.getResolvers(context);
    const resolver = resolvers?.subject || this.options.resolvers.subject;

    if (!resolver) {
      throw new Error("Permify Subject resolver is not defined.");
    }

    return resolver(context);
  }

  /**
   * Resolves the resource for the current execution context.
   * Priority: Route > Controller > Global
   *
   * @param context - The execution context.
   * @returns The resolved resource.
   */
  async resolveResource(
    context: ExecutionContext
  ): Promise<string | PermifySubject | undefined> {
    const resolvers = this.getResolvers(context);
    const resolver = resolvers?.resource || this.options.resolvers.resource;

    if (!resolver) {
      return undefined;
    }

    return resolver(context);
  }

  /**
   * Resolves the metadata for the current execution context.
   * Priority: Route > Controller > Global
   *
   * @param context - The execution context.
   * @returns The resolved metadata object or undefined.
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
    const resolver = resolvers?.metadata || this.options.resolvers.metadata;

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
