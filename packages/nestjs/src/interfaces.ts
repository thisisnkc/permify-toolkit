import type { PermifyClientOptions } from "@permify-toolkit/core";
import {
  type ExecutionContext,
  type ModuleMetadata,
  type Type,
  SetMetadata
} from "@nestjs/common";

import { PERMIFY_RESOLVERS_KEY } from "./constant.js";

export interface PermifySubject {
  type: string;
  id: string;
}

export type TenantResolver = (
  context: ExecutionContext
) => string | Promise<string>;

export type SubjectResolver = (
  context: ExecutionContext
) => string | PermifySubject | Promise<string | PermifySubject>;

export type ResourceResolver = (
  context: ExecutionContext
) => string | PermifySubject | Promise<string | PermifySubject>;

export type MetadataResolver = (context: ExecutionContext) =>
  | {
      snapToken?: string;
      schemaVersion?: string;
      depth?: number;
      // Allow other metadata keys to be passed to the Permify client
      [key: string]: unknown;
    }
  | Promise<{
      snapToken?: string;
      schemaVersion?: string;
      depth?: number;
      // Allow other metadata keys to be passed to the Permify client
      [key: string]: unknown;
    }>;

export interface PermifyResolvers {
  tenant: TenantResolver;
  subject?: SubjectResolver;
  resource?: ResourceResolver;
  metadata?: MetadataResolver;
}

/**
 * Decorator to override Permify resolvers at the controller or method level.
 *
 * @param resolvers - The resolvers to override (tenant, subject).
 */
export const PermifyResolvers = (resolvers: Partial<PermifyResolvers>) =>
  SetMetadata(PERMIFY_RESOLVERS_KEY, resolvers);

export interface PermifyModuleOptions {
  client: PermifyClientOptions;
  resolvers: PermifyResolvers;
}

export interface PermifyModuleOptionsFactory {
  createPermifyOptions(): Promise<PermifyModuleOptions> | PermifyModuleOptions;
}

export interface PermifyModuleAsyncOptions extends Pick<
  ModuleMetadata,
  "imports"
> {
  useExisting?: Type<PermifyModuleOptionsFactory>;
  useClass?: Type<PermifyModuleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<PermifyModuleOptions> | PermifyModuleOptions;
  inject?: any[];
}
