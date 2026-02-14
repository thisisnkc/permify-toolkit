import { Reflector } from "@nestjs/core";
import { createPermifyClient } from "@permify-toolkit/core";
import { Injectable, Inject, type ExecutionContext } from "@nestjs/common";

import { PERMIFY_MODULE_OPTIONS, PERMIFY_RESOLVERS_KEY } from "./constant.js";
import type {
  PermifyModuleOptions,
  PermifyResolvers,
  PermifySubject
} from "./interfaces.js";

@Injectable()
export class PermifyService {
  readonly client: ReturnType<typeof createPermifyClient>;

  constructor(
    @Inject(PERMIFY_MODULE_OPTIONS)
    private readonly options: PermifyModuleOptions,
    @Inject(Reflector)
    private readonly reflector: Reflector
  ) {
    this.client = createPermifyClient(options.client);
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
   * Retrieves the resolvers metadata relative to the context.
   * Utilizes `getAllAndOverride` to enforce Route > Controller precedence.
   */
  private getResolvers(
    context: ExecutionContext
  ): PermifyResolvers | undefined {
    return this.reflector.getAllAndOverride<PermifyResolvers>(
      PERMIFY_RESOLVERS_KEY,
      [context.getHandler(), context.getClass()]
    );
  }
}
